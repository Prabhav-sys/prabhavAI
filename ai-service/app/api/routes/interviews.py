from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_internal_key, require_user_id
from app.schemas.interview import (
    InterviewQuestionRequest,
    InterviewQuestionResponse,
    InterviewSessionStartRequest,
    InterviewTurnRequest,
    InterviewTurnResponse,
)
from app.services.interview_service import (
    evaluate_interview_turn,
    generate_questions,
    start_interview,
)

router = APIRouter(
    prefix="/interviews",
    tags=["interviews"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/questions", response_model=InterviewQuestionResponse)
async def questions(request: InterviewQuestionRequest, user_id: str = Depends(require_user_id)):
    del user_id  # Identity is verified by Node; retained for service audit/authorization contract.
    try:
        return await generate_questions(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Interview question generation failed") from exc


@router.post("/sessions/start")
async def start_session(
    request: InterviewSessionStartRequest,
    user_id: str = Depends(require_user_id),
):
    del user_id
    try:
        return await start_interview(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Interview could not be started") from exc


@router.post("/sessions/turn", response_model=InterviewTurnResponse)
async def interview_turn(
    request: InterviewTurnRequest,
    user_id: str = Depends(require_user_id),
):
    del user_id
    try:
        return await evaluate_interview_turn(request)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Interview turn evaluation failed") from exc
