from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import datetime
from .. import database, schemas
from ..models import user as models
from ..services.ai import ai_service
from .auth import get_current_user

router = APIRouter()

@router.get("/tasks/", response_model=List[schemas.Report])
def read_assigned_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.WORKER:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user.tasks

@router.post("/tasks/{report_id}/complete", response_model=schemas.Report)
async def complete_task(
    report_id: int,
    file: UploadFile = File(...),
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

    # Save the file
    file_location = f"uploads/cleanup_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # AI Verification
    if not ai_service.verify_cleanup(report.image_url, file_location):
        os.remove(file_location)
        raise HTTPException(status_code=400, detail="Cleanup verification failed.")
    
    report.cleanup_image_url = file_location
    report.cleanup_time = datetime.datetime.utcnow()
    report.status = models.ReportStatus.CLEANED
    
    db.commit()
    db.refresh(report)
    return report
