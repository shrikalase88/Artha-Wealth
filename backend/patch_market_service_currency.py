import re

with open("app/services/market_service.py", "r") as f:
    content = f.read()

# Add currency cache setup at the top
cache_setup = """_funds_cache: dict = {}
_funds_cache_ttl = 3600  # 1 hour

_currency_cache: dict = {}
_currency_cache_ttl = 60  # 60 seconds
"""
content = content.replace("_funds_cache: dict = {}\n_funds_cache_ttl = 3600  # 1 hour", cache_setup)


# Add get_currency_rates function at the end of the file
currency_fn = """
def get_currency_rates() -> dict:
    \"\"\"Return live currency exchange rates against INR.\"\"\"
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
"""

if "def get_currency_rates" not in content:
    content += currency_fn

with open("app/services/market_service.py", "w") as f:
    f.write(content)
