from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
import random
import string
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
    # Save the file with a unique name
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_location = f"{UPLOAD_DIR}/{unique_filename}"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # AI Verification
        if not ai_service.detect_garbage(file_location):
            os.remove(file_location)
            raise HTTPException(status_code=400, detail="No garbage detected in the image.")
        
        # Generate Complaint ID
        # Extract first 3 chars of first word, uppercase
        prefix = description.split()[0][:3].upper() if description else "CMP"
        # Ensure alphanumeric
        prefix = "".join(c for c in prefix if c.isalnum())
        # Pad if too short
        if len(prefix) < 3:
            prefix = (prefix + "XXX")[:3]
            
        suffix = ''.join(random.choices(string.digits, k=5))
        complaint_id = f"{prefix}-{suffix}"

        db_report = models.Report(
            description=description,
            latitude=latitude,
            longitude=longitude,
            address=address,
            image_url=file_location,
            owner_id=current_user.id,
            complaint_id=complaint_id
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        await manager.broadcast(f"New Task Available: {description}")
        log_activity(db, "CREATE_REPORT", f"User {current_user.email} created report {db_report.id}", current_user.id)
        
        return db_report
    except Exception as e:
        # Cleanup if something fails and file exists
        if os.path.exists(file_location) and "db_report" not in locals():
             os.remove(file_location)
        raise e

@router.get("/reports/", response_model=List[schemas.Report])
def read_reports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    reports = db.query(models.Report).offset(skip).limit(limit).all()
    return reports

@router.get("/reports/my", response_model=List[schemas.Report])
def read_my_reports(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    return current_user.reports

@router.put("/reports/{report_id}/review", response_model=schemas.Report)
def review_report(
    report_id: int, 
    status: models.ReportStatus, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role not in [models.UserRole.WORKER, models.UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = status
    db.commit()
    db.refresh(report)
    return report
