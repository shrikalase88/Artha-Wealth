"""Asset service — CRUD operations via Supabase REST API."""

from app.supabase_client import get_supabase
from app.models.enums import UploadStatus
from uuid import UUID


def get_assets_by_portfolio(portfolio_id: UUID) -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("assets").eq("portfolio_id", str(portfolio_id)).select().execute()
    return result.data if isinstance(result.data, list) else []


def get_assets_by_user(user_id: UUID) -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("assets").eq("user_id", str(user_id)).select().order("name").execute()
    return result.data if isinstance(result.data, list) else []


def get_pending_portfolios() -> list[dict]:
    supabase = get_supabase()
    result = supabase.from_table("portfolios").eq("upload_status", UploadStatus.PENDING.value).select().execute()
    return result.data if isinstance(result.data, list) else []
