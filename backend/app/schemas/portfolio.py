"""Portfolio schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CurrencyCode, UploadStatus


class PortfolioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    source_file_path: str | None = None
    currency: CurrencyCode = CurrencyCode.INR
    as_of_date: date | None = None


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    upload_status: UploadStatus | None = None
    parse_error: str | None = None
    total_invested: Decimal | None = None
    total_value: Decimal | None = None
    as_of_date: date | None = None

    model_config = ConfigDict(from_attributes=True)


class PortfolioRead(PortfolioBase):
    id: UUID
    user_id: UUID
    upload_status: UploadStatus
    parse_error: str | None = None
    total_invested: Decimal | None = None
    total_value: Decimal | None = None
    total_gain: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
