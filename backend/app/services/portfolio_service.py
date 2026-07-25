"""Portfolio service — orchestrates PDF parsing and asset persistence."""

import logging
import tempfile
from decimal import Decimal

import httpx

from app.core.config import settings
from app.parsers.cas_parser import parse_cas_pdf
from app.parsers.generic_parser import parse_generic_pdf
from app.parsers.screenshot_parser import parse_screenshot_image
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def _map_asset_type(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ("etf", "nifty bees", "junior bees", "bank bees", "gold bees")):
        return "etf"
    if any(k in n for k in ("equity", "shares", "stock", "ltd", "limited", "inc")):
        return "equity"
    return "mutual_fund"


def _consolidate_holdings(holdings: list[dict]) -> list[dict]:
    """Merge duplicate holdings that represent the same instrument within a single statement.

    Deduplication key: ISIN (if present and valid), otherwise
    normalized scheme_name. Holdings with the same key have their
    units, market_value, and cost_basis consolidated.
    """
    groups: dict[str, dict] = {}
    for h in holdings:
        isin = (h.get("isin") or "").strip().upper()
        if isin and len(isin) >= 10:
            key = isin
        else:
            key = (h.get("scheme_name") or h.get("name") or "").strip().lower()
        if not key:
            key = "unknown_" + str(len(groups))

        if key in groups:
            existing = groups[key]
            existing["units"] = (existing.get("units") or 0) + (h.get("units") or 0)
            existing["market_value"] = (existing.get("market_value") or 0) + (h.get("market_value") or 0)
            cb = h.get("cost_basis")
            if cb:
                existing["cost_basis"] = (existing.get("cost_basis") or 0) + cb
            if h.get("nav"):
                existing["nav"] = h.get("nav")
        else:
            groups[key] = dict(h)

    return list(groups.values())


def _upsert_consolidated_assets(user_id: str, portfolio_id: str, new_holdings: list[dict], source_type: str = "pdf") -> tuple[Decimal, Decimal]:
    """Upsert assets for a user by intelligently reconciling holdings across statement uploads.
    
    If the same statement or identical holding snapshot is uploaded again, it updates current market prices 
    without duplicating quantities or doubling total portfolio amounts.
    """
    supabase = get_supabase()
    
    # Fetch all existing assets for user across all portfolios
    existing_assets_resp = supabase.from_table("assets").eq("user_id", user_id).select().execute()
    existing_assets = existing_assets_resp.data if isinstance(existing_assets_resp.data, list) else []
    
    lookup: dict[str, dict] = {}
    for a in existing_assets:
        isin = (a.get("isin") or "").strip().upper()
        if isin and len(isin) >= 10:
            key = isin
        else:
            key = (a.get("name") or "").strip().lower()
        if key:
            lookup[key] = a

    for h in new_holdings:
        isin = (h.get("isin") or "").strip().upper()
        name = (h.get("scheme_name") or h.get("name") or "").strip()
        key = isin if (isin and len(isin) >= 10) else name.lower()
        
        new_units = Decimal(str(h.get("units") or h.get("quantity") or 0))
        nav = Decimal(str(h.get("nav") or h.get("current_price") or 0))
        new_mkt_val = Decimal(str(h.get("market_value") or (new_units * nav)))
        new_cb = Decimal(str(h["cost_basis"])) if h.get("cost_basis") else Decimal("0")
        
        if key in lookup:
            # Reconcile existing holding
            exist = lookup[key]
            old_qty = Decimal(str(exist.get("quantity") or 0))
            old_cb = Decimal(str(exist.get("cost_basis") or 0))
            
            # Check if this is the same statement snapshot or an updated statement count
            if abs(new_units - old_qty) < Decimal("0.001"):
                # Same quantity snapshot — update prices and cost basis without adding duplicate quantity
                final_qty = old_qty
                final_cb = new_cb if new_cb > 0 else old_cb
            else:
                # Updated holding balance in statement (use statement's balance snapshot)
                final_qty = new_units if new_units > 0 else old_qty
                final_cb = new_cb if new_cb > 0 else old_cb

            final_mkt_val = final_qty * nav if nav > 0 else (new_mkt_val if new_mkt_val > 0 else Decimal(str(exist.get("market_value") or 0)))

            update_data = {
                "portfolio_id": portfolio_id, # Link asset to latest statement portfolio
                "quantity": str(final_qty),
                "cost_basis": str(final_cb) if final_cb > 0 else None,
                "current_price": str(nav) if nav > 0 else str(exist.get("current_price") or 0),
                "market_value": str(final_mkt_val),
            }
            supabase.from_table("assets").eq("id", exist["id"]).update(update_data).execute()
        else:
            # Insert brand new asset
            mapped_type = h.get("asset_type")
            if not mapped_type or mapped_type not in ("equity", "mutual_fund", "etf", "bond", "cash", "other"):
                mapped_type = _map_asset_type(name)
                
            scheme_code = f"{'EQ' if mapped_type == 'equity' else 'MF'}-{isin[:8]}" if isin else f"{'EQ' if mapped_type == 'equity' else 'MF'}-{name[:20]}"
            asset_data = {
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "asset_type": mapped_type,
                "asset_class": "other",
                "ticker": None,
                "scheme_code": scheme_code,
                "name": name,
                "isin": isin or None,
                "quantity": str(new_units),
                "cost_basis": str(new_cb) if new_cb > 0 else None,
                "current_price": str(nav),
                "market_value": str(new_mkt_val),
                "metadata": {"source": source_type},
            }
            inserted = supabase.from_table("assets").insert(asset_data).execute()
            if inserted.data and isinstance(inserted.data, list) and len(inserted.data) > 0:
                lookup[key] = inserted.data[0]

    # Calculate global total value & invested cost for this user
    all_user_assets = supabase.from_table("assets").eq("user_id", user_id).select().execute()
    user_asset_list = all_user_assets.data if isinstance(all_user_assets.data, list) else []
    
    total_val = Decimal("0")
    total_cost = Decimal("0")
    for a in user_asset_list:
        total_val += Decimal(str(a.get("market_value") or 0))
        if a.get("cost_basis"):
            total_cost += Decimal(str(a.get("cost_basis")))
            
    return total_val, total_cost


