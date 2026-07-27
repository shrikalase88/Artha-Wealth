"""FastAPI application entry point with enterprise security & performance middleware."""

import os
import time
from collections import defaultdict
from pathlib import Path

# Set yfinance cache directory to writable location on serverless environments
os.environ["YFINANCE_CACHE_DIR"] = "/tmp/.cache"
Path("/tmp/.cache").mkdir(exist_ok=True, parents=True)

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.asset import router as asset_router
from app.api.v1.market import router as market_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0", docs_url=None, redoc_url=None)

# 1. Automated Response Compression (GZip)
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. Strict CORS Configuration protecting from cross-origin/CSRF attackers
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://artha-wealth.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://artha-wealth-.*-shrikant-kalase-s-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Gemini-API-Key", "Accept"],
)

# 3. Sliding-window IP Rate Limiter (Anti-DDoS & Brute-force protection)
_IP_REQUEST_LOGS: dict[str, list[float]] = defaultdict(list)
_MAX_REQUESTS_PER_MINUTE = 180
_RATE_LIMIT_WINDOW = 60.0

@app.middleware("http")
async def rate_limit_and_security_middleware(request: Request, call_next):
    # Enforce payload size limit (max 10MB)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        return Response(content="Payload size exceeds maximum allowed limit (10MB)", status_code=413)

    # IP Rate Limiting (exclude health check)
    if request.url.path != "/health":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        timestamps = _IP_REQUEST_LOGS[client_ip]
        # Remove timestamps outside the sliding window
        _IP_REQUEST_LOGS[client_ip] = [t for t in timestamps if now - t < _RATE_LIMIT_WINDOW]
        
        if len(_IP_REQUEST_LOGS[client_ip]) >= _MAX_REQUESTS_PER_MINUTE:
            return Response(content="Too Many Requests. Rate limit exceeded.", status_code=429)
        _IP_REQUEST_LOGS[client_ip].append(now)

    response = await call_next(request)

    # 4. Enterprise Google-Apps HTTP Security Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none';"

    return response

app.include_router(portfolio_router, prefix=settings.api_v1_prefix)
app.include_router(asset_router, prefix=settings.api_v1_prefix)
app.include_router(market_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health():
    return {"status": "ok"}
