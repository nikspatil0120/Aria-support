"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager

from app.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
)
from app.db.database import init_db, AsyncSessionLocal
from app.db.seed import reset_demo_orders, seed_orders
from app.api import health, orders, sessions, livekit

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Aura Skincare AI Support Backend...")
    logger.info(f"Database URL: {settings.database_url}")
    logger.info(f"Frontend Origin: {settings.frontend_origin}")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Seed orders
    async with AsyncSessionLocal() as db:
        await seed_orders(db)
        await reset_demo_orders(db)
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI app
app = FastAPI(
    title="Aura Skincare AI Support API",
    description="Backend API for Aria voice support agent",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
allowed_origins = settings.get_cors_origins()
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Register routers
app.include_router(health.router)
app.include_router(orders.router)
app.include_router(sessions.router)
app.include_router(livekit.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Aura Skincare AI Support API",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
