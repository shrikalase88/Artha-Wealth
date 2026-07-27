"""Live Indian market data via Yahoo Finance & Mutual Fund API - High-Performance Cache Architecture."""

import logging
import math
import urllib.request
import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta

import httpx
import yfinance as yf
from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# L1 In-Memory RAM Cache for sub-millisecond API responses
_MEMORY_CACHE: dict = {}
_MEMORY_CACHE_TIME: dict = {}
_CACHE_TTL_SECONDS = 60.0  # RAM cache TTL

_refresh_lock = threading.Lock()
_last_refresh_started = 0.0


def _trigger_background_refresh():
    """Trigger background refresh in a non-blocking daemon thread."""
    global _last_refresh_started
    now = time.time()

    with _refresh_lock:
        if now - _last_refresh_started > 60:
            _last_refresh_started = now
            logger.info("Triggering async background market cache refresh...")
            threading.Thread(target=refresh_market_cache, daemon=True).start()


def _get_default_summary() -> dict:
    """Fast fallback data for cold boots before external refresh completes."""
    return {
        "indices": [
            {"name": "Nifty 50", "short": "NIFTY 50", "symbol": "^NSEI", "price": 23767.45, "change": 142.15, "change_pct": 0.60},
            {"name": "Sensex", "short": "SENSEX", "symbol": "^BSESN", "price": 76059.77, "change": 412.40, "change_pct": 0.55},
            {"name": "Nifty Bank", "short": "BANK NIFTY", "symbol": "^NSEBANK", "price": 51240.10, "change": 185.30, "change_pct": 0.36},
        ],
        "sectors": [
            {"name": "IT & Tech", "short": "IT", "symbol": "^CNXIT", "price": 38450.20, "change": 420.50, "change_pct": 1.10},
            {"name": "Banking", "short": "BANKING", "symbol": "^NSEBANK", "price": 51240.10, "change": 185.30, "change_pct": 0.36},
            {"name": "Pharma", "short": "PHARMA", "symbol": "^CNXPHARMA", "price": 19200.40, "change": 140.20, "change_pct": 0.73},
            {"name": "Automobile", "short": "AUTO", "symbol": "^CNXAUTO", "price": 22150.80, "change": -110.40, "change_pct": -0.50},
            {"name": "FMCG", "short": "FMCG", "symbol": "^CNXFMCG", "price": 55400.10, "change": 210.30, "change_pct": 0.38},
            {"name": "Energy", "short": "ENERGY", "symbol": "^CNXENERGY", "price": 39100.50, "change": 380.10, "change_pct": 0.98},
            {"name": "Metals", "short": "METAL", "symbol": "^CNXMETAL", "price": 8950.60, "change": 95.40, "change_pct": 1.08},
            {"name": "Financial Services", "short": "FINANCIAL", "symbol": "^CNXFIN", "price": 23400.20, "change": 115.60, "change_pct": 0.50},
        ],
        "stocks": [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "short": "RELIANCE", "price": 2980.50, "change": 54.20, "change_pct": 1.85},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "short": "TCS", "price": 3850.20, "change": -46.80, "change_pct": -1.20},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "short": "HDFC BANK", "price": 1650.80, "change": 34.00, "change_pct": 2.10},
            {"symbol": "INFY.NS", "name": "Infosys", "short": "INFOSYS", "price": 1520.40, "change": -14.60, "change_pct": -0.95},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "short": "ICICI BANK", "price": 1120.60, "change": 16.00, "change_pct": 1.45},
            {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "short": "BHARTIARTL", "price": 1420.30, "change": 22.10, "change_pct": 1.58},
            {"symbol": "SBIN.NS", "name": "State Bank of India", "short": "SBIN", "price": 845.50, "change": 9.40, "change_pct": 1.12},
            {"symbol": "LT.NS", "name": "Larsen & Toubro", "short": "L&T", "price": 3650.00, "change": 42.50, "change_pct": 1.18},
            {"symbol": "ITC.NS", "name": "ITC Limited", "short": "ITC", "price": 435.20, "change": -2.10, "change_pct": -0.48},
            {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "short": "HINDUNILVR", "price": 2450.60, "change": 18.20, "change_pct": 0.75},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def get_regional_market_config(region: str = "india") -> dict:
    reg = (region or "india").lower().strip()
    if reg == "us":
        return {
            "region": "us",
            "currency": "$",
            "currency_code": "USD",
            "indices": [
                {"symbol": "^GSPC", "name": "S&P 500", "short": "S&P 500", "price": 5464.60, "change": 32.40, "change_pct": 0.60},
                {"symbol": "^IXIC", "name": "Nasdaq Composite", "short": "NASDAQ", "price": 17689.30, "change": 142.10, "change_pct": 0.81},
                {"symbol": "^DJI", "name": "Dow Jones Industrial", "short": "DOW JONES", "price": 39150.30, "change": 115.80, "change_pct": 0.30},
            ],
            "sectors": [
                {"symbol": "XLK", "name": "Technology", "short": "TECH", "price": 224.50, "change": 2.80, "change_pct": 1.26},
                {"symbol": "XLV", "name": "Healthcare", "short": "HEALTHCARE", "price": 145.20, "change": 0.85, "change_pct": 0.59},
                {"symbol": "XLF", "name": "Financials", "short": "FINANCIALS", "price": 42.80, "change": 0.35, "change_pct": 0.82},
                {"symbol": "XLY", "name": "Consumer Cyclical", "short": "CONSUMER", "price": 182.40, "change": 1.90, "change_pct": 1.05},
                {"symbol": "XLE", "name": "Energy", "short": "ENERGY", "price": 89.60, "change": -0.45, "change_pct": -0.50},
                {"symbol": "XLI", "name": "Industrials", "short": "INDUSTRIALS", "price": 124.10, "change": 0.95, "change_pct": 0.77},
            ],
            "stocks": [
                {"symbol": "AAPL", "name": "Apple Inc.", "short": "APPLE", "price": 224.50, "change": 2.80, "change_pct": 1.26},
                {"symbol": "MSFT", "name": "Microsoft Corp", "short": "MICROSOFT", "price": 448.20, "change": 4.10, "change_pct": 0.92},
                {"symbol": "NVDA", "name": "NVIDIA Corporation", "short": "NVIDIA", "price": 122.80, "change": 3.40, "change_pct": 2.85},
                {"symbol": "GOOGL", "name": "Alphabet Inc.", "short": "GOOGL", "price": 182.40, "change": 1.90, "change_pct": 1.05},
                {"symbol": "AMZN", "name": "Amazon.com Inc.", "short": "AMAZON", "price": 186.10, "change": 2.20, "change_pct": 1.20},
                {"symbol": "META", "name": "Meta Platforms", "short": "META", "price": 492.50, "change": 7.40, "change_pct": 1.52},
                {"symbol": "TSLA", "name": "Tesla Inc.", "short": "TESLA", "price": 218.60, "change": 5.80, "change_pct": 2.72},
                {"symbol": "BRK-B", "name": "Berkshire Hathaway", "short": "BERKSHIRE", "price": 445.20, "change": 2.10, "change_pct": 0.47},
                {"symbol": "LLY", "name": "Eli Lilly & Co", "short": "ELI LILLY", "price": 948.10, "change": 12.40, "change_pct": 1.33},
                {"symbol": "JPM", "name": "JPMorgan Chase", "short": "JPMORGAN", "price": 214.80, "change": 1.85, "change_pct": 0.87},
            ]
        }
    elif reg == "europe":
        return {
            "region": "europe",
            "currency": "€",
            "currency_code": "EUR",
            "indices": [
                {"symbol": "^FTSE", "name": "FTSE 100 (UK)", "short": "FTSE 100", "price": 8245.30, "change": 45.20, "change_pct": 0.55},
                {"symbol": "^GDAXI", "name": "DAX 40 (Germany)", "short": "DAX 40", "price": 18210.50, "change": 112.40, "change_pct": 0.62},
                {"symbol": "^FCHI", "name": "CAC 40 (France)", "short": "CAC 40", "price": 7650.80, "change": 38.60, "change_pct": 0.51},
            ],
            "sectors": [
                {"symbol": "EXXT.DE", "name": "EU Tech", "short": "EU TECH", "price": 112.40, "change": 1.45, "change_pct": 1.31},
                {"symbol": "EXV1.DE", "name": "EU Banks", "short": "EU BANKS", "price": 24.50, "change": 0.22, "change_pct": 0.91},
                {"symbol": "EXV4.DE", "name": "EU Health", "short": "EU HEALTH", "price": 98.60, "change": 0.75, "change_pct": 0.77},
                {"symbol": "SHEL.L", "name": "EU Energy", "short": "EU ENERGY", "price": 2845.00, "change": 32.00, "change_pct": 1.14},
                {"symbol": "MC.PA", "name": "EU Luxury", "short": "LUXURY", "price": 720.40, "change": 8.20, "change_pct": 1.15},
                {"symbol": "SIE.DE", "name": "EU Industrial", "short": "INDUSTRIAL", "price": 174.50, "change": 1.90, "change_pct": 1.10},
            ],
            "stocks": [
                {"symbol": "ASML.AS", "name": "ASML Holding NV", "short": "ASML", "price": 845.20, "change": 14.50, "change_pct": 1.74},
                {"symbol": "MC.PA", "name": "LVMH Moët Hennessy", "short": "LVMH", "price": 720.40, "change": 8.20, "change_pct": 1.15},
                {"symbol": "SAP.DE", "name": "SAP SE", "short": "SAP", "price": 195.80, "change": 2.40, "change_pct": 1.24},
                {"symbol": "SHEL.L", "name": "Shell PLC", "short": "SHELL", "price": 2845.00, "change": 32.00, "change_pct": 1.14},
                {"symbol": "NVO", "name": "Novo Nordisk A/S", "short": "NOVO NORDISK", "price": 134.20, "change": 2.10, "change_pct": 1.59},
                {"symbol": "NESN.SW", "name": "Nestlé S.A.", "short": "NESTLE", "price": 92.40, "change": 0.85, "change_pct": 0.93},
                {"symbol": "AZN.L", "name": "AstraZeneca PLC", "short": "ASTRAZENECA", "price": 12450.00, "change": 140.00, "change_pct": 1.14},
                {"symbol": "TTE.PA", "name": "TotalEnergies SE", "short": "TOTALENERGIES", "price": 62.80, "change": 0.75, "change_pct": 1.21},
                {"symbol": "SIE.DE", "name": "Siemens AG", "short": "SIEMENS", "price": 174.50, "change": 1.90, "change_pct": 1.10},
                {"symbol": "HSBA.L", "name": "HSBC Holdings PLC", "short": "HSBC", "price": 684.20, "change": 5.40, "change_pct": 0.80},
            ]
        }
    elif reg == "china":
        return {
            "region": "china",
            "currency": "HK$",
            "currency_code": "HKD",
            "indices": [
                {"symbol": "^HSI", "name": "Hang Seng Index", "short": "HANG SENG", "price": 17850.40, "change": 185.20, "change_pct": 1.05},
                {"symbol": "000001.SS", "name": "Shanghai Composite", "short": "SHANGHAI", "price": 2980.60, "change": 18.40, "change_pct": 0.62},
                {"symbol": "399300.SZ", "name": "CSI 300 Index", "short": "CSI 300", "price": 3480.20, "change": 26.50, "change_pct": 0.77},
            ],
            "sectors": [
                {"symbol": "3690.HK", "name": "China Consumer", "short": "CONSUMER", "price": 124.60, "change": 2.90, "change_pct": 2.38},
                {"symbol": "0700.HK", "name": "China Tech", "short": "TECH", "price": 382.40, "change": 6.80, "change_pct": 1.81},
                {"symbol": "1211.HK", "name": "China EV & Auto", "short": "EV AUTO", "price": 242.80, "change": 4.50, "change_pct": 1.89},
                {"symbol": "1398.HK", "name": "China Banking", "short": "BANKING", "price": 4.55, "change": 0.05, "change_pct": 1.11},
                {"symbol": "2318.HK", "name": "China Insurance", "short": "INSURANCE", "price": 36.80, "change": 0.60, "change_pct": 1.66},
                {"symbol": "9988.HK", "name": "E-Commerce", "short": "E-COMMERCE", "price": 78.50, "change": 1.40, "change_pct": 1.82},
            ],
            "stocks": [
                {"symbol": "0700.HK", "name": "Tencent Holdings", "short": "TENCENT", "price": 382.40, "change": 6.80, "change_pct": 1.81},
                {"symbol": "9988.HK", "name": "Alibaba Group", "short": "ALIBABA", "price": 78.50, "change": 1.40, "change_pct": 1.82},
                {"symbol": "3690.HK", "name": "Meituan", "short": "MEITUAN", "price": 124.60, "change": 2.90, "change_pct": 2.38},
                {"symbol": "1211.HK", "name": "BYD Company", "short": "BYD", "price": 242.80, "change": 4.50, "change_pct": 1.89},
                {"symbol": "9888.HK", "name": "Baidu Inc", "short": "BAIDU", "price": 89.20, "change": 1.80, "change_pct": 2.06},
                {"symbol": "9618.HK", "name": "JD.com Inc", "short": "JD.COM", "price": 108.40, "change": 2.10, "change_pct": 1.98},
                {"symbol": "9999.HK", "name": "NetEase Inc", "short": "NETEASE", "price": 142.50, "change": 2.80, "change_pct": 2.00},
                {"symbol": "1810.HK", "name": "Xiaomi Corp", "short": "XIAOMI", "price": 17.40, "change": 0.35, "change_pct": 2.05},
                {"symbol": "1398.HK", "name": "ICBC Bank", "short": "ICBC", "price": 4.55, "change": 0.05, "change_pct": 1.11},
                {"symbol": "2318.HK", "name": "Ping An Insurance", "short": "PING AN", "price": 36.80, "change": 0.60, "change_pct": 1.66},
            ]
        }
    elif reg == "japan":
        return {
            "region": "japan",
            "currency": "¥",
            "currency_code": "JPY",
            "indices": [
                {"symbol": "^N225", "name": "Nikkei 225", "short": "NIKKEI 225", "price": 38650.20, "change": 420.50, "change_pct": 1.10},
                {"symbol": "1306.T", "name": "TOPIX Core 30", "short": "TOPIX 30", "price": 2720.40, "change": 24.80, "change_pct": 0.92},
                {"symbol": "1591.T", "name": "JPX-Nikkei 400", "short": "JPX 400", "price": 24500.10, "change": 210.30, "change_pct": 0.87},
            ],
            "sectors": [
                {"symbol": "7203.T", "name": "Automotive", "short": "AUTOMOTIVE", "price": 3150.00, "change": 45.00, "change_pct": 1.45},
                {"symbol": "6758.T", "name": "Electronics", "short": "ELECTRONICS", "price": 13850.00, "change": 180.00, "change_pct": 1.32},
                {"symbol": "8035.T", "name": "Semiconductors", "short": "SEMICON", "price": 28900.00, "change": 420.00, "change_pct": 1.47},
                {"symbol": "8306.T", "name": "Financial Services", "short": "FINANCIALS", "price": 1620.00, "change": 22.00, "change_pct": 1.38},
                {"symbol": "9984.T", "name": "Telecommunications", "short": "TELECOM", "price": 9450.00, "change": 140.00, "change_pct": 1.50},
                {"symbol": "6861.T", "name": "Industrial Automation", "short": "AUTOMATION", "price": 68400.00, "change": 850.00, "change_pct": 1.26},
            ],
            "stocks": [
                {"symbol": "7203.T", "name": "Toyota Motor Corp", "short": "TOYOTA", "price": 3150.00, "change": 45.00, "change_pct": 1.45},
                {"symbol": "6758.T", "name": "Sony Group Corp", "short": "SONY", "price": 13850.00, "change": 180.00, "change_pct": 1.32},
                {"symbol": "8306.T", "name": "Mitsubishi UFJ Financial", "short": "MUFG", "price": 1620.00, "change": 22.00, "change_pct": 1.38},
                {"symbol": "9984.T", "name": "SoftBank Group Corp", "short": "SOFTBANK", "price": 9450.00, "change": 140.00, "change_pct": 1.50},
                {"symbol": "6861.T", "name": "Keyence Corp", "short": "KEYENCE", "price": 68400.00, "change": 850.00, "change_pct": 1.26},
                {"symbol": "8035.T", "name": "Tokyo Electron Ltd", "short": "TOKYO ELECTRON", "price": 28900.00, "change": 420.00, "change_pct": 1.47},
                {"symbol": "9983.T", "name": "Fast Retailing (Uniqlo)", "short": "FAST RETAILING", "price": 43500.00, "change": 580.00, "change_pct": 1.35},
                {"symbol": "7267.T", "name": "Honda Motor Co", "short": "HONDA", "price": 1680.00, "change": 21.00, "change_pct": 1.27},
                {"symbol": "4063.T", "name": "Shin-Etsu Chemical", "short": "SHIN-ETSU", "price": 6250.00, "change": 85.00, "change_pct": 1.38},
                {"symbol": "7974.T", "name": "Nintendo Co Ltd", "short": "NINTENDO", "price": 8150.00, "change": 95.00, "change_pct": 1.18},
            ]
        }
    elif reg == "arab":
        return {
            "region": "arab",
            "currency": "SAR",
            "currency_code": "SAR",
            "indices": [
                {"symbol": "^TASI.SR", "name": "Tadawul All Share (Saudi)", "short": "TASI SAUDI", "price": 11650.40, "change": 85.20, "change_pct": 0.74},
                {"symbol": "1120.SR", "name": "Al Rajhi Banking Index", "short": "RAJHI INDEX", "price": 84.50, "change": 1.10, "change_pct": 1.32},
                {"symbol": "2222.SR", "name": "Saudi Aramco Index", "short": "ARAMCO INDEX", "price": 28.15, "change": 0.35, "change_pct": 1.26},
            ],
            "sectors": [
                {"symbol": "2222.SR", "name": "Energy & Oil", "short": "ENERGY OIL", "price": 28.15, "change": 0.35, "change_pct": 1.26},
                {"symbol": "1120.SR", "name": "Banking & Finance", "short": "GULF BANKS", "price": 84.50, "change": 1.10, "change_pct": 1.32},
                {"symbol": "2010.SR", "name": "Petrochemicals", "short": "PETROCHEM", "price": 76.40, "change": 0.90, "change_pct": 1.19},
                {"symbol": "1211.SR", "name": "Mining & Metals", "short": "MINING", "price": 45.20, "change": 0.60, "change_pct": 1.35},
                {"symbol": "7010.SR", "name": "Telecom & Infra", "short": "TELECOM", "price": 41.20, "change": 0.50, "change_pct": 1.23},
                {"symbol": "2280.SR", "name": "Food & FMCG", "short": "FOOD FMCG", "price": 58.40, "change": 0.70, "change_pct": 1.21},
            ],
            "stocks": [
                {"symbol": "2222.SR", "name": "Saudi Aramco", "short": "ARAMCO", "price": 28.15, "change": 0.35, "change_pct": 1.26},
                {"symbol": "1120.SR", "name": "Al Rajhi Bank", "short": "AL RAJHI", "price": 84.50, "change": 1.10, "change_pct": 1.32},
                {"symbol": "1180.SR", "name": "Saudi National Bank (SNB)", "short": "SNB BANK", "price": 38.20, "change": 0.45, "change_pct": 1.19},
                {"symbol": "2010.SR", "name": "SABIC Petrochemicals", "short": "SABIC", "price": 76.40, "change": 0.90, "change_pct": 1.19},
                {"symbol": "7010.SR", "name": "STC Saudi Telecom", "short": "STC TELECOM", "price": 41.20, "change": 0.50, "change_pct": 1.23},
                {"symbol": "1150.SR", "name": "Alinma Bank", "short": "ALINMA", "price": 34.50, "change": 0.40, "change_pct": 1.17},
                {"symbol": "1211.SR", "name": "Ma'aden Mining Co", "short": "MA'ADEN", "price": 45.20, "change": 0.60, "change_pct": 1.35},
                {"symbol": "2280.SR", "name": "Almarai Co", "short": "ALMARAI", "price": 58.40, "change": 0.70, "change_pct": 1.21},
                {"symbol": "4190.SR", "name": "Jarir Marketing Co", "short": "JARIR", "price": 14.80, "change": 0.15, "change_pct": 1.02},
                {"symbol": "2380.SR", "name": "Petro Rabigh", "short": "RABIGH", "price": 8.90, "change": 0.10, "change_pct": 1.14},
            ]
        }
    else: # Default India
        return {
            "region": "india",
            "currency": "₹",
            "currency_code": "INR",
            "indices": [
                {"symbol": "^NSEI", "name": "Nifty 50", "short": "NIFTY 50", "price": 23767.45, "change": 142.15, "change_pct": 0.60},
                {"symbol": "^BSESN", "name": "Sensex", "short": "SENSEX", "price": 76059.77, "change": 412.40, "change_pct": 0.55},
                {"symbol": "^NSEBANK", "name": "Nifty Bank", "short": "BANK NIFTY", "price": 51240.10, "change": 185.30, "change_pct": 0.36},
            ],
            "sectors": [
                {"symbol": "^CNXIT", "name": "IT & Tech", "short": "IT", "price": 38450.20, "change": 420.50, "change_pct": 1.10},
                {"symbol": "^NSEBANK", "name": "Banking", "short": "BANKING", "price": 51240.10, "change": 185.30, "change_pct": 0.36},
                {"symbol": "^CNXPHARMA", "name": "Pharma", "short": "PHARMA", "price": 19200.40, "change": 140.20, "change_pct": 0.73},
                {"symbol": "^CNXAUTO", "name": "Automobile", "short": "AUTO", "price": 22150.80, "change": -110.40, "change_pct": -0.50},
                {"symbol": "^CNXFMCG", "name": "FMCG", "short": "FMCG", "price": 55400.10, "change": 210.30, "change_pct": 0.38},
                {"symbol": "^CNXENERGY", "name": "Energy", "short": "ENERGY", "price": 39100.50, "change": 380.10, "change_pct": 0.98},
                {"symbol": "^CNXMETAL", "name": "Metals", "short": "METAL", "price": 8950.60, "change": 95.40, "change_pct": 1.08},
                {"symbol": "^CNXFIN", "name": "Financial Services", "short": "FINANCIAL", "price": 23400.20, "change": 115.60, "change_pct": 0.50},
            ],
            "stocks": [
                {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "short": "RELIANCE", "price": 2980.50, "change": 54.20, "change_pct": 1.85},
                {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "short": "TCS", "price": 3850.20, "change": -46.80, "change_pct": -1.20},
                {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "short": "HDFC BANK", "price": 1650.80, "change": 34.00, "change_pct": 2.10},
                {"symbol": "INFY.NS", "name": "Infosys", "short": "INFOSYS", "price": 1520.40, "change": -14.60, "change_pct": -0.95},
                {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "short": "ICICI BANK", "price": 1120.60, "change": 16.00, "change_pct": 1.45},
                {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "short": "BHARTIARTL", "price": 1420.30, "change": 22.10, "change_pct": 1.58},
                {"symbol": "SBIN.NS", "name": "State Bank of India", "short": "SBIN", "price": 845.50, "change": 9.40, "change_pct": 1.12},
                {"symbol": "LT.NS", "name": "Larsen & Toubro", "short": "L&T", "price": 3650.00, "change": 42.50, "change_pct": 1.18},
                {"symbol": "ITC.NS", "name": "ITC Limited", "short": "ITC", "price": 435.20, "change": -2.10, "change_pct": -0.48},
                {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "short": "HINDUNILVR", "price": 2450.60, "change": 18.20, "change_pct": 0.75},
            ]
        }


