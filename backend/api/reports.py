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
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    saved_files = []
    garbage_detected = False
    
    try:
        for file in files:
            # Save the file with a unique name
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_location = f"{UPLOAD_DIR}/{unique_filename}"
            
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            media_type = "video" if file.content_type.startswith("video") else "image"
            saved_files.append({"url": file_location, "type": media_type})

            # AI Verification (only for images)
            if media_type == "image" and not garbage_detected:
                if ai_service.detect_garbage(file_location):
                    garbage_detected = True
        
        # If images were uploaded, ensure at least one has garbage
        has_images = any(f["type"] == "image" for f in saved_files)
        if has_images and not garbage_detected:
            # Cleanup
            for f in saved_files:
                if os.path.exists(f["url"]):
                    os.remove(f["url"])
            raise HTTPException(status_code=400, detail="No garbage detected in the uploaded images.")
        
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

        # Use the first file as the main image_url for backward compatibility
        main_image_url = saved_files[0]["url"] if saved_files else ""

        db_report = models.Report(
            description=description,
            latitude=latitude,
            longitude=longitude,
            address=address,
            image_url=main_image_url,
            owner_id=current_user.id,
            complaint_id=complaint_id
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Save media entries
        for f in saved_files:
            db_media = models.ReportMedia(
                report_id=db_report.id,
                file_url=f["url"],
                media_type=f["type"]
            )
            db.add(db_media)
        
        db.commit()
        db.refresh(db_report)
        
        await manager.broadcast(f"New Task Available: {description}")
        log_activity(db, "CREATE_REPORT", f"User {current_user.email} created report {db_report.id}", current_user.id)
        
        return db_report
    except Exception as e:
        # Cleanup if something fails and file exists
        for f in saved_files:
             if os.path.exists(f["url"]):
                 os.remove(f["url"])
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

@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Optional: Delete the image file associated with the report
    if report.image_url and os.path.exists(report.image_url):
        try:
            os.remove(report.image_url)
        except Exception as e:
            print(f"Error deleting file {report.image_url}: {e}")

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}
