from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
from .. import database, schemas
from ..models import user as models
from ..models import activity as activity_models
from ..services.activity import log_activity
from .auth import get_current_user, get_password_hash
import sys
import os

# Add project root to path to allow importing ai_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from ai_service.train import train as train_model
from ai_service.inference import inference_service

from ..services.websocket import manager

router = APIRouter()

def check_admin(user: models.User):
    if user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/admin/stats")
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    
    active_complaints = db.query(models.Report).filter(
        models.Report.status.in_([models.ReportStatus.PENDING, models.ReportStatus.ASSIGNED])
    ).count()
    
    online_workers = manager.get_active_count()
    
    return {
        "active_complaints": active_complaints,
        "online_workers": online_workers
    }

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

@router.post("/admin/workers", response_model=schemas.User)
def create_worker(user: schemas.UserCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    check_admin(current_user)
    
    # Check email uniqueness
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Handle phone number
    phone_number = user.phone_number
    if phone_number:
        # Check phone number uniqueness if provided
        if db.query(models.User).filter(models.User.phone_number == phone_number).first():
            raise HTTPException(status_code=400, detail="Phone number already registered")
    else:
        # Convert empty string to None to avoid unique constraint violation
        phone_number = None
    
    hashed_password = get_password_hash(user.password)
    # Generate QR token
    qr_token = str(uuid.uuid4())
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone_number=phone_number,
        role=models.UserRole.WORKER,
        qr_login_token=qr_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_activity(db, "CREATE_WORKER", f"Admin created worker {db_user.email}", current_user.id)
    
    return db_user

@router.get("/admin/workers", response_model=List[schemas.User])
def read_workers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(models.User).filter(models.User.role == models.UserRole.WORKER).all()

@router.delete("/admin/workers/{worker_id}")
def delete_worker(worker_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    check_admin(current_user)
    worker = db.query(models.User).filter(models.User.id == worker_id, models.User.role == models.UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    email = worker.email
    db.delete(worker)
    db.commit()
    
    log_activity(db, "DELETE_WORKER", f"Admin deleted worker {email}", current_user.id)
    
    return {"message": "Worker deleted successfully"}

@router.post("/admin/workers/{worker_id}/regenerate-qr", response_model=schemas.User)
def regenerate_qr(worker_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    check_admin(current_user)
    worker = db.query(models.User).filter(models.User.id == worker_id, models.User.role == models.UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    worker.qr_login_token = str(uuid.uuid4())
    db.commit()
    db.refresh(worker)
    return worker

@router.get("/admin/users", response_model=List[schemas.User])
def read_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(models.User).filter(models.User.role == models.UserRole.USER).all()

@router.get("/admin/all-users", response_model=List[schemas.User])
def read_all_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(models.User).all()

@router.get("/admin/activity-logs", response_model=List[schemas.ActivityLog])
def read_activity_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    check_admin(current_user)
    return db.query(activity_models.ActivityLog).order_by(activity_models.ActivityLog.timestamp.desc()).all()
