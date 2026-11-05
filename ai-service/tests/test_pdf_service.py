import pytest
from fastapi import HTTPException, UploadFile
from io import BytesIO
from app.services.pdf_service import read_and_extract_pdf


@pytest.mark.asyncio
async def test_rejects_non_pdf():
    upload = UploadFile(filename="resume.txt", file=BytesIO(b"hello world"))
    with pytest.raises(HTTPException) as error:
        await read_and_extract_pdf(upload)
    assert error.value.status_code == 415
