"""Market data API routes."""

from fastapi import APIRouter

from app.services.market_service import get_indices, get_market_summary, get_top_funds, get_currency_rates

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/indices")
def indices():
    return get_indices()


@router.get("/summary")
def summary():
    return get_market_summary()


@router.get("/top-funds")
def top_funds():
    return get_top_funds()

@router.get("/currency")
def currency():
    return get_currency_rates()
