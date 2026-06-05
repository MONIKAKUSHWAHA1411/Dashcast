from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ReportOut(BaseModel):
    id: UUID
    original_filename: str
    file_type: str
    status: str
    raw_metrics: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    report_id: UUID
    status: str
