from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_internal_key, require_user_id
from app.schemas.interview import InterviewQuestionRequest, InterviewQuestionResponse
from app.services.interview_service import generate_questions

router = APIRouter(prefix="/interviews", tags=["interviews"], dependencies=[Depends(require_internal_key)])


@router.post("/questions", response_model=InterviewQuestionResponse)
async def questions(request: InterviewQuestionRequest, user_id: str = Depends(require_user_id)):
    del user_id  # Identity is verified by Node; retained for service audit/authorization contract.
    try:
        return await generate_questions(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Interview question generation failed") from exc
