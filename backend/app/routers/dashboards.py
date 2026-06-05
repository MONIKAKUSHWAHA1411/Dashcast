"""
dashboards.py
~~~~~~~~~~~~~
CRUD endpoints for user-owned dashboards (protected by JWT auth).
"""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.dashboard import Dashboard
from app.models.user import User
from app.schemas.dashboard import (
    DashboardListItem,
    DashboardOut,
    DashboardUpdate,
    PublishResponse,
)

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


def _get_owned_dashboard(
    dashboard_id: uuid.UUID,
    db: Session,
    current_user: User,
) -> Dashboard:
    """Return the dashboard if it exists and belongs to *current_user*, else raise 404."""
    dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.id == dashboard_id, Dashboard.user_id == current_user.id)
        .first()
    )
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found.",
        )
    return dashboard


# ---------------------------------------------------------------------------
# GET /dashboards
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=List[DashboardListItem],
    summary="List the current user's dashboards",
)
def list_dashboards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DashboardListItem]:
    dashboards = (
        db.query(Dashboard)
        .filter(Dashboard.user_id == current_user.id)
        .order_by(Dashboard.created_at.desc())
        .all()
    )
    return dashboards


# ---------------------------------------------------------------------------
# GET /dashboards/{id}
# ---------------------------------------------------------------------------

@router.get(
    "/{dashboard_id}",
    response_model=DashboardOut,
    summary="Get a full dashboard config",
)
def get_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOut:
    return _get_owned_dashboard(dashboard_id, db, current_user)


# ---------------------------------------------------------------------------
# PUT /dashboards/{id}
# ---------------------------------------------------------------------------

@router.put(
    "/{dashboard_id}",
    response_model=DashboardOut,
    summary="Update a dashboard's title and/or widget config",
)
def update_dashboard(
    dashboard_id: uuid.UUID,
    body: DashboardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOut:
    dashboard = _get_owned_dashboard(dashboard_id, db, current_user)

    if body.title is not None:
        dashboard.title = body.title
    if body.config is not None:
        dashboard.config = body.config

    dashboard.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dashboard)
    return dashboard


# ---------------------------------------------------------------------------
# DELETE /dashboards/{id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{dashboard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a dashboard",
)
def delete_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    dashboard = _get_owned_dashboard(dashboard_id, db, current_user)
    db.delete(dashboard)
    db.commit()


# ---------------------------------------------------------------------------
# POST /dashboards/{id}/publish
# ---------------------------------------------------------------------------

@router.post(
    "/{dashboard_id}/publish",
    response_model=PublishResponse,
    summary="Publish a dashboard (make it publicly accessible by slug)",
)
def publish_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PublishResponse:
    dashboard = _get_owned_dashboard(dashboard_id, db, current_user)

    dashboard.is_published = True
    dashboard.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dashboard)

    public_url = f"{settings.FRONTEND_URL}/d/{dashboard.slug}"
    return PublishResponse(slug=dashboard.slug, public_url=public_url)


# ---------------------------------------------------------------------------
# DELETE /dashboards/{id}/publish
# ---------------------------------------------------------------------------

@router.delete(
    "/{dashboard_id}/publish",
    response_model=DashboardOut,
    summary="Unpublish a dashboard",
)
def unpublish_dashboard(
    dashboard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardOut:
    dashboard = _get_owned_dashboard(dashboard_id, db, current_user)

    dashboard.is_published = False
    dashboard.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dashboard)
    return dashboard
