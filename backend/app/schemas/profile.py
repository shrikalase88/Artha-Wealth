"""Profile schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import CurrencyCode


class ProfileBase(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    city: str | None = None
    base_currency: CurrencyCode = CurrencyCode.INR


class ProfileRead(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    city: str | None = None
    base_currency: CurrencyCode | None = None

    model_config = ConfigDict(from_attributes=True)
