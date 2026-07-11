"""FastAPI application entry point."""

import os
from pathlib import Path

# Redirect yfinance cache to a writable directory on Vercel to avoid Read-Only file system errors
CACHE_DIR = "/tmp/.cache"
Path(CACHE_DIR).mkdir(exist_ok=True, parents=True)

try:
    import platformdirs
    platformdirs.user_cache_dir = lambda *args, **kwargs: CACHE_DIR
    platformdirs.PlatformDirs.user_cache_dir = property(lambda *args, **kwargs: CACHE_DIR)
except ImportError:
    pass

try:
    import appdirs
    appdirs.user_cache_dir = lambda *args, **kwargs: CACHE_DIR
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.asset import router as asset_router
from app.api.v1.market import router as market_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio_router, prefix=settings.api_v1_prefix)
app.include_router(asset_router, prefix=settings.api_v1_prefix)
app.include_router(market_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health():
    return {"status": "ok"}
