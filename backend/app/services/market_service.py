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
_market_cache_ttl = 15  # seconds

_funds_cache: dict = {}
_funds_cache_ttl = 3600  # 1 hour

_currency_cache: dict = {}
_currency_cache_ttl = 60  # 60 seconds



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
    
    sectors_list = [
        {"symbol": "^CNXIT", "name": "IT & Tech", "short": "IT"},
        {"symbol": "^NSEBANK", "name": "Banking", "short": "BANKING"},
        {"symbol": "^CNXPHARMA", "name": "Pharma", "short": "PHARMA"},
        {"symbol": "^CNXAUTO", "name": "Automobile", "short": "AUTO"},
        {"symbol": "^CNXFMCG", "name": "FMCG", "short": "FMCG"},
        {"symbol": "^CNXENERGY", "name": "Energy", "short": "ENERGY"},
        {"symbol": "^CNXMETAL", "name": "Metals", "short": "METAL"},
        {"symbol": "^CNXREALTY", "name": "Real Estate", "short": "REALTY"},
        {"symbol": "^CNXMEDIA", "name": "Media", "short": "MEDIA"},
        {"symbol": "^CNXFIN", "name": "Financial Services", "short": "FINANCIAL"}
    ]

    stocks_list = [
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "short": "RELIANCE"},
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "short": "TCS"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "short": "HDFC BANK"},
        {"symbol": "INFY.NS", "name": "Infosys", "short": "INFOSYS"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "short": "ICICI BANK"},
        {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "short": "BHARTIARTL"},
        {"symbol": "SBIN.NS", "name": "State Bank of India", "short": "SBIN"},
        {"symbol": "LT.NS", "name": "Larsen & Toubro", "short": "L&T"},
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
        {"symbol": "GRASIM.NS", "name": "Grasim Industries", "short": "GRASIM"},
        {"symbol": "HINDALCO.NS", "name": "Hindalco", "short": "HINDALCO"},
        {"symbol": "COALINDIA.NS", "name": "Coal India", "short": "COALINDIA"},
        {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto", "short": "BAJAJ-AUTO"},
        {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "short": "ADANIENT"},
        {"symbol": "ADANIPORTS.NS", "name": "Adani Ports", "short": "ADANIPORTS"},
        {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance", "short": "SBILIFE"},
        {"symbol": "HDFCLIFE.NS", "name": "HDFC Life", "short": "HDFCLIFE"},
        {"symbol": "LTIM.NS", "name": "LTIMindtree", "short": "LTIM"},
        {"symbol": "BRITANNIA.NS", "name": "Britannia", "short": "BRITANNIA"},
        {"symbol": "EICHERMOT.NS", "name": "Eicher Motors", "short": "EICHERMOT"},
        {"symbol": "CIPLA.NS", "name": "Cipla", "short": "CIPLA"},
        {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals", "short": "APOLLOHOSP"},
        {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's", "short": "DRREDDY"},
        {"symbol": "TATACONSUM.NS", "name": "Tata Consumer", "short": "TATACONSUM"},
        {"symbol": "SHRIRAMFIN.NS", "name": "Shriram Finance", "short": "SHRIRAMFIN"},
        {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp", "short": "HEROMOTOCO"},
        {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv", "short": "BAJAJFINSV"},
        {"symbol": "BPCL.NS", "name": "BPCL", "short": "BPCL"},
        {"symbol": "TRENT.NS", "name": "TRENT", "short": "TRENT"},
    ]

    indices_data = []
    sectors_data = []
    stocks_data = []

    try:
        all_symbols = [i["symbol"] for i in indices_list] + [s["symbol"] for s in sectors_list] + [s["symbol"] for s in stocks_list]
        tickers = yf.Tickers(" ".join(all_symbols))

        def parse_ticker(t_dict, item):
            t = t_dict.get(item["symbol"])
            if t and t.info:
                info = t.info
                price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
                prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
                change = None
                change_pct = 0.0
                if price and prev_close:
                    change = round(price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2)
                
                return {
                    "name": item["name"],
                    "short": item["short"],
                    "symbol": item["symbol"],
                    "price": price,
                    "change": change,
                    "change_pct": change_pct,
                }
            return None

        for idx in indices_list:
            res = parse_ticker(tickers.tickers, idx)
            if res:
                indices_data.append(res)
                
        for sector in sectors_list:
            res = parse_ticker(tickers.tickers, sector)
            if res:
                sectors_data.append(res)

        for stock in stocks_list:
            res = parse_ticker(tickers.tickers, stock)
            if res:
                stocks_data.append(res)
        
        # Sort stocks by change_pct (descending) and take top 25
        stocks_data.sort(key=lambda x: x.get("change_pct") or 0.0, reverse=True)
        stocks_data = stocks_data[:25]
    except Exception as e:
        logger.error("Failed to fetch market summary: %s", e)
        if _market_cache.get("data"):
            return _market_cache["data"]

    summary = {
        "indices": indices_data,
        "sectors": sectors_data,
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

def get_currency_rates() -> dict:
    """Return live currency exchange rates against INR."""
    now = time()
    if _currency_cache and now - _currency_cache.get("_ts", 0) < _currency_cache_ttl:
        return _currency_cache.get("data", {})

    currency_pairs = [
        {"symbol": "USDINR=X", "name": "US Dollar", "short": "USD"},
        {"symbol": "EURINR=X", "name": "Euro", "short": "EUR"},
        {"symbol": "GBPINR=X", "name": "British Pound", "short": "GBP"},
        {"symbol": "JPYINR=X", "name": "Japanese Yen", "short": "JPY"},
        {"symbol": "AEDINR=X", "name": "UAE Dirham", "short": "AED"},
        {"symbol": "AUDINR=X", "name": "Australian Dollar", "short": "AUD"},
        {"symbol": "CADINR=X", "name": "Canadian Dollar", "short": "CAD"},
        {"symbol": "SGDINR=X", "name": "Singapore Dollar", "short": "SGD"},
        {"symbol": "CHFINR=X", "name": "Swiss Franc", "short": "CHF"},
    ]

    symbols = [p["symbol"] for p in currency_pairs]
    tickers = yf.Tickers(" ".join(symbols))

    results = []
    
    def fetch_currency(pair):
        try:
            ticker = tickers.tickers[pair["symbol"]]
            info = ticker.info
            
            # For currencies, regularMarketPrice or previousClose
            price = info.get("regularMarketPrice") or info.get("previousClose") or info.get("bid")
            prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            
            if not price and ticker.history(period="1d").empty == False:
                hist = ticker.history(period="1d")
                price = float(hist["Close"].iloc[-1])
                prev_close = float(hist["Open"].iloc[0]) # Approximation if previous close not available

            if price:
                change = 0
                change_pct = 0
                if prev_close and prev_close > 0:
                    change = price - prev_close
                    change_pct = (change / prev_close) * 100

                return {
                    "symbol": pair["symbol"],
                    "name": pair["name"],
                    "short": pair["short"],
                    "price": round(price, 4),
                    "change": round(change, 4),
                    "change_pct": round(change_pct, 2)
                }
        except Exception as e:
            logger.error(f"Error fetching {pair['symbol']}: {e}")
        return None

    with ThreadPoolExecutor(max_workers=5) as executor:
        fetched = list(executor.map(fetch_currency, currency_pairs))

    valid_results = [r for r in fetched if r is not None]

    data = {
        "rates": valid_results,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    _currency_cache["_ts"] = now
    _currency_cache["data"] = data

    return data
