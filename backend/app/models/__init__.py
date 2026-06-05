# Import all models so Alembic can discover them via Base.metadata
from app.models.user import User  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.dashboard import Dashboard  # noqa: F401
