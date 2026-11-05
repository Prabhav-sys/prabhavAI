import pymupdf
from fastapi import HTTPException, UploadFile
from app.core.config import settings

PDF_MAGIC = b"%PDF-"


async def read_and_extract_pdf(file: UploadFile) -> tuple[str, int, list[str]]:
    filename = (file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are accepted")
    data = await file.read(settings.max_upload_size_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF exceeds the configured upload limit")
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(status_code=415, detail="File content is not a valid PDF")
    try:
        document = pymupdf.open(stream=data, filetype="pdf")
        if document.is_encrypted:
            raise HTTPException(status_code=422, detail="Password-protected PDFs are not supported")
        if document.page_count > settings.max_pdf_pages:
            raise HTTPException(status_code=413, detail=f"PDF exceeds {settings.max_pdf_pages} pages")
        pages = [page.get_text("text") for page in document]
        document.close()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Unable to parse PDF") from exc
    text = "\n".join(part.strip() for part in pages if part.strip())
    warnings = []
    if len(text.strip()) < 80:
        warnings.append("Very little text was extracted; the PDF may be scanned or image-based.")
    if not text.strip():
        raise HTTPException(status_code=422, detail="No selectable text found. OCR is not enabled yet.")
    return text, len(pages), warnings
