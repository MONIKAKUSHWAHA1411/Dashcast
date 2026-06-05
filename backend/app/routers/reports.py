"""
reports.py
~~~~~~~~~~
Endpoints for uploading QA reports and querying their processing status.
"""

import logging
import uuid
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.dashboard import Dashboard
from app.models.report import Report
from app.models.user import User
from app.schemas.dashboard import ReportWithDashboard
from app.schemas.report import ReportOut, UploadResponse
from app.services import dashboard_service, llm_service, parsing_service, storage_service
from app.utils.slugs import generate_slug

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

_ALLOWED_TYPES = {"csv", "xlsx", "xls", "pdf", "json"}
_CONTENT_TYPE_MAP = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xls": "application/vnd.ms-excel",
    "pdf": "application/pdf",
    "json": "application/json",
}
_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


# ---------------------------------------------------------------------------
# GET /reports
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=List[ReportOut],
    summary="List the current user's reports",
)
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReportOut]:
    reports = (
        db.query(Report)
        .filter(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )
    return reports


# ---------------------------------------------------------------------------
# POST /reports/upload
# ---------------------------------------------------------------------------

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload a QA report file for processing",
)
async def upload_report(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UploadResponse:
    # Determine extension
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '.{ext}'. Allowed: {sorted(_ALLOWED_TYPES)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 20 MB size limit.",
        )

    # Create a pending report row
    report = Report(
        user_id=current_user.id,
        original_filename=filename,
        file_type=ext,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Kick off background processing
    background_tasks.add_task(
        process_report,
        report_id=str(report.id),
        file_bytes=file_bytes,
        file_type=ext,
        filename=filename,
        user_id=str(current_user.id),
    )

    return UploadResponse(report_id=report.id, status="processing")


# ---------------------------------------------------------------------------
# GET /reports/{report_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{report_id}",
    response_model=ReportWithDashboard,
    summary="Get a report's status, metrics, and linked dashboard",
)
def get_report(
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportWithDashboard:
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    dashboard = (
        db.query(Dashboard)
        .filter(Dashboard.report_id == report_id)
        .order_by(Dashboard.created_at.desc())
        .first()
    )

    return ReportWithDashboard(
        report_id=report.id,
        dashboard_id=dashboard.id if dashboard else None,
        status=report.status,
    )


# ---------------------------------------------------------------------------
# Background task
# ---------------------------------------------------------------------------

def process_report(
    report_id: str,
    file_bytes: bytes,
    file_type: str,
    filename: str,
    user_id: str,
) -> None:
    """Pipeline: upload → parse → extract metrics → create dashboard.

    Runs in a FastAPI BackgroundTask (separate thread).  Opens its own DB
    session because the request session is already closed by this point.
    """
    from app.database import SessionLocal  # avoid circular at module level

    db: Session = SessionLocal()
    try:
        # 1. Mark as processing
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            logger.error("Background task: report %s not found.", report_id)
            return

        report.status = "processing"
        db.commit()

        # 2. Upload to S3
        storage_key = f"reports/{user_id}/{report_id}/{filename}"
        content_type = _CONTENT_TYPE_MAP.get(file_type, "application/octet-stream")
        try:
            storage_service.upload_file(file_bytes, storage_key, content_type)
            report.storage_key = storage_key
            db.commit()
        except Exception as exc:
            logger.warning("S3 upload failed (non-fatal): %s", exc)
            # Not fatal – we can still process the file in memory

        # 3. Parse file into raw text
        raw_text = parsing_service.extract_raw_text(file_bytes, file_type)

        # 4. Extract metrics via LLM
        metrics = llm_service.extract_metrics(raw_text)
        report.raw_metrics = metrics
        db.commit()

        # 5. Determine dashboard title
        suite_name = metrics.get("test_suite_name") if metrics else None
        title = suite_name or filename.rsplit(".", 1)[0] or "QA Dashboard"

        # 6. Generate dashboard config
        config = dashboard_service.generate_dashboard_config(metrics or {}, title)

        # 7. Create Dashboard row with a unique slug
        slug = _unique_slug(db)
        dashboard = Dashboard(
            user_id=user_id,
            report_id=report_id,
            title=title,
            slug=slug,
            is_published=False,
            config=config,
        )
        db.add(dashboard)
        db.commit()

        # 8. Mark report done
        report.status = "done"
        db.commit()
        logger.info("Report %s processed successfully.", report_id)

    except Exception as exc:
        logger.exception("Error processing report %s: %s", report_id, exc)
        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if report:
                report.status = "error"
                report.error_msg = str(exc)
                db.commit()
        except Exception as inner:
            logger.error("Could not update report error status: %s", inner)
    finally:
        db.close()


def _unique_slug(db: Session, max_attempts: int = 5) -> str:
    """Generate a slug that does not already exist in the dashboards table."""
    for _ in range(max_attempts):
        candidate = generate_slug()
        exists = db.query(Dashboard).filter(Dashboard.slug == candidate).first()
        if not exists:
            return candidate
    # Fallback: use longer slug if 7-char collisions are exhausted
    return generate_slug(length=12)
