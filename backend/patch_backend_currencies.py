import re

with open("app/services/market_service.py", "r") as f:
    content = f.read()

# Add Kuwait(KWD), China(CNY), African/South African Rand(ZAR), New Zealand(NZD)
# Note: AED(Dubai), JPY(Japan) are already present
new_pairs = """        {"symbol": "USDINR=X", "name": "US Dollar", "short": "USD"},
        {"symbol": "EURINR=X", "name": "Euro", "short": "EUR"},
        {"symbol": "GBPINR=X", "name": "British Pound", "short": "GBP"},
        {"symbol": "JPYINR=X", "name": "Japanese Yen", "short": "JPY"},
        {"symbol": "AEDINR=X", "name": "UAE Dirham", "short": "AED"},
        {"symbol": "KWDINR=X", "name": "Kuwaiti Dinar", "short": "KWD"},
        {"symbol": "CNYINR=X", "name": "Chinese Yuan", "short": "CNY"},
        {"symbol": "ZARINR=X", "name": "South African Rand", "short": "ZAR"},
        {"symbol": "NZDINR=X", "name": "New Zealand Dollar", "short": "NZD"},
        {"symbol": "AUDINR=X", "name": "Australian Dollar", "short": "AUD"},
        {"symbol": "CADINR=X", "name": "Canadian Dollar", "short": "CAD"},
        {"symbol": "SGDINR=X", "name": "Singapore Dollar", "short": "SGD"},
        {"symbol": "CHFINR=X", "name": "Swiss Franc", "short": "CHF"},"""

old_pairs = """        {"symbol": "USDINR=X", "name": "US Dollar", "short": "USD"},
        {"symbol": "EURINR=X", "name": "Euro", "short": "EUR"},
        {"symbol": "GBPINR=X", "name": "British Pound", "short": "GBP"},
        {"symbol": "JPYINR=X", "name": "Japanese Yen", "short": "JPY"},
        {"symbol": "AEDINR=X", "name": "UAE Dirham", "short": "AED"},
        {"symbol": "AUDINR=X", "name": "Australian Dollar", "short": "AUD"},
        {"symbol": "CADINR=X", "name": "Canadian Dollar", "short": "CAD"},
        {"symbol": "SGDINR=X", "name": "Singapore Dollar", "short": "SGD"},
        {"symbol": "CHFINR=X", "name": "Swiss Franc", "short": "CHF"},"""

content = content.replace(old_pairs, new_pairs)

with open("app/services/market_service.py", "w") as f:
    f.write(content)