def process_portfolio_pdf(
    portfolio_id: str,
    user_id: str,
    file_path: str,
) -> dict:
    supabase = get_supabase()

    supabase.from_table("portfolios").eq("id", portfolio_id).update(
        {"upload_status": "processing"}
    ).execute()

    try:
        pdf_bytes = supabase.storage_download(settings.supabase_storage_bucket, file_path)

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # Try CAS parser first
        result = parse_cas_pdf(tmp_path)
        source = "cas"

        # Fall back to generic parser
        if not result["holdings"]:
            logger.info("CAS parser returned 0 holdings, trying generic parser")
            result = parse_generic_pdf(tmp_path)
            source = "generic"

        # Consolidate duplicate holdings within file
        result["holdings"] = _consolidate_holdings(result["holdings"])
        holdings_count = len(result["holdings"])

        if holdings_count == 0:
            update_data: dict = {
                "upload_status": "completed",
                "total_value": "0",
                "total_invested": "0",
                "parse_error": (
                    "Could not extract any holdings from this PDF. "
                    "Make sure it's a CAS statement, broker portfolio summary, "
                    "or mutual fund statement."
                ),
            }
            supabase.from_table("portfolios").eq("id", portfolio_id).update(update_data).execute()
            portfolio = supabase.from_table("portfolios").eq("id", portfolio_id).select().execute()
            logger.warning("No holdings extracted from portfolio %s", portfolio_id)
            return (portfolio.data[0] if isinstance(portfolio.data, list) else portfolio.data)

        # Reconcile and upsert holdings across statement uploads
        total_val, total_cost = _upsert_consolidated_assets(user_id, portfolio_id, result["holdings"], source_type=source)

        update_data = {
            "upload_status": "completed",
            "total_value": str(total_val),
            "total_invested": str(total_cost),
            "parse_error": None,
        }

        if result.get("as_of_date"):
            import re
            d_str = result["as_of_date"]
            if re.match(r"^\d{4}-\d{2}-\d{2}$", d_str):
                update_data["as_of_date"] = d_str
            else:
                try:
                    parts = d_str.replace("-", "/").split("/")
                    if len(parts) == 3:
                        d, m, y = parts
                        if len(y) == 2:
                            y = "20" + y
                        if len(d) == 4:
                            update_data["as_of_date"] = f"{d}-{m}-{y}"
                        else:
                            update_data["as_of_date"] = f"{y}-{m}-{d}"
                except Exception:
                    pass

        supabase.from_table("portfolios").eq("id", portfolio_id).update(update_data).execute()

        portfolio = supabase.from_table("portfolios").eq("id", portfolio_id).select().execute()
        logger.info("Parsed portfolio %s: %d holdings (source=%s)", portfolio_id, holdings_count, source)
        return portfolio.data[0] if isinstance(portfolio.data, list) else portfolio.data

    except Exception as e:
        supabase.from_table("portfolios").eq("id", portfolio_id).update({
            "upload_status": "failed",
            "parse_error": str(e),
        }).execute()
        logger.error("Failed to parse portfolio %s: %s", portfolio_id, e)
        raise


