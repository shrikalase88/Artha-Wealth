"""Asset API routes."""

from uuid import UUID

from fastapi import APIRouter

from app.schemas.asset import AssetRead
from app.services.asset_service import get_assets_by_user, sync_user_assets

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/user/{user_id}")
def list_user_assets(user_id: UUID):
    assets = get_assets_by_user(user_id)
    return [AssetRead.model_validate(a) for a in assets]


@router.post("/user/{user_id}/sync")
def sync_assets(user_id: UUID):
    assets = sync_user_assets(user_id)
    return [AssetRead.model_validate(a) for a in assets]
