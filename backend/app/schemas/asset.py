"""Asset schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import AssetClass, AssetType, CurrencyCode


class AssetBase(BaseModel):
    asset_type: AssetType
    asset_class: AssetClass = AssetClass.OTHER
    ticker: str | None = None
    scheme_code: str | None = None
    name: str = Field(..., min_length=1, max_length=300)
    isin: str | None = None
    quantity: Decimal = Field(..., gt=0)
    average_buy_price: Decimal | None = None
    cost_basis: Decimal | None = None
    current_price: Decimal | None = None
    market_value: Decimal | None = None
    currency: CurrencyCode = CurrencyCode.INR
    meta: dict = Field(default_factory=dict, serialization_alias="metadata", validation_alias="metadata")

    @field_validator("ticker", "scheme_code")
    @classmethod
    def at_least_one_identifier(cls, v, info):
        # Allow empty strings; the SQL CHECK enforces actual identifier presence.
        return v


class AssetCreate(AssetBase):
    portfolio_id: UUID
    user_id: UUID

    model_config = ConfigDict(populate_by_name=True)


class AssetUpdate(BaseModel):
    asset_class: AssetClass | None = None
    name: str | None = None
    quantity: Decimal | None = Field(default=None, gt=0)
    average_buy_price: Decimal | None = None
    cost_basis: Decimal | None = None
    current_price: Decimal | None = None
    market_value: Decimal | None = None
    last_price_at: datetime | None = None
    metadata: dict | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetRead(AssetBase):
    id: UUID
    portfolio_id: UUID
    user_id: UUID
    unrealized_gain: Decimal | None = None
    last_price_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