def get_pending_portfolios() -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("portfolios").eq("upload_status", "pending").select().execute()
    return result.data if isinstance(result.data, list) else []


def process_portfolio_screenshot(
    portfolio_id: str,
    user_id: str,
    file_path: str,
    gemini_api_key: str | None = None,
) -> dict:
    """Download screenshot, call parser, reconcile assets and complete portfolio status."""
    supabase = get_supabase()

    supabase.from_table("portfolios").eq("id", portfolio_id).update(
        {"upload_status": "processing"}
    ).execute()

    try:
        image_bytes = supabase.storage_download(settings.supabase_storage_bucket, file_path)

        mime_type = "image/png"
        if file_path.lower().endswith(".jpg") or file_path.lower().endswith(".jpeg"):
            mime_type = "image/jpeg"
        elif file_path.lower().endswith(".webp"):
            mime_type = "image/webp"

        result = parse_screenshot_image(image_bytes, mime_type, gemini_api_key)
        result["holdings"] = _consolidate_holdings(result["holdings"])
        holdings_count = len(result["holdings"])

        if holdings_count == 0:
            update_data = {
                "upload_status": "completed",
                "total_value": "0",
                "total_invested": "0",
                "parse_error": (
                    "Could not extract any holdings from this screenshot. "
                    "Make sure it is a clear screenshot of your broker holding dashboard."
                ),
            }
            supabase.from_table("portfolios").eq("id", portfolio_id).update(update_data).execute()
            portfolio = supabase.from_table("portfolios").eq("id", portfolio_id).select().execute()
            return portfolio.data[0] if isinstance(portfolio.data, list) else portfolio.data

        # Reconcile and upsert holdings across statement uploads
        total_val, total_cost = _upsert_consolidated_assets(user_id, portfolio_id, result["holdings"], source_type="screenshot")

        update_data = {
            "upload_status": "completed",
            "total_value": str(total_val),
            "total_invested": str(total_cost),
            "parse_error": None,
        }

        supabase.from_table("portfolios").eq("id", portfolio_id).update(update_data).execute()

        portfolio = supabase.from_table("portfolios").eq("id", portfolio_id).select().execute()
        logger.info("Parsed screenshot portfolio %s: %d holdings", portfolio_id, holdings_count)
        return portfolio.data[0] if isinstance(portfolio.data, list) else portfolio.data

    except Exception as e:
        supabase.from_table("portfolios").eq("id", portfolio_id).update({
            "upload_status": "failed",
            "parse_error": str(e),
        }).execute()
        logger.error("Failed to parse screenshot portfolio %s: %s", portfolio_id, e)
        raise


def delete_user_portfolio(portfolio_id: str, user_id: str) -> dict:
    """Delete a specific portfolio statement and its associated assets for a user."""
    supabase = get_supabase()

    p_resp = supabase.from_table("portfolios").eq("id", portfolio_id).eq("user_id", user_id).select().execute()
    p_data = p_resp.data if isinstance(p_resp.data, list) else []
    if not p_data:
        raise ValueError(f"Portfolio {portfolio_id} not found for user {user_id}")

    portfolio = p_data[0]

    # Delete all assets linked to this portfolio_id
    supabase.from_table("assets").eq("portfolio_id", portfolio_id).delete().execute()

    # Delete storage file if path exists
    file_path = portfolio.get("file_path")
    if file_path:
        try:
            supabase.storage_remove(settings.supabase_storage_bucket, [file_path])
        except Exception as e:
            logger.warning("Failed to delete storage file %s: %s", file_path, e)

    # Delete portfolio record
    supabase.from_table("portfolios").eq("id", portfolio_id).delete().execute()
    logger.info("Deleted portfolio %s and associated assets for user %s", portfolio_id, user_id)

    return {"status": "success", "deleted_portfolio_id": portfolio_id}
