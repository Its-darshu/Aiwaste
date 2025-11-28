from sqlalchemy.orm import Session
from ..models import activity as models

def log_activity(db: Session, action: str, details: str = None, user_id: int = None):
    db_log = models.ActivityLog(action=action, details=details, user_id=user_id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log