"""Asset — one line item inside a portfolio."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AssetClass, AssetType, CurrencyCode
from app.models.portfolio import Portfolio
from app.models.profile import Profile


class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="assets_quantity_positive"),
        CheckConstraint(
            "ticker IS NOT NULL OR scheme_code IS NOT NULL",
            name="assets_ticker_or_scheme",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    portfolio_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    asset_type: Mapped[AssetType] = mapped_column(
        Enum(AssetType, name="asset_type", native_enum=True), nullable=False
    )
    asset_class: Mapped[AssetClass] = mapped_column(
        Enum(AssetClass, name="asset_class", native_enum=True),
        nullable=False,
        default=AssetClass.OTHER,
        server_default=AssetClass.OTHER.value,
    )

    ticker: Mapped[str | None] = mapped_column(String)
    scheme_code: Mapped[str | None] = mapped_column(String)
    name: Mapped[str] = mapped_column(String, nullable=False)
    isin: Mapped[str | None] = mapped_column(String)

    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    average_buy_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    cost_basis: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))
    current_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    market_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))

    currency: Mapped[CurrencyCode] = mapped_column(
        Enum(CurrencyCode, name="currency_code", native_enum=True),
        nullable=False,
        default=CurrencyCode.INR,
        server_default=CurrencyCode.INR.value,
    )
    last_price_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    meta: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    portfolio: Mapped[Portfolio] = relationship(back_populates="assets")
    user: Mapped[Profile] = relationship()