def _sanitize_obj(obj):
    """Recursively sanitize dict/list objects to ensure no NaN or Infinity float values breaking JSON response."""
    if isinstance(obj, dict):
        return {k: _sanitize_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_obj(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    return obj


def get_market_summary(region: str = "india") -> dict:
    """Read cached regional market summary (RAM -> Supabase -> Fast Fallback). Non-blocking."""
    reg = (region or "india").lower().strip()
    cache_key = f"summary_{reg}"
    now = time.time()
    if cache_key in _MEMORY_CACHE and (now - _MEMORY_CACHE_TIME.get(cache_key, 0) < _CACHE_TTL_SECONDS):
        return _sanitize_obj(_MEMORY_CACHE[cache_key])

    data = None
    needs_refresh = False
    try:
        supabase = get_supabase()
        res = supabase.from_table("market_cache").eq("key", cache_key).select().execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            data = row.get("data", {})
            updated_at_str = row.get("updated_at")
            if updated_at_str:
                try:
                    updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) - updated_at > timedelta(minutes=15):
                        needs_refresh = True
                except Exception:
                    needs_refresh = True
            else:
                needs_refresh = True
        else:
            needs_refresh = True
    except Exception as e:
        logger.error(f"Error reading summary for region {reg} from DB cache: {e}")
        needs_refresh = True

    if data and isinstance(data, dict) and data.get("indices") and len(data["indices"]) > 0:
        _MEMORY_CACHE[cache_key] = data
        _MEMORY_CACHE_TIME[cache_key] = now
    else:
        cfg = get_regional_market_config(reg)
        data = {
            "region": cfg.get("region", reg),
            "currency": cfg.get("currency", "₹"),
            "currency_code": cfg.get("currency_code", "INR"),
            "indices": cfg["indices"],
            "sectors": cfg["sectors"],
            "stocks": cfg["stocks"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        _MEMORY_CACHE[cache_key] = data
        _MEMORY_CACHE_TIME[cache_key] = now
        needs_refresh = True

    if needs_refresh:
        _trigger_background_refresh()

    return _sanitize_obj(data)


def get_indices() -> list[dict]:
    """Returns Nifty 50 and Sensex from cached market summary."""
    summary = get_market_summary()
    if summary and "indices" in summary:
        return [idx for idx in summary["indices"] if idx["short"] in ("NIFTY 50", "SENSEX")]
    return []


def _get_default_top_funds() -> list[dict]:
    return [
        {"code": "122639", "name": "Parag Parikh Flexi Cap Fund - Direct Growth", "category": "Flexi Cap", "nav": 72.45, "change": 0.85, "change_pct": 1.18, "return_1y": 24.5, "return_3y": 21.2, "aum": "62,500 Cr"},
        {"code": "119062", "name": "HDFC Mid-Cap Opportunities Fund - Direct Growth", "category": "Mid Cap", "nav": 168.20, "change": 2.10, "change_pct": 1.26, "return_1y": 31.2, "return_3y": 24.8, "aum": "60,200 Cr"},
        {"code": "118778", "name": "Nippon India Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 184.50, "change": 2.80, "change_pct": 1.54, "return_1y": 38.6, "return_3y": 28.5, "aum": "46,300 Cr"},
        {"code": "120847", "name": "Quant Active Fund - Direct Growth", "category": "Multi Cap", "nav": 690.10, "change": 7.50, "change_pct": 1.10, "return_1y": 29.8, "return_3y": 25.1, "aum": "9,800 Cr"},
        {"code": "119775", "name": "SBI Bluechip Fund - Direct Growth", "category": "Large Cap", "nav": 94.30, "change": 0.65, "change_pct": 0.69, "return_1y": 18.2, "return_3y": 16.5, "aum": "43,800 Cr"},
        {"code": "120503", "name": "Axis ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 102.15, "change": 0.80, "change_pct": 0.79, "return_1y": 16.5, "return_3y": 13.2, "aum": "34,100 Cr"},
        {"code": "148918", "name": "SBI Contra Fund - Direct Growth", "category": "Contra Equity", "nav": 365.40, "change": 4.20, "change_pct": 1.16, "return_1y": 27.4, "return_3y": 22.8, "aum": "29,400 Cr"},
        {"code": "118465", "name": "Mirae Asset Large Cap Fund - Direct Growth", "category": "Large Cap", "nav": 115.80, "change": 0.90, "change_pct": 0.78, "return_1y": 19.5, "return_3y": 17.2, "aum": "38,200 Cr"},
        {"code": "120286", "name": "ICICI Prudential Bluechip Fund - Direct Growth", "category": "Large Cap", "nav": 112.40, "change": 0.95, "change_pct": 0.85, "return_1y": 21.4, "return_3y": 18.1, "aum": "42,100 Cr"},
        {"code": "119819", "name": "Kotak Emerging Equity Fund - Direct Growth", "category": "Mid Cap", "nav": 138.60, "change": 1.40, "change_pct": 1.02, "return_1y": 25.6, "return_3y": 20.4, "aum": "37,600 Cr"},
        {"code": "125199", "name": "Quant Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 245.80, "change": 4.10, "change_pct": 1.70, "return_1y": 42.1, "return_3y": 32.4, "aum": "17,200 Cr"},
        {"code": "144848", "name": "Tata Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 38.40, "change": 0.55, "change_pct": 1.45, "return_1y": 35.2, "return_3y": 26.8, "aum": "6,100 Cr"},
        {"code": "119058", "name": "HDFC Index S&P BSE Sensex Fund - Direct Growth", "category": "Index Fund", "nav": 680.10, "change": 4.20, "change_pct": 0.62, "return_1y": 20.8, "return_3y": 15.2, "aum": "4,900 Cr"},
        {"code": "120716", "name": "UTI Nifty 50 Index Fund - Direct Growth", "category": "Index Fund", "nav": 162.50, "change": 1.05, "change_pct": 0.65, "return_1y": 21.1, "return_3y": 15.4, "aum": "16,200 Cr"},
        {"code": "120245", "name": "ICICI Prudential Technology Fund - Direct Growth", "category": "Sectoral Tech", "nav": 195.40, "change": 2.10, "change_pct": 1.08, "return_1y": 14.8, "return_3y": 12.1, "aum": "11,200 Cr"},
        {"code": "119702", "name": "SBI Magnum Constant Maturity Fund - Direct Growth", "category": "Debt G-Sec", "nav": 58.20, "change": 0.12, "change_pct": 0.21, "return_1y": 7.8, "return_3y": 6.5, "aum": "1,400 Cr"},
        {"code": "119020", "name": "HDFC Corporate Bond Fund - Direct Growth", "category": "Debt Corporate", "nav": 28.90, "change": 0.05, "change_pct": 0.17, "return_1y": 7.2, "return_3y": 6.1, "aum": "28,300 Cr"},
        {"code": "118712", "name": "Nippon India Liquid Fund - Direct Growth", "category": "Debt Liquid", "nav": 5680.10, "change": 1.02, "change_pct": 0.02, "return_1y": 6.8, "return_3y": 5.9, "aum": "32,400 Cr"},
        {"code": "145554", "name": "Motilal Oswal Nasdaq 100 FOF - Direct Growth", "category": "International", "nav": 34.50, "change": 0.45, "change_pct": 1.32, "return_1y": 28.6, "return_3y": 18.5, "aum": "4,200 Cr"},
        {"code": "124559", "name": "Edelweiss Arbitrage Fund - Direct Growth", "category": "Arbitrage", "nav": 18.40, "change": 0.03, "change_pct": 0.16, "return_1y": 7.5, "return_3y": 6.2, "aum": "11,800 Cr"},
        {"code": "118544", "name": "Bandhan Sterling Value Fund - Direct Growth", "category": "Value Equity", "nav": 142.10, "change": 1.80, "change_pct": 1.28, "return_1y": 28.1, "return_3y": 23.4, "aum": "8,400 Cr"},
        {"code": "118949", "name": "DSP Top 100 Equity Fund - Direct Growth", "category": "Large Cap", "nav": 385.20, "change": 3.10, "change_pct": 0.81, "return_1y": 17.8, "return_3y": 14.9, "aum": "3,400 Cr"},
        {"code": "120042", "name": "Invesco India Contra Fund - Direct Growth", "category": "Contra Equity", "nav": 124.60, "change": 1.45, "change_pct": 1.18, "return_1y": 26.5, "return_3y": 21.8, "aum": "14,900 Cr"},
        {"code": "118228", "name": "Franklin India Prima Fund - Direct Growth", "category": "Mid Cap", "nav": 2150.40, "change": 24.50, "change_pct": 1.15, "return_1y": 24.1, "return_3y": 19.8, "aum": "9,800 Cr"},
        {"code": "119551", "name": "Aditya Birla Frontline Equity Fund - Direct Growth", "category": "Large Cap", "nav": 420.80, "change": 3.40, "change_pct": 0.81, "return_1y": 18.9, "return_3y": 15.6, "aum": "24,800 Cr"},
        {"code": "119842", "name": "HDFC Flexi Cap Fund - Direct Growth", "category": "Flexi Cap", "nav": 1785.40, "change": 18.20, "change_pct": 1.03, "return_1y": 32.5, "return_3y": 25.4, "aum": "58,400 Cr"},
        {"code": "118989", "name": "JM Flexi Cap Fund - Direct Growth", "category": "Flexi Cap", "nav": 112.50, "change": 1.85, "change_pct": 1.67, "return_1y": 48.2, "return_3y": 34.1, "aum": "3,800 Cr"},
        {"code": "120377", "name": "ICICI Prudential Multi-Asset Fund - Direct Growth", "category": "Multi Asset", "nav": 640.20, "change": 6.80, "change_pct": 1.07, "return_1y": 28.9, "return_3y": 22.6, "aum": "41,200 Cr"},
        {"code": "147942", "name": "Kotak Multi Cap Fund - Direct Growth", "category": "Multi Cap", "nav": 18.90, "change": 0.22, "change_pct": 1.18, "return_1y": 33.4, "return_3y": 24.1, "aum": "12,400 Cr"},
        {"code": "120743", "name": "UTI Flexi Cap Fund - Direct Growth", "category": "Flexi Cap", "nav": 312.40, "change": 2.80, "change_pct": 0.90, "return_1y": 19.8, "return_3y": 14.5, "aum": "25,100 Cr"},
        {"code": "141209", "name": "Nippon India Multi Cap Fund - Direct Growth", "category": "Multi Cap", "nav": 265.80, "change": 3.40, "change_pct": 1.30, "return_1y": 36.2, "return_3y": 27.8, "aum": "31,800 Cr"},
        {"code": "119017", "name": "HDFC Top 100 Fund - Direct Growth", "category": "Large Cap", "nav": 1145.20, "change": 10.50, "change_pct": 0.93, "return_1y": 22.4, "return_3y": 18.2, "aum": "33,500 Cr"},
        {"code": "118776", "name": "Nippon India Large Cap Fund - Direct Growth", "category": "Large Cap", "nav": 86.40, "change": 0.85, "change_pct": 1.00, "return_1y": 26.8, "return_3y": 20.1, "aum": "28,900 Cr"},
        {"code": "119807", "name": "Kotak Bluechip Fund - Direct Growth", "category": "Large Cap", "nav": 520.10, "change": 4.10, "change_pct": 0.80, "return_1y": 20.4, "return_3y": 16.8, "aum": "7,800 Cr"},
        {"code": "120584", "name": "Canara Robeco Bluechip Equity Fund - Direct Growth", "category": "Large Cap", "nav": 58.90, "change": 0.45, "change_pct": 0.77, "return_1y": 19.1, "return_3y": 15.8, "aum": "12,300 Cr"},
        {"code": "120849", "name": "Quant Mid Cap Fund - Direct Growth", "category": "Mid Cap", "nav": 224.50, "change": 3.80, "change_pct": 1.72, "return_1y": 44.2, "return_3y": 31.5, "aum": "10,100 Cr"},
        {"code": "120468", "name": "Motilal Oswal Midcap Fund - Direct Growth", "category": "Mid Cap", "nav": 118.60, "change": 1.90, "change_pct": 1.63, "return_1y": 52.4, "return_3y": 35.8, "aum": "14,800 Cr"},
        {"code": "118667", "name": "Nippon India Growth Fund - Direct Growth", "category": "Mid Cap", "nav": 3680.10, "change": 45.20, "change_pct": 1.24, "return_1y": 34.6, "return_3y": 26.2, "aum": "27,400 Cr"},
        {"code": "119797", "name": "SBI Magnum Midcap Fund - Direct Growth", "category": "Mid Cap", "nav": 218.40, "change": 2.60, "change_pct": 1.21, "return_1y": 29.5, "return_3y": 23.1, "aum": "18,200 Cr"},
        {"code": "118475", "name": "Mirae Asset Midcap Fund - Direct Growth", "category": "Mid Cap", "nav": 42.10, "change": 0.52, "change_pct": 1.25, "return_1y": 31.8, "return_3y": 23.9, "aum": "15,600 Cr"},
        {"code": "120712", "name": "HDFC Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 142.80, "change": 1.95, "change_pct": 1.38, "return_1y": 33.8, "return_3y": 27.2, "aum": "31,400 Cr"},
        {"code": "120594", "name": "Canara Robeco Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 39.10, "change": 0.52, "change_pct": 1.35, "return_1y": 30.5, "return_3y": 24.1, "aum": "10,800 Cr"},
        {"code": "119787", "name": "SBI Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 178.60, "change": 2.10, "change_pct": 1.19, "return_1y": 26.2, "return_3y": 22.4, "aum": "28,900 Cr"},
        {"code": "118979", "name": "DSP Small Cap Fund - Direct Growth", "category": "Small Cap", "nav": 182.40, "change": 2.45, "change_pct": 1.36, "return_1y": 32.1, "return_3y": 25.6, "aum": "14,200 Cr"},
        {"code": "120281", "name": "ICICI Prudential Smallcap Fund - Direct Growth", "category": "Small Cap", "nav": 88.50, "change": 1.20, "change_pct": 1.37, "return_1y": 34.2, "return_3y": 26.9, "aum": "8,900 Cr"},
        {"code": "149639", "name": "Navi Nifty 50 Index Fund - Direct Growth", "category": "Index Fund", "nav": 16.80, "change": 0.11, "change_pct": 0.66, "return_1y": 21.2, "return_3y": 15.5, "aum": "1,800 Cr"},
        {"code": "149174", "name": "ICICI Prudential Nifty Next 50 Index Fund - Direct Growth", "category": "Index Fund", "nav": 52.40, "change": 0.48, "change_pct": 0.92, "return_1y": 35.8, "return_3y": 22.1, "aum": "4,500 Cr"},
        {"code": "147721", "name": "Motilal Oswal Nifty Midcap 150 Index Fund - Direct Growth", "category": "Index Fund", "nav": 36.80, "change": 0.45, "change_pct": 1.24, "return_1y": 42.8, "return_3y": 28.4, "aum": "1,200 Cr"},
        {"code": "148630", "name": "UTI Nifty Next 50 Index Fund - Direct Growth", "category": "Index Fund", "nav": 28.50, "change": 0.26, "change_pct": 0.92, "return_1y": 35.6, "return_3y": 22.0, "aum": "3,400 Cr"},
        {"code": "119060", "name": "HDFC ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 1280.40, "change": 14.50, "change_pct": 1.15, "return_1y": 31.8, "return_3y": 23.5, "aum": "14,800 Cr"},
        {"code": "118765", "name": "Nippon India ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 138.20, "change": 1.65, "change_pct": 1.21, "return_1y": 28.5, "return_3y": 21.4, "aum": "15,200 Cr"},
        {"code": "119777", "name": "SBI Long Term Equity Fund (ELSS) - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 385.60, "change": 4.50, "change_pct": 1.18, "return_1y": 34.2, "return_3y": 25.8, "aum": "23,900 Cr"},
        {"code": "120853", "name": "Quant ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 420.10, "change": 6.50, "change_pct": 1.57, "return_1y": 38.6, "return_3y": 29.4, "aum": "10,400 Cr"},
        {"code": "118467", "name": "Mirae Asset ELSS Tax Saver Fund - Direct Growth", "category": "ELSS (Tax Saver)", "nav": 48.90, "change": 0.45, "change_pct": 0.93, "return_1y": 22.5, "return_3y": 17.8, "aum": "21,800 Cr"},
        {"code": "120300", "name": "ICICI Prudential Value Discovery Fund - Direct Growth", "category": "Value Equity", "nav": 412.50, "change": 4.80, "change_pct": 1.18, "return_1y": 32.4, "return_3y": 26.5, "aum": "44,100 Cr"},
        {"code": "119800", "name": "Kotak Debt Hybrid Fund - Direct Growth", "category": "Debt Hybrid", "nav": 54.20, "change": 0.22, "change_pct": 0.41, "return_1y": 13.8, "return_3y": 11.2, "aum": "2,800 Cr"},
        {"code": "120844", "name": "Quant Healthcare Fund - Direct Growth", "category": "Sectoral Pharma", "nav": 16.80, "change": 0.18, "change_pct": 1.08, "return_1y": 36.4, "return_3y": 24.5, "aum": "2,100 Cr"},
    ]


def get_top_funds() -> list[dict]:
    """Read cached top funds (RAM -> Supabase -> Fast Fallback). Non-blocking."""
    now = time.time()
    if "funds" in _MEMORY_CACHE and (now - _MEMORY_CACHE_TIME.get("funds", 0) < _CACHE_TTL_SECONDS):
        return _MEMORY_CACHE["funds"]

    data = None
    needs_refresh = False
    try:
        supabase = get_supabase()
        res = supabase.from_table("market_cache").eq("key", "funds").select().execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            data = row.get("data", [])
            updated_at_str = row.get("updated_at")
            if updated_at_str:
                try:
                    updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) - updated_at > timedelta(hours=1):
                        needs_refresh = True
                except Exception:
                    needs_refresh = True
            else:
                needs_refresh = True
        else:
            needs_refresh = True
    except Exception as e:
        logger.error(f"Error reading funds from DB cache: {e}")
        needs_refresh = True

    if data and isinstance(data, list) and len(data) >= 50:
        _MEMORY_CACHE["funds"] = data
        _MEMORY_CACHE_TIME["funds"] = now
    else:
        data = _get_default_top_funds()
        _MEMORY_CACHE["funds"] = data
        _MEMORY_CACHE_TIME["funds"] = now
        needs_refresh = True

    if needs_refresh:
        _trigger_background_refresh()

    return data


def _get_default_currency_rates() -> dict:
    return {
        "rates": [
            {"symbol": "USDINR=X", "name": "US Dollar", "short": "USD", "price": 83.75, "change": 0.08, "change_pct": 0.10},
            {"symbol": "EURINR=X", "name": "Euro", "short": "EUR", "price": 91.20, "change": -0.15, "change_pct": -0.16},
            {"symbol": "GBPINR=X", "name": "British Pound", "short": "GBP", "price": 108.45, "change": 0.22, "change_pct": 0.20},
            {"symbol": "JPYINR=X", "name": "Japanese Yen", "short": "JPY", "price": 0.552, "change": 0.002, "change_pct": 0.36},
            {"symbol": "AEDINR=X", "name": "UAE Dirham", "short": "AED", "price": 22.80, "change": 0.02, "change_pct": 0.09},
            {"symbol": "CADINR=X", "name": "Canadian Dollar", "short": "CAD", "price": 61.35, "change": 0.05, "change_pct": 0.08},
            {"symbol": "AUDINR=X", "name": "Australian Dollar", "short": "AUD", "price": 55.40, "change": -0.10, "change_pct": -0.18},
            {"symbol": "SGDINR=X", "name": "Singapore Dollar", "short": "SGD", "price": 62.10, "change": 0.08, "change_pct": 0.13},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def get_currency_rates() -> dict:
    """Read cached currency rates (RAM -> Supabase -> Fast Fallback). Non-blocking."""
    now = time.time()
    if "currency" in _MEMORY_CACHE and (now - _MEMORY_CACHE_TIME.get("currency", 0) < _CACHE_TTL_SECONDS):
        return _MEMORY_CACHE["currency"]

    data = None
    needs_refresh = False
    try:
        supabase = get_supabase()
        res = supabase.from_table("market_cache").eq("key", "currency").select().execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            data = row.get("data", {})
            updated_at_str = row.get("updated_at")
            if updated_at_str:
                try:
                    updated_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) - updated_at > timedelta(hours=1):
                        needs_refresh = True
                except Exception:
                    needs_refresh = True
            else:
                needs_refresh = True
        else:
            needs_refresh = True
    except Exception as e:
        logger.error(f"Error reading currency from DB cache: {e}")
        needs_refresh = True

    if data and isinstance(data, dict) and data.get("rates") and len(data["rates"]) > 0:
        _MEMORY_CACHE["currency"] = data
        _MEMORY_CACHE_TIME["currency"] = now
    else:
        data = _get_default_currency_rates()
        _MEMORY_CACHE["currency"] = data
        _MEMORY_CACHE_TIME["currency"] = now
        needs_refresh = True

    if needs_refresh:
        _trigger_background_refresh()

    return data


def _fetch_single_fund_nav(fund: dict, client: httpx.Client) -> dict:
    """Fetch NAV for a single mutual fund with fast retries."""
    try:
        url = f"https://api.mfapi.in/mf/{fund['code']}"
        resp = client.get(url, timeout=4)
        if resp.status_code == 200:
            mf_data = resp.json()
            nav_data = mf_data.get("data", [])
            if nav_data and len(nav_data) > 0:
                current_nav = float(nav_data[0]["nav"])
                prev_nav = float(nav_data[1]["nav"]) if len(nav_data) > 1 else current_nav
                change = round(current_nav - prev_nav, 2)
                change_pct = round((change / prev_nav) * 100, 2) if prev_nav > 0 else 0.0

                return {
                    "code": fund["code"],
                    "name": fund["name"],
                    "category": fund["category"],
                    "nav": current_nav,
                    "change": change,
                    "change_pct": change_pct,
                    "return_1y": fund["return_1y"],
                    "return_3y": fund["return_3y"],
                    "aum": fund["aum"],
                }
    except Exception as ex:
        logger.warning(f"Failed NAV fetch for fund {fund['code']}: {ex}")

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


def refresh_market_cache():
    """Background task: Fetch all market data asynchronously and update Supabase & RAM cache."""
    supabase = get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_time = time.time()

def _is_valid_num(val) -> bool:
    if val is None:
        return False
    try:
        f = float(val)
        return not (math.isnan(f) or math.isinf(f))
    except (ValueError, TypeError):
        return False


def fetch_live_ticker_rest(symbol: str) -> dict | None:
    """Fetch real-time or last close market data directly from Yahoo Finance REST API query2 endpoint."""
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                chart = data.get('chart', {})
                results = chart.get('result', [])
                if results:
                    result = results[0]
                    meta = result.get('meta', {})
                    price = meta.get('regularMarketPrice')
                    quote = result.get('indicators', {}).get('quote', [{}])[0]
                    closes = [c for c in quote.get('close', []) if _is_valid_num(c)]
                    
                    if not _is_valid_num(price) and closes:
                        price = closes[-1]
                    
                    prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
                    if not _is_valid_num(prev_close) and len(closes) >= 2:
                        prev_close = closes[-2]
                    elif not _is_valid_num(prev_close) and closes:
                        prev_close = closes[-1]
                        
                    if _is_valid_num(price):
                        price = round(float(price), 2)
                        prev_close = round(float(prev_close), 2) if _is_valid_num(prev_close) else price
                        change = round(price - prev_close, 2)
                        change_pct = round((change / prev_close) * 100, 2) if prev_close > 0 else 0.0
                        return {
                            "price": price,
                            "change": change,
                            "change_pct": change_pct
                        }
    except Exception as e:
        logger.debug(f"Direct REST ticker fetch failed for {symbol}: {e}")
    return None


def refresh_market_cache():
    """Background task to fetch live data for all global market regions concurrently and save to DB."""
    global _MEMORY_CACHE, _MEMORY_CACHE_TIME
    now_time = time.time()
    now_iso = datetime.now(timezone.utc).isoformat()
    supabase = get_supabase()

    # 1. Global Regional Market Summaries
    try:
        regions = ["india", "us", "europe", "china", "japan", "arab"]

        def refresh_single_region(reg_name: str):
            try:
                cfg = get_regional_market_config(reg_name)
                indices_list = cfg["indices"]
                sectors_list = cfg["sectors"]
                stocks_list = cfg["stocks"]
                all_items = indices_list + sectors_list + stocks_list

                def fetch_item_price(item):
                    symbol = item.get("symbol", "")
                    
                    # 1. Try Direct REST Chart Endpoint
                    live_res = fetch_live_ticker_rest(symbol)
                    if live_res and live_res.get("price") is not None:
                        return {
                            "name": item["name"],
                            "short": item["short"],
                            "symbol": item["symbol"],
                            "price": live_res["price"],
                            "change": live_res["change"],
                            "change_pct": live_res["change_pct"],
                            "type": "indices" if item in indices_list else ("sectors" if item in sectors_list else "stocks")
                        }
                    
                    # 2. Try yfinance SDK fallback
                    try:
                        t = yf.Ticker(symbol)
                        hist = t.history(period="2d")
                        if not hist.empty and len(hist) >= 1:
                            price = round(float(hist["Close"].iloc[-1]), 2)
                            prev_close = round(float(hist["Open"].iloc[-1]), 2) if len(hist) == 1 else round(float(hist["Close"].iloc[-2]), 2)
                            change = round(price - prev_close, 2)
                            change_pct = round((change / prev_close) * 100, 2) if prev_close > 0 else 0.0
                            return {
                                "name": item["name"],
                                "short": item["short"],
                                "symbol": item["symbol"],
                                "price": price,
                                "change": change,
                                "change_pct": change_pct,
                                "type": "indices" if item in indices_list else ("sectors" if item in sectors_list else "stocks")
                            }
                    except Exception:
                        pass

                    # 3. Fallback to default configured item
                    return {
                        "name": item["name"],
                        "short": item["short"],
                        "symbol": item["symbol"],
                        "price": item.get("price", 100.0),
                        "change": item.get("change", 0.0),
                        "change_pct": item.get("change_pct", 0.0),
                        "type": "indices" if item in indices_list else ("sectors" if item in sectors_list else "stocks")
                    }

                indices_data, sectors_data, stocks_data = [], [], []
                with ThreadPoolExecutor(max_workers=8) as ex:
                    f_map = {ex.submit(fetch_item_price, item): item for item in all_items}
                    for f in as_completed(f_map):
                        res = f.result()
                        if res:
                            t_type = res.pop("type")
                            if t_type == "indices":
                                indices_data.append(res)
                            elif t_type == "sectors":
                                sectors_data.append(res)
                            else:
                                stocks_data.append(res)

                reg_summary = {
                    "region": reg_name,
                    "currency": cfg.get("currency", "₹"),
                    "currency_code": cfg.get("currency_code", "INR"),
                    "indices": indices_data or cfg["indices"],
                    "sectors": sectors_data or cfg["sectors"],
                    "stocks": stocks_data or cfg["stocks"],
                    "updated_at": now_iso,
                }

                c_key = f"summary_{reg_name}"
                _MEMORY_CACHE[c_key] = reg_summary
                _MEMORY_CACHE_TIME[c_key] = now_time
                if reg_name == "india":
                    _MEMORY_CACHE["summary"] = reg_summary
                    _MEMORY_CACHE_TIME["summary"] = now_time

                supabase.from_table("market_cache").upsert({
                    "key": c_key,
                    "data": reg_summary,
                    "updated_at": now_iso
                }).execute()
            except Exception as ex:
                logger.error(f"Error refreshing region {reg_name}: {ex}")

        with ThreadPoolExecutor(max_workers=6) as executor:
            executor.map(refresh_single_region, regions)

        logger.info("Successfully refreshed all global market summaries.")
    except Exception as e:
        logger.error(f"Failed to refresh market summaries: {e}")

    # 2. Top Funds Refresh
    try:
        curated_funds = _get_default_top_funds()
        funds_result = []
        with httpx.Client(timeout=5) as client:
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(_fetch_single_fund_nav, fund, client) for fund in curated_funds]
                funds_result = [f.result() for f in futures if f.result()]

        if funds_result:
            _MEMORY_CACHE["funds"] = funds_result
            _MEMORY_CACHE_TIME["funds"] = now_time
            supabase.from_table("market_cache").upsert({
                "key": "funds",
                "data": funds_result,
                "updated_at": now_iso
            }).execute()
            logger.info("Successfully refreshed top funds cache.")
    except Exception as e:
        logger.error(f"Failed to refresh top funds: {e}")

    # 3. Currency Rates Refresh
    try:
        currency_pairs = [
            {"symbol": "USDINR=X", "name": "US Dollar", "short": "USD"},
            {"symbol": "EURINR=X", "name": "Euro", "short": "EUR"},
            {"symbol": "GBPINR=X", "name": "British Pound", "short": "GBP"},
            {"symbol": "JPYINR=X", "name": "Japanese Yen", "short": "JPY"},
            {"symbol": "AEDINR=X", "name": "UAE Dirham", "short": "AED"},
            {"symbol": "CADINR=X", "name": "Canadian Dollar", "short": "CAD"},
            {"symbol": "AUDINR=X", "name": "Australian Dollar", "short": "AUD"},
            {"symbol": "SGDINR=X", "name": "Singapore Dollar", "short": "SGD"},
        ]

        def fetch_currency(pair):
            try:
                t = yf.Ticker(pair["symbol"])
                hist = t.history(period="2d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                    prev_close = float(hist["Open"].iloc[-1]) if len(hist) == 1 else float(hist["Close"].iloc[-2])
                    change = round(price - prev_close, 4)
                    change_pct = round((change / prev_close) * 100, 2) if prev_close > 0 else 0.0
                    return {
                        "symbol": pair["symbol"],
                        "name": pair["name"],
                        "short": pair["short"],
                        "price": round(price, 4),
                        "change": change,
                        "change_pct": change_pct
                    }
            except Exception as e:
                logger.error(f"Error fetching currency {pair['symbol']}: {e}")
            return None

        with ThreadPoolExecutor(max_workers=5) as executor:
            fetched = list(executor.map(fetch_currency, currency_pairs))
            valid_results = [r for r in fetched if r is not None]

        if valid_results:
            curr_data = {"rates": valid_results, "updated_at": now_iso}
            _MEMORY_CACHE["currency"] = curr_data
            _MEMORY_CACHE_TIME["currency"] = now_time
            supabase.from_table("market_cache").upsert({
                "key": "currency",
                "data": curr_data,
                "updated_at": now_iso
            }).execute()
            logger.info("Successfully refreshed currency rates cache.")
    except Exception as e:
        logger.error(f"Failed to refresh currency: {e}")
