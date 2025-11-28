from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import database, schemas
from ..models import user as models
from .auth import get_current_user
import sys
import os

# Import train function and inference service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from ai_service.train import train as train_model
from ai_service.inference import inference_service

router = APIRouter()

def check_admin(user: models.User):
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

def run_training_task():
    print("Starting background training task...")
    try:
        train_model()
        print("Training complete. Reloading model...")
        inference_service.reload_model()
    except Exception as e:
        print(f"Training failed: {e}")

@router.post("/admin/retrain")
def retrain_model(background_tasks: BackgroundTasks, current_user: models.User = Depends(get_current_user)):
    check_admin(current_user)
    background_tasks.add_task(run_training_task)
    return {"message": "Model training started in background"}

@router.get("/admin/reports", response_model=List[schemas.Report])
def read_all_reports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(models.Report).all()

@router.put("/admin/reports/{report_id}/assign/{worker_id}", response_model=schemas.Report)
def assign_task(
    report_id: int,
    worker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    worker = db.query(models.User).filter(models.User.id == worker_id, models.User.role == models.UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    report.worker_id = worker_id
    report.status = models.ReportStatus.ASSIGNED
    db.commit()
    db.refresh(report)
    return report

@router.get("/admin/workers", response_model=List[schemas.User])
def read_workers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(models.User).filter(models.User.role == models.UserRole.WORKER).all()
