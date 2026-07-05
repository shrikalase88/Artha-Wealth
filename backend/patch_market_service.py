import re

with open("app/services/market_service.py", "r") as f:
    content = f.read()

# 1. Update TTL
content = content.replace("_market_cache_ttl = 45", "_market_cache_ttl = 15")

# 2. Add Sectors List & Expand Stocks List
new_lists = """
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
    }"""

# Using regex to replace everything from `indices_list = [` to `summary = { ... }`
pattern = re.compile(r'    indices_list = \[.*?    summary = \{\n.*?    \}', re.DOTALL)
content = pattern.sub(new_lists, content)

with open("app/services/market_service.py", "w") as f:
    f.write(content)
