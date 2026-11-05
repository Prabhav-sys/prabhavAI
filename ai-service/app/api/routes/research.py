from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_internal_key, require_user_id
from app.schemas.research import ResearchRequest, ResearchResponse
from app.services.research_service import research

router = APIRouter(prefix="/research", tags=["research"], dependencies=[Depends(require_internal_key)])


@router.post("/search", response_model=ResearchResponse)
async def search(request: ResearchRequest, user_id: str = Depends(require_user_id)):
    del user_id
    try:
        return await research(request.query, request.max_results, request.include_answer)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Research provider request failed") from exc
