from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    WORKER = "worker"
    ADMIN = "admin"

class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    CLEANED = "cleaned"
    VERIFIED = "verified"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default=UserRole.USER)
    qr_login_token = Column(String, unique=True, nullable=True)
    
    reports = relationship("Report", back_populates="owner", foreign_keys="[Report.owner_id]")
    tasks = relationship("Report", back_populates="worker", foreign_keys="[Report.worker_id]")

class ReportMedia(Base):
    __tablename__ = "report_media"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    file_url = Column(String)
    media_type = Column(String) # "image" or "video"
    
    report = relationship("Report", back_populates="media")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    image_url = Column(String) # Path to the uploaded image (kept for backward compatibility, or primary image)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String, nullable=True)
    complaint_id = Column(String, unique=True, index=True, nullable=True)
    status = Column(String, default=ReportStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    cleanup_image_url = Column(String, nullable=True)
    cleanup_time = Column(DateTime, nullable=True)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    owner = relationship("User", back_populates="reports", foreign_keys=[owner_id])
    worker = relationship("User", back_populates="tasks", foreign_keys=[worker_id])
    media = relationship("ReportMedia", back_populates="report", cascade="all, delete-orphan")
    
    cleanup_image_url = Column(String, nullable=True)
    cleanup_time = Column(DateTime, nullable=True)
