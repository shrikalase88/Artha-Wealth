"""Portfolio API routes."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Header

from app.schemas.portfolio import PortfolioRead
from app.services.portfolio_service import process_portfolio_pdf, process_portfolio_screenshot
from app.supabase_client import get_supabase
from pydantic import BaseModel

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


class ParseRequest(BaseModel):
    portfolio_id: str
    user_id: str
    file_path: str


import httpx
from app.core.config import settings

def verify_user_token(user_id: str, authorization: str | None = Header(None)) -> None:
    """Verify that the authorization header contains a valid Supabase token matching the user_id."""
    if not authorization:
        if settings.debug:
            return
        raise HTTPException(status_code=401, detail="Missing authorization header")
        
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
        
    token = authorization.split(" ")[1]
    url = f"{settings.supabase_url}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.supabase_service_role_key
    }
    
    try:
        resp = httpx.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session token")
        user_data = resp.json()
        token_user_id = user_data.get("id")
        
        if token_user_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden: Token user ID does not match request user ID")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Authentication service unavailable: {e}")


@router.post("/parse")
def parse_portfolio(request: ParseRequest, authorization: str | None = Header(None)):
    """Trigger PDF parsing for a portfolio."""
    verify_user_token(request.user_id, authorization)
    try:
        result = process_portfolio_pdf(
            portfolio_id=request.portfolio_id,
            user_id=request.user_id,
            file_path=request.file_path,
        )
        return PortfolioRead.model_validate(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {e}")


@router.post("/parse-screenshot")
def parse_screenshot(request: ParseRequest, authorization: str | None = Header(None), x_gemini_api_key: str | None = Header(None)):
    """Trigger screenshot parsing for a portfolio."""
    verify_user_token(request.user_id, authorization)
    try:
        result = process_portfolio_screenshot(
            portfolio_id=request.portfolio_id,
            user_id=request.user_id,
            file_path=request.file_path,
            gemini_api_key=x_gemini_api_key,
        )
        return PortfolioRead.model_validate(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {e}")


@router.get("/{portfolio_id}")
def get_portfolio(portfolio_id: UUID):
    supabase = get_supabase()
    result = supabase.from_table("portfolios").eq("id", str(portfolio_id)).select().execute()
    data = result.data
    if not data:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    portfolio = data[0] if isinstance(data, list) else data
    return PortfolioRead.model_validate(portfolio)
