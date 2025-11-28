from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .models.user import UserRole, ReportStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.USER

class User(UserBase):
    id: int
    role: UserRole
    qr_login_token: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ReportBase(BaseModel):
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    image_url: str
    status: ReportStatus
    created_at: datetime
    owner_id: int
    worker_id: Optional[int] = None
    cleanup_image_url: Optional[str] = None
    cleanup_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class ActivityLogBase(BaseModel):
    action: str
    details: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    user_id: Optional[int] = None

class ActivityLog(ActivityLogBase):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    
    class Config:
        from_attributes = True
