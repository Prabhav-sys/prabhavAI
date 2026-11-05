from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def live():
    return {"status": "alive", "service": settings.app_name}


@router.get("/health/ready")
async def ready():
    return {
        "status": "ready",
        "providers_configured": {
            "groq": bool(settings.groq_api_key),
            "qdrant": bool(settings.qdrant_url and settings.qdrant_api_key),
            "tavily": bool(settings.tavily_api_key),
            "weaviate": settings.weaviate_enabled,
        },
    }
