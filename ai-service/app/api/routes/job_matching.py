from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_internal_key, require_user_id
from app.schemas.jd_match import JobDescriptionMatchRequest, JobDescriptionMatchResponse
from app.services.jd_match_service import match_resume_to_job

router = APIRouter(
    prefix="/job-matching",
    tags=["job-matching"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/match", response_model=JobDescriptionMatchResponse)
async def match_job(request: JobDescriptionMatchRequest, user_id: str = Depends(require_user_id)):
    try:
        return await match_resume_to_job(user_id=user_id, request=request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Job description matching failed") from exc
