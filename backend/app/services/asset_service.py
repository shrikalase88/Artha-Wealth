"""Asset service — CRUD operations via Supabase REST API."""

import logging
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from datetime import datetime, timezone
import httpx
import yfinance as yf

from app.supabase_client import get_supabase
from app.models.enums import UploadStatus
from uuid import UUID

logger = logging.getLogger(__name__)


def http_get_with_retry(url: str, timeout: int = 15, max_retries: int = 3) -> httpx.Response | None:
    import time
    for attempt in range(max_retries):
        try:
            resp = httpx.get(url, timeout=timeout)
            if resp.status_code == 200:
                return resp
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"HTTP GET failed after {max_retries} attempts for {url}: {e}")
                return None
            time.sleep(1 * (attempt + 1))
    return None


def get_assets_by_portfolio(portfolio_id: UUID) -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("assets").eq("portfolio_id", str(portfolio_id)).select().execute()
    return result.data if isinstance(result.data, list) else []


def get_assets_by_user(user_id: UUID) -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("assets").eq("user_id", str(user_id)).select().order("name").execute()
    return result.data if isinstance(result.data, list) else []


def get_pending_portfolios() -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("portfolios").eq("upload_status", UploadStatus.PENDING.value).select().execute()
    return result.data if isinstance(result.data, list) else []


