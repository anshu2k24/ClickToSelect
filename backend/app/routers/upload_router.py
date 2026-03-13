from fastapi import APIRouter, UploadFile, File
import shutil
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Upload"])
@router.post("/resume")
def upload_resume(file: UploadFile = File(...)):

    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name
    path = uploads_dir / safe_name

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "path": str(path)
    }