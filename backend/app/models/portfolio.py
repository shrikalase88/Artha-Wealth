"""Portfolio — container for one uploaded statement."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CurrencyCode, UploadStatus
from app.models.profile import Profile


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    source_file_path: Mapped[str | None] = mapped_column(String)

    upload_status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus, name="upload_status", native_enum=True),
        nullable=False,
        default=UploadStatus.PENDING,
        server_default=UploadStatus.PENDING.value,
    )
    parse_error: Mapped[str | None] = mapped_column(String)

    total_invested: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))
    total_value: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))

    currency: Mapped[CurrencyCode] = mapped_column(
        Enum(CurrencyCode, name="currency_code", native_enum=True),
        nullable=False,
        default=CurrencyCode.INR,
        server_default=CurrencyCode.INR.value,
    )
    as_of_date: Mapped[date | None] = mapped_column(Date)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[Profile] = relationship(back_populates="portfolios")
    assets: Mapped[list["Asset"]] = relationship(  # noqa: F821
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )
    metrics: Mapped[list["PortfolioMetric"]] = relationship(  # noqa: F821
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )
