from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from .. import database, schemas
from ..models import user as models
from ..services.ai import ai_service
from ..services.websocket import manager
from ..services.activity import log_activity
from .auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/reports/predict")
async def predict_garbage(file: UploadFile = File(...)):
    contents = await file.read()
    is_garbage = ai_service.detect_garbage_bytes(contents)
    return {"is_garbage": is_garbage}

@router.post("/reports/", response_model=schemas.Report)
async def create_report(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(None),
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Save the file
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # AI Verification
    if not ai_service.detect_garbage(file_location):
        os.remove(file_location)
        raise HTTPException(status_code=400, detail="No garbage detected in the image.")
    
    db_report = models.Report(
        description=description,
        latitude=latitude,
        longitude=longitude,
        address=address,
        image_url=file_location,
        owner_id=current_user.id
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    await manager.broadcast(f"New Task Available: {description}")
    log_activity(db, "CREATE_REPORT", f"User {current_user.email} created report {db_report.id}", current_user.id)
    
    return db_report

@router.get("/reports/", response_model=List[schemas.Report])
def read_reports(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    reports = db.query(models.Report).offset(skip).limit(limit).all()
    return reports

@router.get("/reports/my", response_model=List[schemas.Report])
def read_my_reports(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    return current_user.reports
