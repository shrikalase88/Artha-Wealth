"""PortfolioMetric schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PortfolioMetricRead(BaseModel):
    id: UUID
    portfolio_id: UUID
    user_id: UUID
    metric_date: date
    metric_name: str
    metric_value: Decimal | None = None
    payload: dict = {}
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
