"""Database connection and session management."""
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings
from app.db.models import Base


def _database_engine_config(database_url: str) -> tuple[str, dict[str, object]]:
    """Build dialect-specific engine settings for SQLite and Neon PostgreSQL."""
    if database_url.startswith("postgres://"):
        database_url = "postgresql+asyncpg://" + database_url[len("postgres://"):]
    elif database_url.startswith("postgresql://"):
        database_url = "postgresql+asyncpg://" + database_url[len("postgresql://"):]

    if database_url.startswith("postgresql+asyncpg://"):
        parts = urlsplit(database_url)
        query = [(key, value) for key, value in parse_qsl(parts.query) if key not in {"sslmode", "channel_binding"}]
        clean_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
        return clean_url, {
            "connect_args": {"ssl": True, "statement_cache_size": 0},
            "pool_size": 2,
            "max_overflow": 2,
            "pool_pre_ping": True,
            "pool_recycle": 300,
        }

    return database_url, {"connect_args": {"check_same_thread": False}}


database_url, engine_options = _database_engine_config(settings.database_url)

# Create async engine
engine = create_async_engine(
    database_url,
    echo=settings.log_level == "DEBUG",
    future=True,
    **engine_options,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """Dependency for getting database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
