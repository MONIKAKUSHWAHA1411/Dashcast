import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Make sure the project root is on the Python path so we can import `app`.
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Alembic Config object – gives access to values in alembic.ini.
# ---------------------------------------------------------------------------
config = context.config

# Inject the real DATABASE_URL from our application settings, overriding
# whatever placeholder is in alembic.ini.
from app.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# ---------------------------------------------------------------------------
# Interpret the config file for Python logging.
# ---------------------------------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Import all models so their tables are registered on Base.metadata.
# ---------------------------------------------------------------------------
from app.database import Base  # noqa: E402
import app.models  # noqa: E402, F401  – registers User, Report, Dashboard

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Run migrations
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL, not a live connection.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
