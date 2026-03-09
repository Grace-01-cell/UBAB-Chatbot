from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[3]   # backend/
PDF_DIR = BASE_DIR / "data" / "raw_pdfs"


@router.get("/files/{doc_name}")
def get_pdf_file(doc_name: str):
    """
    Serve a PDF file from the local SOP folder for browser viewing.
    """
    if not doc_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    safe_name = Path(doc_name).name
    file_path = PDF_DIR / safe_name

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="PDF file not found.")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"'
        },
    )