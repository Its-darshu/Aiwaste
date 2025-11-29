from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.models.user import User, UserRole
from backend.api.auth import get_password_hash
import pytest
import uuid

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def admin_token():
    db = TestingSessionLocal()
    email = f"admin_{uuid.uuid4()}@example.com"
    password = "adminpassword"
    hashed_password = get_password_hash(password)
    admin_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name="Admin User",
        role=UserRole.ADMIN,
        phone_number=f"1234567890_{uuid.uuid4()}"
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    db.close()

    login_data = {
        "username": email,
        "password": password
    }
    response = client.post("/auth/login", data=login_data)
    return response.json()["access_token"]

def test_create_worker_success(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    worker_data = {
        "email": f"worker_{uuid.uuid4()}@example.com",
        "password": "workerpassword",
        "full_name": "Worker One",
        "phone_number": f"9876543210_{uuid.uuid4()}"
    }
    response = client.post("/admin/workers", json=worker_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == worker_data["email"]
    assert data["role"] == "worker"

def test_create_worker_duplicate_phone(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    phone = f"5555555555_{uuid.uuid4()}"
    
    # Create first worker
    worker1_data = {
        "email": f"worker1_{uuid.uuid4()}@example.com",
        "password": "workerpassword",
        "full_name": "Worker One",
        "phone_number": phone
    }
    response = client.post("/admin/workers", json=worker1_data, headers=headers)
    assert response.status_code == 200

    # Create second worker with same phone
    worker2_data = {
        "email": f"worker2_{uuid.uuid4()}@example.com",
        "password": "workerpassword",
        "full_name": "Worker Two",
        "phone_number": phone
    }
    response = client.post("/admin/workers", json=worker2_data, headers=headers)
    
    # Expect 400 Bad Request due to duplicate phone number
    assert response.status_code == 400
    assert response.json()["detail"] == "Phone number already registered"

def test_create_worker_empty_phone_duplicate(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create first worker with empty phone
    worker1_data = {
        "email": f"worker_empty1_{uuid.uuid4()}@example.com",
        "password": "workerpassword",
        "full_name": "Worker Empty One",
        "phone_number": ""
    }
    response = client.post("/admin/workers", json=worker1_data, headers=headers)
    assert response.status_code == 200

    # Create second worker with empty phone
    worker2_data = {
        "email": f"worker_empty2_{uuid.uuid4()}@example.com",
        "password": "workerpassword",
        "full_name": "Worker Empty Two",
        "phone_number": ""
    }
    response = client.post("/admin/workers", json=worker2_data, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["phone_number"] is None
