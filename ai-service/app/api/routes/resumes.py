from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from app.core.security import require_internal_key, require_user_id
from app.schemas.resume import ResumeAnalysisResponse, ResumeSearchRequest, ResumeSearchHit
from app.services.pdf_service import read_and_extract_pdf
from app.services.resume_service import analyze_resume
from app.services.vector_service import search_chunks, delete_resume_chunks

router = APIRouter(prefix="/resumes", tags=["resumes"], dependencies=[Depends(require_internal_key)])


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze(file: UploadFile = File(...), resume_id: str | None = Form(default=None), user_id: str = Depends(require_user_id)):
    text, pages, warnings = await read_and_extract_pdf(file)
    try:
        result = await analyze_resume(user_id=user_id, resume_id=resume_id, text=text, page_count=pages)
        result["warnings"] = warnings
        return result
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(status_code=502, detail="Resume analysis or vector indexing failed") from exc


@router.post("/search", response_model=list[ResumeSearchHit])
async def search(request: ResumeSearchRequest, user_id: str = Depends(require_user_id)):
    try:
        points = search_chunks(user_id=user_id, query=request.query, limit=request.limit, resume_id=request.resume_id)
        return [ResumeSearchHit(
            chunk_id=str(point.id), resume_id=str(point.payload.get("resume_id", "")),
            text=str(point.payload.get("text", "")), score=float(point.score or 0),
        ) for point in points]
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Vector search is unavailable") from exc


@router.delete("/{resume_id}")
async def delete_index(
    resume_id: str,
    user_id: str = Depends(require_user_id)
):
    try:
        delete_resume_chunks(
            user_id=user_id,
            resume_id=resume_id
        )

        return {
            "status": "deleted",
            "resume_id": resume_id
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Vector deletion failed"
        ) from exc