"""Live Indian market data via Yahoo Finance & Mutual Fund API."""

import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from time import time

import httpx
import yfinance as yf

logger = logging.getLogger(__name__)

# Caching structures
_market_cache: dict = {}
_market_cache_ttl = 45  # seconds

_funds_cache: dict = {}
_funds_cache_ttl = 3600  # 1 hour


def get_market_summary() -> dict:
    """Return live prices for Nifty, Sensex, Bank Nifty, and top Indian stocks."""
    now = time()
    if _market_cache and now - _market_cache.get("_ts", 0) < _market_cache_ttl:
        return _market_cache.get("data", {})

    indices_list = [
        {"symbol": "^NSEI", "name": "Nifty 50", "short": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "Sensex", "short": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "Nifty Bank", "short": "BANK NIFTY"},
    ]
    stocks_list = [
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "short": "RELIANCE"},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "short": "TCS"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "short": "HDFC BANK"},
        {"symbol": "INFY.NS", "name": "Infosys", "short": "INFOSYS"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "short": "ICICI BANK"},
        {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "short": "BHARTIARTL"},
        {"symbol": "SBIN.NS", "name": "State Bank of India", "short": "SBIN"},
        {"symbol": "L&T.NS", "name": "Larsen & Toubro", "short": "L&T"},
        {"symbol": "ITC.NS", "name": "ITC Limited", "short": "ITC"},
        {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "short": "HINDUNILVR"},
        {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "short": "KOTAKBANK"},
        {"symbol": "AXISBANK.NS", "name": "Axis Bank", "short": "AXISBANK"},
        {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "short": "BAJFINANCE"},
        {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "short": "MARUTI"},
        {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "short": "ASIANPAINT"},
        {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "short": "HCLTECH"},
        {"symbol": "TITAN.NS", "name": "Titan Company", "short": "TITAN"},
        {"symbol": "M&M.NS", "name": "Mahindra & Mahindra", "short": "M&M"},
        {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma", "short": "SUNPHARMA"},
        {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "short": "ULTRACEMCO"},
        {"symbol": "TATASTEEL.NS", "name": "Tata Steel", "short": "TATASTEEL"},
        {"symbol": "POWERGRID.NS", "name": "Power Grid Corp", "short": "POWERGRID"},
        {"symbol": "NTPC.NS", "name": "NTPC Limited", "short": "NTPC"},
        {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "short": "TATAMOTORS"},
        {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank", "short": "INDUSINDBK"},
        {"symbol": "NESTLEIND.NS", "name": "Nestle India", "short": "NESTLEIND"},
        {"symbol": "JSWSTEEL.NS", "name": "JSW Steel", "short": "JSWSTEEL"},
        {"symbol": "TECHM.NS", "name": "Tech Mahindra", "short": "TECHM"},
        {"symbol": "WIPRO.NS", "name": "Wipro", "short": "WIPRO"},
        {"symbol": "ONGC.NS", "name": "ONGC", "short": "ONGC"},
    ]

    indices_data = []
    stocks_data = []

    try:
        all_symbols = [i["symbol"] for i in indices_list] + [s["symbol"] for s in stocks_list]
        tickers = yf.Tickers(" ".join(all_symbols))

        for idx in indices_list:
            t = tickers.tickers.get(idx["symbol"])
            if t and t.info:
                info = t.info
                price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
                prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
                change = None
                change_pct = None
                if price and prev_close:
                    change = round(price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2)
                indices_data.append({
                    "name": idx["name"],
                    "short": idx["short"],
                    "price": price,
                    "change": change,
                    "change_pct": change_pct,
                })

        for stock in stocks_list:
            t = tickers.tickers.get(stock["symbol"])
            if t and t.info:
                info = t.info
                price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
                prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
                change = None
                change_pct = 0.0
                if price and prev_close:
                    change = round(price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2)
                stocks_data.append({
                    "name": stock["name"],
                    "short": stock["short"],
                    "symbol": stock["symbol"],
                    "price": price,
                    "change": change,
                    "change_pct": change_pct,
                })
        
        # Sort stocks by change_pct (descending) and take top 25
        stocks_data.sort(key=lambda x: x.get("change_pct") or 0.0, reverse=True)
        stocks_data = stocks_data[:25]
    except Exception as e:
        logger.error("Failed to fetch market summary: %s", e)
        if _market_cache.get("data"):
            return _market_cache["data"]

    summary = {
        "indices": indices_data,
        "stocks": stocks_data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _market_cache["data"] = summary
    _market_cache["_ts"] = now
    return summary


def get_indices() -> list[dict]:
    """Fallback function for backward compatibility. Returns Nifty 50 and Sensex."""
    summary = get_market_summary()
    if summary and "indices" in summary:
        # Keep only Nifty and Sensex for indices endpoint to support the legacy component
        return [idx for idx in summary["indices"] if idx["short"] in ("NIFTY 50", "SENSEX")]
    return []


def _fetch_single_fund_nav(fund: dict, client: httpx.Client) -> dict:
    """Helper to fetch NAV history from AMFI/mfapi and calculate returns."""
    try:
        resp = client.get(f"https://api.mfapi.in/mf/{fund['code']}", timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            nav_data = data.get("data", [])
            if nav_data:
                current_nav = float(nav_data[0].get("nav") or 0)
                prev_nav = float(nav_data[1].get("nav") or current_nav) if len(nav_data) > 1 else current_nav
                change = round(current_nav - prev_nav, 4)
                change_pct = round((change / prev_nav) * 100, 2) if prev_nav > 0 else 0.0

                latest_date_str = nav_data[0]["date"]
                latest_date = datetime.strptime(latest_date_str, "%d-%m-%Y").date()

                def find_nav_for_days(days: int) -> float | None:
                    target = latest_date - timedelta(days=days)
                    for entry in nav_data:
                        try:
                            d = datetime.strptime(entry["date"], "%d-%m-%Y").date()
                        except ValueError:
                            continue
                        if abs((d - target).days) <= 7:
                            return float(entry["nav"])
                        if (target - d).days > 7:
                            break
                    return None

                nav_1y = find_nav_for_days(365)
                nav_3y = find_nav_for_days(1095)

                calc_1y = round(((current_nav - nav_1y) / nav_1y) * 100, 2) if nav_1y and nav_1y > 0 else fund["return_1y"]
                calc_3y = round(((current_nav / nav_3y) ** (1 / 3.0) - 1) * 100, 2) if nav_3y and nav_3y > 0 else fund["return_3y"]

                return {
                    "code": fund["code"],
                    "name": fund["name"],
                    "category": fund["category"],
                    "nav": current_nav,
                    "change": change,
                    "change_pct": change_pct,
                    "return_1y": calc_1y,
                    "return_3y": calc_3y,
                    "aum": fund["aum"],
                }
    except Exception as ex:
        logger.warning("Failed to fetch NAV for fund %s: %s", fund["code"], ex)

    # Fallback default values
    return {
        "code": fund["code"],
        "name": fund["name"],
        "category": fund["category"],
        "nav": 100.0,
        "change": 0.0,
        "change_pct": 0.0,
        "return_1y": fund["return_1y"],
        "return_3y": fund["return_3y"],
        "aum": fund["aum"],
    }


def get_top_funds() -> list[dict]:
    """Fetch live NAVs and returns for curated top 25 Indian mutual funds concurrently."""
    now = time()
    if _funds_cache and now - _funds_cache.get("_ts", 0) < _funds_cache_ttl:
        return _funds_cache.get("data", [])

    curated_funds = [
        {"code": "122639", "name": "Parag Parikh Flexi Cap Fund - Direct Growth", "category": "Flexi Cap", "return_1y": 24.5, "return_3y": 21.2, "aum": "62,500 Cr"},
        {"code": "119062", "name": "HDFC Mid-Cap Opportunities Fund - Direct Growth", "category": "Mid Cap", "return_1y": 31.2, "return_3y": 24.8, "aum": "60,200 Cr"},
        {"code": "118778", "name": "Nippon India Small Cap Fund - Direct Growth", "category": "Small Cap", "return_1y": 38.6, "return_3y": 28.5, "aum": "46,300 Cr"},
        {"code": "120847", "name": "Quant Active Fund - Direct Growth", "category": "Multi Cap", "return_1y": 29.8, "return_3y": 25.1, "aum": "9,800 Cr"},
        {"code": "119775", "name": "SBI Bluechip Fund - Direct Growth", "category": "Large Cap", "return_1y": 18.2, "return_3y": 16.5, "aum": "43,800 Cr"},
        {"code": "120503", "name": "Axis ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "return_1y": 16.5, "return_3y": 13.2, "aum": "34,100 Cr"},
        {"code": "148918", "name": "SBI Contra Fund - Direct Growth", "category": "Contra Equity", "return_1y": 27.4, "return_3y": 22.8, "aum": "29,400 Cr"},
        {"code": "118465", "name": "Mirae Asset Large Cap Fund - Direct Growth", "category": "Large Cap", "return_1y": 19.5, "return_3y": 17.2, "aum": "38,200 Cr"},
        {"code": "120286", "name": "ICICI Prudential Bluechip Fund - Direct Growth", "category": "Large Cap", "return_1y": 21.4, "return_3y": 18.1, "aum": "42,100 Cr"},
        {"code": "119819", "name": "Kotak Emerging Equity Fund - Direct Growth", "category": "Mid Cap", "return_1y": 25.6, "return_3y": 20.4, "aum": "37,600 Cr"},
        {"code": "125199", "name": "Quant Small Cap Fund - Direct Growth", "category": "Small Cap", "return_1y": 42.1, "return_3y": 32.4, "aum": "17,200 Cr"},
        {"code": "144848", "name": "Tata Small Cap Fund - Direct Growth", "category": "Small Cap", "return_1y": 35.2, "return_3y": 26.8, "aum": "6,100 Cr"},
        {"code": "119058", "name": "HDFC Index S&P BSE Sensex Fund - Direct Growth", "category": "Index Fund", "return_1y": 20.8, "return_3y": 15.2, "aum": "4,900 Cr"},
        {"code": "120716", "name": "UTI Nifty 50 Index Fund - Direct Growth", "category": "Index Fund", "return_1y": 21.1, "return_3y": 15.4, "aum": "16,200 Cr"},
        {"code": "120245", "name": "ICICI Prudential Technology Fund - Direct Growth", "category": "Sectoral Tech", "return_1y": 14.8, "return_3y": 12.1, "aum": "11,200 Cr"},
        {"code": "119702", "name": "SBI Magnum Constant Maturity Fund - Direct Growth", "category": "Debt G-Sec", "return_1y": 7.8, "return_3y": 6.5, "aum": "1,400 Cr"},
        {"code": "119020", "name": "HDFC Corporate Bond Fund - Direct Growth", "category": "Debt Corporate", "return_1y": 7.2, "return_3y": 6.1, "aum": "28,300 Cr"},
        {"code": "118712", "name": "Nippon India Liquid Fund - Direct Growth", "category": "Debt Liquid", "return_1y": 6.8, "return_3y": 5.9, "aum": "32,400 Cr"},
        {"code": "145554", "name": "Motilal Oswal Nasdaq 100 FOF - Direct Growth", "category": "International", "return_1y": 28.6, "return_3y": 18.5, "aum": "4,200 Cr"},
        {"code": "124559", "name": "Edelweiss Arbitrage Fund - Direct Growth", "category": "Arbitrage", "return_1y": 7.5, "return_3y": 6.2, "aum": "11,800 Cr"},
        {"code": "118544", "name": "Bandhan Sterling Value Fund - Direct Growth", "category": "Value Equity", "return_1y": 28.1, "return_3y": 23.4, "aum": "8,400 Cr"},
        {"code": "118949", "name": "DSP Top 100 Equity Fund - Direct Growth", "category": "Large Cap", "return_1y": 17.8, "return_3y": 14.9, "aum": "3,400 Cr"},
        {"code": "120042", "name": "Invesco India Contra Fund - Direct Growth", "category": "Contra Equity", "return_1y": 26.5, "return_3y": 21.8, "aum": "14,900 Cr"},
        {"code": "118228", "name": "Franklin India Prima Fund - Direct Growth", "category": "Mid Cap", "return_1y": 24.1, "return_3y": 19.8, "aum": "9,800 Cr"},
        {"code": "119551", "name": "Aditya Birla Frontline Equity Fund - Direct Growth", "category": "Large Cap", "return_1y": 18.9, "return_3y": 15.6, "aum": "24,800 Cr"},
    ]

    result = []
    try:
        with httpx.Client() as client:
            with ThreadPoolExecutor(max_workers=10) as executor:
                # Dispatch concurrent tasks
                futures = [executor.submit(_fetch_single_fund_nav, fund, client) for fund in curated_funds]
                result = [f.result() for f in futures]
    except Exception as e:
        logger.error("Failed to fetch top funds: %s", e)
        if _funds_cache.get("data"):
            return _funds_cache["data"]

    _funds_cache["data"] = result
    _funds_cache["_ts"] = now
    return result
