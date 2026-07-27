"""Market data API routes with edge caching headers."""

from fastapi import APIRouter, Response

from app.services.market_service import (
    get_indices,
    get_market_summary,
    get_top_funds,
    get_currency_rates,
    refresh_market_cache,
)

router = APIRouter(prefix="/market", tags=["market"])

CACHE_HEADER = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"


@router.get("/indices")
def indices(response: Response):
    response.headers["Cache-Control"] = CACHE_HEADER
    return get_indices()


@router.get("/summary")
def summary(response: Response, region: str = "india"):
    response.headers["Cache-Control"] = CACHE_HEADER
    return get_market_summary(region)


@router.get("/top-funds")
def top_funds(response: Response):
    response.headers["Cache-Control"] = CACHE_HEADER
    return get_top_funds()


@router.get("/currency")
def currency(response: Response):
    response.headers["Cache-Control"] = CACHE_HEADER
    return get_currency_rates()


@router.post("/cron/refresh")
def refresh_cache():
    """Triggered by Vercel Cron to refresh Supabase market cache."""
    refresh_market_cache()
    return {"status": "success", "message": "Market cache refreshed"}
