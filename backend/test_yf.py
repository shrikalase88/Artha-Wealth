import yfinance as yf

sector_symbols = {
    "IT & Tech": "^CNXIT",
    "Banking": "^NSEBANK",
    "Pharma": "^CNXPHARMA",
    "Auto": "^CNXAUTO",
    "FMCG": "^CNXFMCG",
    "Energy": "^CNXENERGY",
    "Metals": "^CNXMETAL",
    "Realty": "^CNXREALTY",
    "Media": "^CNXMEDIA",
    "Financial Services": "^CNXFIN"
}
tickers = yf.Tickers(" ".join(sector_symbols.values()))
for name, sym in sector_symbols.items():
    t = tickers.tickers.get(sym)
    if t and t.info:
        info = t.info
        print(name, info.get('currentPrice', info.get('regularMarketPrice')))
    else:
        print(name, "FAILED")