def sync_user_assets(user_id: UUID) -> list[dict]:
    """Fetch live market values for all mutual funds and equities of the user and update the database."""
    supabase = get_supabase()
    
    # 1. Fetch user's assets
    assets_res = supabase.from_table("assets").eq("user_id", str(user_id)).select("*").execute()
    assets = assets_res.data or []
    if not assets:
        return []

    # Local cache for AMFI schemes (fetched lazily)
    amfi_schemes = None

    def get_amfi_schemes():
        nonlocal amfi_schemes
        if amfi_schemes is not None:
            return amfi_schemes
        try:
            resp = http_get_with_retry("https://api.mfapi.in/mf", timeout=20, max_retries=3)
            if resp and resp.status_code == 200:
                amfi_schemes = resp.json()
                return amfi_schemes
        except Exception as e:
            logger.error(f"Failed to fetch AMFI schemes: {e}")
        amfi_schemes = []
        return amfi_schemes

    # Categorize assets
    mf_to_fetch = []  # items: (asset_dict, scheme_code)
    equities_to_fetch = []  # items: (asset_dict, ticker)

    for asset in assets:
        asset_type = asset.get("asset_type")
        scheme_code = asset.get("scheme_code")
        ticker = asset.get("ticker")
        name = asset.get("name", "")
        isin = asset.get("isin")

        # Classify asset
        is_mf = asset_type == "mutual_fund" or (scheme_code and scheme_code.isdigit())
        
        if is_mf:
            # If scheme_code is numeric, we can query NAV directly
            if scheme_code and scheme_code.isdigit():
                mf_to_fetch.append((asset, scheme_code))
            else:
                # Resolve scheme_code by searching AMFI directory with token matching
                def clean_text(text: str) -> str:
                    t = text.lower()
                    t = t.replace("midcap", "mid cap")
                    t = t.replace("smallcap", "small cap")
                    t = t.replace("largecap", "large cap")
                    t = t.replace("flexicap", "flexi cap")
                    t = t.replace("multicap", "multi cap")
                    t = t.replace("bluechip", "blue chip")
                    if "axis blue chip" in t:
                        t = t.replace("axis blue chip", "axis large cap")
                    t = t.replace("-", " ").replace("/", " ")
                    return t

                clean_name = clean_text(name)
                words = clean_name.split()
                noise = {"fund", "direct", "direc", "growth", "growtho", "gr", "plan", "dividend", "div", "option", "regular", "reg"}
                keywords = [w for w in words if w not in noise and len(w) > 2]
                
                matched_code = None
                if keywords:
                    is_regular_asset = any(r in words for r in ("regular", "reg"))
                    is_direct_asset = any(d in words for d in ("direct", "direc")) or not is_regular_asset
                    is_dividend_asset = any(d in words for d in ("dividend", "div", "idcw"))
                    is_growth_asset = not is_dividend_asset

                    best_match = None
                    max_matches = 0
                    
                    for s in get_amfi_schemes():
                        s_name_clean = clean_text(s.get("schemeName", ""))
                        is_direct_scheme = "direct" in s_name_clean
                        is_dividend_scheme = any(d in s_name_clean for d in ("dividend", "div", "idcw"))
                        is_growth_scheme = "growth" in s_name_clean or not is_dividend_scheme
                        
                        # Align directness and option type
                        if is_direct_asset == is_direct_scheme and is_growth_asset == is_growth_scheme:
                            matches = sum(1 for kw in keywords if kw in s_name_clean)
                            if matches > max_matches:
                                max_matches = matches
                                best_match = s
                                
                    if best_match and max_matches >= len(keywords) * 0.7:
                        matched_code = str(best_match.get("schemeCode"))
                
                if matched_code:
                    try:
                        # Update asset scheme_code in database for next time
                        supabase.from_table("assets").eq("id", asset["id"]).update({"scheme_code": matched_code}).execute()
                        asset["scheme_code"] = matched_code
                        mf_to_fetch.append((asset, matched_code))
                    except Exception as e:
                        logger.error(f"Failed to update asset scheme_code in db: {e}")
        else:
            # Equities / ETFs
            # If ticker is missing or looks like placeholder (e.g. starting with "EQ-"), try to resolve it via Yahoo Search
            if not ticker or ticker.startswith("EQ-"):
                query = isin if isin else name
                query_cleaned = query.replace("LIMITED", "").replace("LTD", "").replace("INC", "").strip()
                matched_ticker = None
                try:
                    headers = {"User-Agent": "Mozilla/5.0"}
                    search_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query_cleaned}&newsCount=0"
                    resp = httpx.get(search_url, headers=headers, timeout=5)
                    if resp.status_code == 200:
                        search_data = resp.json()
                        quotes = search_data.get("quotes", [])
                        if quotes:
                            for q in quotes:
                                symbol = q.get("symbol", "")
                                if symbol.endswith(".NS") or symbol.endswith(".BO"):
                                    matched_ticker = symbol
                                    break
                            if not matched_ticker:
                                matched_ticker = quotes[0].get("symbol")
                    
                    if matched_ticker:
                        supabase.from_table("assets").eq("id", asset["id"]).update({"ticker": matched_ticker}).execute()
                        asset["ticker"] = matched_ticker
                        ticker = matched_ticker
                except Exception as e:
                    logger.error(f"Failed to resolve equity ticker for {name}: {e}")

            if ticker and not ticker.startswith("EQ-"):
                equities_to_fetch.append((asset, ticker))

    # 3. Fetch latest values in parallel using hybrid MFAPI + Yahoo Finance engine
    # A. Fetch Mutual Fund NAVs (MFAPI Primary + Yahoo Finance Fallback)
    mf_data_map = {}

    def fetch_mf_nav(item):
        asset, code = item
        name = asset.get("name", "")
        # Primary: MFAPI.in (official open-source AMFI API)
        try:
            resp = http_get_with_retry(f"https://api.mfapi.in/mf/{code}", timeout=10, max_retries=2)
            if resp and resp.status_code == 200:
                json_data = resp.json()
                nav_series = json_data.get("data", [])
                if nav_series and len(nav_series) > 0:
                    curr_nav = float(nav_series[0].get("nav") or 0)
                    prev_nav = float(nav_series[1].get("nav") or curr_nav) if len(nav_series) > 1 else curr_nav
                    chg = curr_nav - prev_nav
                    chg_pct = (chg / prev_nav * 100) if prev_nav > 0 else 0.0
                    return code, {
                        "nav": curr_nav,
                        "change": chg,
                        "change_pct": chg_pct,
                        "source": "mfapi"
                    }
        except Exception as e:
            logger.warning(f"MFAPI lookup failed for scheme {code}: {e}")

        # Secondary Fallback: Yahoo Finance for Mutual Fund
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            search_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={name}&newsCount=0"
            resp = httpx.get(search_url, headers=headers, timeout=5)
            if resp.status_code == 200:
                quotes = resp.json().get("quotes", [])
                if quotes:
                    yf_symbol = quotes[0].get("symbol")
                    if yf_symbol:
                        t = yf.Ticker(yf_symbol)
                        hist = t.history(period="5d")
                        if not hist.empty and len(hist) > 0:
                            curr_nav = float(hist["Close"].iloc[-1])
                            prev_nav = float(hist["Close"].iloc[-2]) if len(hist) > 1 else curr_nav
                            chg = curr_nav - prev_nav
                            chg_pct = (chg / prev_nav * 100) if prev_nav > 0 else 0.0
                            return code, {
                                "nav": curr_nav,
                                "change": chg,
                                "change_pct": chg_pct,
                                "source": "yahoo_finance"
                            }
        except Exception as e:
            logger.error(f"Yahoo Finance fallback failed for MF scheme {code} ({name}): {e}")

        return code, None

    if mf_to_fetch:
        with ThreadPoolExecutor(max_workers=min(12, len(mf_to_fetch))) as executor:
            results = executor.map(fetch_mf_nav, mf_to_fetch)
            for code, data in results:
                if data is not None:
                    mf_data_map[code] = data

    # B. Fetch Equity/ETF Prices (Yahoo Finance Primary + MFAPI Fallback)
    equity_data_map = {}

    def fetch_equity_price(item):
        asset, symbol = item
        name = asset.get("name", "")
        # Primary: Yahoo Finance
        try:
            t = yf.Ticker(symbol)
            hist = t.history(period="5d")
            if not hist.empty and len(hist) > 0:
                curr_price = float(hist["Close"].iloc[-1])
                prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else curr_price
                chg = curr_price - prev_price
                chg_pct = (chg / prev_price * 100) if prev_price > 0 else 0.0
                return symbol, {
                    "price": curr_price,
                    "change": chg,
                    "change_pct": chg_pct,
                    "source": "yahoo_finance"
                }
        except Exception as e:
            logger.warning(f"Yahoo Finance lookup failed for ticker {symbol}: {e}")

        # Secondary Fallback: MFAPI search if it's an Indian fund / ETF scheme
        try:
            schemes = get_amfi_schemes()
            clean_q = name.lower().replace(".ns", "").replace(".bo", "").strip()
            for s in schemes:
                if clean_q in s.get("schemeName", "").lower():
                    code = s.get("schemeCode")
                    resp = http_get_with_retry(f"https://api.mfapi.in/mf/{code}", timeout=5)
                    if resp and resp.status_code == 200:
                        nav_series = resp.json().get("data", [])
                        if nav_series:
                            curr_price = float(nav_series[0].get("nav") or 0)
                            prev_price = float(nav_series[1].get("nav") or curr_price) if len(nav_series) > 1 else curr_price
                            chg = curr_price - prev_price
                            chg_pct = (chg / prev_price * 100) if prev_price > 0 else 0.0
                            return symbol, {
                                "price": curr_price,
                                "change": chg,
                                "change_pct": chg_pct,
                                "source": "mfapi"
                            }
                    break
        except Exception as e:
            logger.error(f"MFAPI fallback failed for ticker {symbol}: {e}")

        return symbol, None

    if equities_to_fetch:
        with ThreadPoolExecutor(max_workers=min(12, len(equities_to_fetch))) as executor:
            results = executor.map(fetch_equity_price, equities_to_fetch)
            for symbol, data in results:
                if data is not None:
                    equity_data_map[symbol] = data

    # 4. Update assets in Supabase and calculate portfolio changes
    updated_portfolios = set()
    now_iso = datetime.now(timezone.utc).isoformat()

    for asset, scheme_code in mf_to_fetch:
        fund_res = mf_data_map.get(scheme_code)
        if fund_res:
            nav = fund_res["nav"]
            qty = Decimal(str(asset["quantity"]))
            mval = Decimal(str(nav)) * qty
            
            update_payload = {
                "current_price": str(nav),
                "market_value": str(mval),
                "last_price_at": now_iso
            }
            try:
                supabase.from_table("assets").eq("id", asset["id"]).update(update_payload).execute()
                updated_portfolios.add(asset["portfolio_id"])
            except Exception as e:
                logger.error(f"Failed to update asset {asset['id']} in db: {e}")

    for asset, ticker in equities_to_fetch:
        eq_res = equity_data_map.get(ticker)
        if eq_res:
            price = eq_res["price"]
            qty = Decimal(str(asset["quantity"]))
            mval = Decimal(str(price)) * qty
            
            update_payload = {
                "current_price": str(price),
                "market_value": str(mval),
                "last_price_at": now_iso
            }
            try:
                supabase.from_table("assets").eq("id", asset["id"]).update(update_payload).execute()
                updated_portfolios.add(asset["portfolio_id"])
            except Exception as e:
                logger.error(f"Failed to update asset {asset['id']} in db: {e}")

    # 5. Recalculate portfolio totals
    for pf_id in updated_portfolios:
        try:
            # Fetch all assets for this portfolio
            pf_assets_res = supabase.from_table("assets").eq("portfolio_id", str(pf_id)).select("market_value, cost_basis").execute()
            pf_assets = pf_assets_res.data or []
            
            total_val = sum(Decimal(str(a.get("market_value") or 0)) for a in pf_assets)
            total_cost = sum(Decimal(str(a.get("cost_basis") or 0)) for a in pf_assets)
            
            supabase.from_table("portfolios").eq("id", str(pf_id)).update({
                "total_value": str(total_val),
                "total_invested": str(total_cost),
                "as_of_date": now_iso.split("T")[0]
            }).execute()
        except Exception as e:
            logger.error(f"Failed to update portfolio totals for {pf_id}: {e}")

    # Return the updated list of assets
    final_res = supabase.from_table("assets").eq("user_id", str(user_id)).select("*").order("name").execute()
    return final_res.data or []
