"""
public.py
~~~~~~~~~
Unauthenticated endpoint for serving published dashboards by slug.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dashboard import Dashboard
from app.schemas.dashboard import DashboardOut

router = APIRouter(prefix="/d", tags=["public"])


@router.get(
    "/{slug}",
    response_model=DashboardOut,
    summary="Public – fetch a published dashboard by its slug",
)
def get_public_dashboard(slug: str, db: Session = Depends(get_db)) -> DashboardOut:
    """Return a published dashboard config; no authentication required.

    Returns 404 if the slug does not exist OR the dashboard is not published.
    """
    dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.slug == slug, Dashboard.is_published.is_(True))
        .first()
    )
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found or not published.",
        )
    return dashboard
