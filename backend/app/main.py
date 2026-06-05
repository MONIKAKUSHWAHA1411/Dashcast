"""
main.py
~~~~~~~
FastAPI application entry-point for the Dashcast API.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, dashboards, public, reports

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Dashcast API",
    version="1.0.0",
    description="QA Dashboard SaaS – backend API",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

_origins = list(
    {
        "http://localhost:3000",
        settings.FRONTEND_URL,
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(dashboards.router)
app.include_router(public.router)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["meta"], summary="Health check")
def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------


@app.on_event("startup")
def on_startup() -> None:
    """Ensure the S3/MinIO bucket exists at application start."""
    try:
        from app.services.storage_service import ensure_bucket_exists

        ensure_bucket_exists()
    except Exception as exc:
        logger.warning("Could not ensure S3 bucket exists at startup: %s", exc)
