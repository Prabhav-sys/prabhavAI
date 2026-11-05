from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.resumes import router as resumes_router
from app.api.routes.interviews import router as interviews_router
from app.api.routes.research import router as research_router
from app.api.routes.job_matching import router as job_matching_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ai_service_starting", environment=settings.app_env)
    yield
    logger.info("ai_service_stopping")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Internal AI, resume intelligence and retrieval service for prabhavAI.",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
)
# No browser CORS origins are enabled: the browser must call Node, not this internal service.
app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(resumes_router, prefix=settings.api_prefix)
app.include_router(interviews_router, prefix=settings.api_prefix)
app.include_router(research_router, prefix=settings.api_prefix)
app.include_router(job_matching_router, prefix=settings.api_prefix)
register_exception_handlers(app)


@app.get("/")
async def root():
    return {"service": settings.app_name, "status": "running", "api_prefix": settings.api_prefix}
