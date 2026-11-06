from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from app.core.security import require_internal_key, require_user_id
from app.core.logging import get_logger
from app.schemas.jd_match import JobDescriptionMatchRequest, JobDescriptionMatchResponse
from app.services.jd_match_service import ResumeEvidenceNotFoundError, match_resume_to_job
from app.services.pdf_service import read_and_extract_pdf

logger = get_logger(__name__)

router = APIRouter(
    prefix="/job-matching",
    tags=["job-matching"],
    dependencies=[Depends(require_internal_key)],
)


@router.post("/match", response_model=JobDescriptionMatchResponse)
async def match_job(request: JobDescriptionMatchRequest, user_id: str = Depends(require_user_id)):
    try:
        return await match_resume_to_job(user_id=user_id, request=request)
    except ResumeEvidenceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Job description matching failed", error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="Job description matching failed") from exc


@router.post("/match-pdf", response_model=JobDescriptionMatchResponse)
async def match_job_pdf(
    resume_id: str = Form(..., min_length=1, max_length=128),
    job_title: str = Form(..., min_length=2, max_length=160),
    company: str | None = Form(default=None, max_length=160),
    job_description_pdf: UploadFile = File(...),
    user_id: str = Depends(require_user_id),
):
    try:
        description, _, _ = await read_and_extract_pdf(job_description_pdf)
        if len(description) < 100:
            raise HTTPException(
                status_code=422,
                detail="The job-description PDF needs at least 100 characters of selectable text.",
            )
        if len(description) > 20000:
            raise HTTPException(
                status_code=413,
                detail="Extracted job-description text exceeds the 20,000-character limit.",
            )
        request = JobDescriptionMatchRequest(
            resume_id=resume_id,
            job_title=job_title,
            company=company or None,
            job_description=description,
        )
        return await match_resume_to_job(user_id=user_id, request=request)
    except HTTPException:
        raise
    except ResumeEvidenceNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Job description PDF matching failed", error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="Job description matching failed") from exc
