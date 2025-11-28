from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import datetime
from .. import database, schemas
from ..models import user as models
from ..services.ai import ai_service
from ..services.websocket import manager
from ..services.activity import log_activity
from .auth import get_current_user

router = APIRouter()

@router.get("/tasks/my", response_model=List[schemas.Report])
def read_my_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user.tasks

@router.get("/tasks/available", response_model=List[schemas.Report])
def read_available_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Report).filter(models.Report.status == models.ReportStatus.PENDING).all()

@router.post("/tasks/{report_id}/claim", response_model=schemas.Report)
async def claim_task(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.status != models.ReportStatus.PENDING:
        raise HTTPException(status_code=400, detail="Task is not available")
    
    report.worker_id = current_user.id
    report.status = models.ReportStatus.ASSIGNED
    db.commit()
    db.refresh(report)
    
    await manager.broadcast(f"Task #{report.id} claimed by {current_user.full_name}")
    log_activity(db, "CLAIM_TASK", f"Worker {current_user.email} claimed task {report.id}", current_user.id)
    
    return report


import math

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371e3 # Earth radius in meters
    phi1 = lat1 * math.pi / 180
    phi2 = lat2 * math.pi / 180
    delta_phi = (lat2 - lat1) * math.pi / 180
    delta_lambda = (lon2 - lon1) * math.pi / 180

    a = math.sin(delta_phi / 2) * math.sin(delta_phi / 2) + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

@router.post("/tasks/{report_id}/complete", response_model=schemas.Report)
async def complete_task(
    report_id: int,
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.worker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this task")

    # GPS Verification
    distance = calculate_distance(latitude, longitude, report.latitude, report.longitude)
    if distance > 200: # 200 meters radius
        raise HTTPException(status_code=400, detail=f"Location mismatch. You are {int(distance)}m away from the task location.")

    # Save the file
    file_location = f"uploads/cleanup_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # AI Verification
    if not ai_service.verify_cleanup(report.image_url, file_location):
        os.remove(file_location)
        raise HTTPException(status_code=400, detail="Cleanup verification failed. Garbage still detected.")
    
    report.cleanup_image_url = file_location
    report.cleanup_time = datetime.datetime.utcnow()
    report.status = models.ReportStatus.CLEANED
    
    db.commit()
    db.refresh(report)
    
    await manager.broadcast(f"Task #{report.id} completed by {current_user.full_name}")
    log_activity(db, "COMPLETE_TASK", f"Worker {current_user.email} completed task {report.id}", current_user.id)
    
    return report
