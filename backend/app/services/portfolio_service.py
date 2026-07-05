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
    if any(k in n for k in ("etf", "nifty bees", "junior bees", "bank bees")):
        return "etf"
    if any(k in n for k in ("equity", "shares", "stock")):
        return "equity"
    return "mutual_fund"


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

        holdings_count = len(result["holdings"])
        total_invested = Decimal("0")

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

        # Delete all other portfolios and assets for this user so only the newly uploaded one remains
        other_portfolios = supabase.from_table("portfolios").eq("user_id", user_id).neq("id", portfolio_id).select("id").execute()
        other_portfolio_ids = [p["id"] for p in (other_portfolios.data if isinstance(other_portfolios.data, list) else [])]
        for old_pid in other_portfolio_ids:
            supabase.from_table("assets").eq("portfolio_id", old_pid).delete().execute()
            supabase.from_table("portfolios").eq("id", old_pid).delete().execute()

        # Delete any existing assets for the current portfolio (in case of re-parse)
        supabase.from_table("assets").eq("portfolio_id", portfolio_id).delete().execute()

        for h in result["holdings"]:
            scheme_code = None
            if source == "cas":
                try:
                    resp = httpx.get(settings.mfapi_base_url, timeout=10)
                    schemes = resp.json()
                    for s in schemes:
                        if h["scheme_name"].lower() in s.get("schemeName", "").lower():
                            scheme_code = str(s.get("schemeCode", ""))
                            break
                except Exception:
                    pass

            asset_data = {
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "asset_type": _map_asset_type(h["scheme_name"]),
                "asset_class": "other",
                "ticker": None,
                "scheme_code": scheme_code,
                "name": h["scheme_name"],
                "isin": h["isin"],
                "quantity": str(h["units"]),
                "cost_basis": str(h["cost_basis"]) if h["cost_basis"] else None,
                "current_price": str(h["nav"]),
                "market_value": str(h["market_value"]),
                "metadata": {},
            }
            if not asset_data["scheme_code"] and not asset_data["ticker"]:
                isin = h["isin"] or ""
                asset_data["scheme_code"] = (
                    f"{'EQ' if asset_data['asset_type'] == 'equity' else 'MF'}-{isin[:8]}"
                    if isin
                    else f"{'EQ' if asset_data['asset_type'] == 'equity' else 'MF'}-{h['scheme_name'][:20]}"
                )
            supabase.from_table("assets").insert(asset_data).execute()
            if h["cost_basis"]:
                total_invested += h["cost_basis"]

        update_data = {
            "upload_status": "completed",
            "total_value": str(result["total_value"]),
            "total_invested": str(total_invested) if total_invested else str(result["total_invested"]),
            "parse_error": None,
        }

        if result["as_of_date"]:
            # If already in YYYY-MM-DD
            import re
            if re.match(r"^\d{4}-\d{2}-\d{2}$", result["as_of_date"]):
                update_data["as_of_date"] = result["as_of_date"]
            else:
                try:
                    parts = result["as_of_date"].replace("-", "/").split("/")
                    if len(parts) == 3:
                        d, m, y = parts
                        if len(y) == 2:
                            y = "20" + y
                        # If year is first (YYYY/MM/DD)
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
    """Download screenshot, call parser, insert assets and complete portfolio status."""
    supabase = get_supabase()

    supabase.from_table("portfolios").eq("id", portfolio_id).update(
        {"upload_status": "processing"}
    ).execute()

    try:
        # Download image bytes
        image_bytes = supabase.storage_download(settings.supabase_storage_bucket, file_path)

        # Detect mime type from file path extension
        mime_type = "image/png"
        if file_path.lower().endswith(".jpg") or file_path.lower().endswith(".jpeg"):
            mime_type = "image/jpeg"
        elif file_path.lower().endswith(".webp"):
            mime_type = "image/webp"

        # Parse screenshot holdings
        result = parse_screenshot_image(image_bytes, mime_type, gemini_api_key)
        holdings_count = len(result["holdings"])
        total_invested = Decimal("0")

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

        # Delete all other portfolios and assets for this user (so only the screenshot remains)
        other_portfolios = supabase.from_table("portfolios").eq("user_id", user_id).neq("id", portfolio_id).select("id").execute()
        other_portfolio_ids = [p["id"] for p in (other_portfolios.data if isinstance(other_portfolios.data, list) else [])]
        for old_pid in other_portfolio_ids:
            supabase.from_table("assets").eq("portfolio_id", old_pid).delete().execute()
            supabase.from_table("portfolios").eq("id", old_pid).delete().execute()

        # Delete any existing assets for the current portfolio (in case of re-parse)
        supabase.from_table("assets").eq("portfolio_id", portfolio_id).delete().execute()

        for h in result["holdings"]:
            # Determine mapping type
            mapped_type = h.get("asset_type")
            if not mapped_type or mapped_type not in ("equity", "mutual_fund", "etf", "bond", "cash", "other"):
                mapped_type = _map_asset_type(h["scheme_name"])

            qty = h["units"]
            if qty <= 0:
                if h["nav"] > 0:
                    qty = h["market_value"] / h["nav"]
                else:
                    qty = Decimal("1")

            asset_data = {
                "portfolio_id": portfolio_id,
                "user_id": user_id,
                "asset_type": mapped_type,
                "asset_class": "other",
                "ticker": None,
                "scheme_code": None,
                "name": h["scheme_name"],
                "isin": h.get("isin"),
                "quantity": str(qty),
                "cost_basis": str(h["cost_basis"]) if h.get("cost_basis") else None,
                "current_price": str(h["nav"]),
                "market_value": str(h["market_value"]),
                "metadata": {},
            }

            # Handle the constraint: check that either ticker or scheme_code is not null
            isin = h.get("isin") or ""
            if mapped_type == "equity":
                asset_data["ticker"] = isin if isin else f"EQ-{h['scheme_name'][:15]}"
            else:
                asset_data["scheme_code"] = isin if isin else f"MF-{h['scheme_name'][:15]}"

            supabase.from_table("assets").insert(asset_data).execute()
            if h.get("cost_basis"):
                total_invested += h["cost_basis"]

        update_data = {
            "upload_status": "completed",
            "total_value": str(result["total_value"]),
            "total_invested": str(total_invested) if total_invested else str(result["total_invested"]),
            "parse_error": None,
        }

        supabase.from_table("portfolios").eq("id", portfolio_id).update(update_data).execute()

        portfolio = supabase.from_table("portfolios").eq("id", portfolio_id).select().execute()
        logger.info("Parsed portfolio screenshot %s: %d holdings", portfolio_id, holdings_count)
        return portfolio.data[0] if isinstance(portfolio.data, list) else portfolio.data

    except Exception as e:
        supabase.from_table("portfolios").eq("id", portfolio_id).update({
            "upload_status": "failed",
            "parse_error": str(e),
        }).execute()
        logger.error("Failed to parse portfolio screenshot %s: %s", portfolio_id, e)
        raise

