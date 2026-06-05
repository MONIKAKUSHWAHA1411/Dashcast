from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class WidgetConfig(BaseModel):
    id: str
    type: str
    position: int
    config: Dict[str, Any]


class DashboardConfig(BaseModel):
    version: int
    title: str
    widgets: List[WidgetConfig]


class DashboardOut(BaseModel):
    id: UUID
    title: str
    slug: str
    is_published: bool
    config: Any
    report_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class PublishResponse(BaseModel):
    slug: str
    public_url: str


class ReportWithDashboard(BaseModel):
    report_id: UUID
    dashboard_id: Optional[UUID] = None
    status: str
