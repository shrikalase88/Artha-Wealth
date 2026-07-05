"""Shared SQLAlchemy enum classes mirroring Postgres enums in infra/db."""

from enum import Enum as PyEnum


class AssetType(str, PyEnum):
    EQUITY = "equity"
    MUTUAL_FUND = "mutual_fund"
    ETF = "etf"
    BOND = "bond"
    CASH = "cash"
    OTHER = "other"


class AssetClass(str, PyEnum):
    DOMESTIC_EQUITY = "domestic_equity"
    INTERNATIONAL_EQUITY = "international_equity"
    LARGE_CAP = "large_cap"
    MID_CAP = "mid_cap"
    SMALL_CAP = "small_cap"
    DEBT = "debt"
    HYBRID = "hybrid"
    COMMODITY = "commodity"
    CASH = "cash"
    OTHER = "other"


class CurrencyCode(str, PyEnum):
    INR = "INR"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    OTHER = "OTHER"


class UploadStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
