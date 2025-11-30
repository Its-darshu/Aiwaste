from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai import ai_service
from unittest.mock import MagicMock
import pytest

client = TestClient(app)

# Mock AI Service to avoid loading model during tests
ai_service.detect_garbage = MagicMock(return_value=True)
ai_service.verify_cleanup = MagicMock(return_value=True)

def test_auth_flow():
    # 1. Signup
    signup_data = {
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "role": "user"
    }
    response = client.post("/auth/signup", json=signup_data)
    # If user already exists from previous run, it might fail with 400, which is fine for this simple test check
    if response.status_code != 400:
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data

    # 2. Login
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    token = token_data["access_token"]
    
    # 3. Get Me
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "test@example.com"
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_report_flow():
    # Login first
    # Ensure user exists (signup if needed, or just use the one from test_auth_flow if order is guaranteed, but better to be safe)
    signup_data = {
        "email": "reporter@example.com",
        "password": "password123",
        "full_name": "Reporter",
        "role": "user"
    }
    client.post("/auth/signup", json=signup_data)
    
    login_data = {
        "username": "reporter@example.com",
        "password": "password123"
    }
    response = client.post("/auth/login", data=login_data)
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Report
    # We need to upload a file
    # Create a dummy file content
    files = {"file": ("test.jpg", b"fake image content", "image/jpeg")}
    data = {
        "description": "Test Garbage",
        "latitude": "12.9716",
        "longitude": "77.5946"
    }
    # Note: We mocked ai_service.detect_garbage to return True
    response = client.post("/reports/", data=data, files=files, headers=headers)
    assert response.status_code == 200
    assert response.json()["description"] == "Test Garbage"

def test_phone_auth_flow():
    # 1. Signup with phone
    signup_data = {
        "email": "phoneuser@example.com",
        "password": "password123",
        "full_name": "Phone User",
        "role": "user",
        "phone_number": "1234567890"
    }
    response = client.post("/auth/signup", json=signup_data)
    if response.status_code != 400:
        assert response.status_code == 200
        data = response.json()
        assert data["phone_number"] == "1234567890"

    # 2. Login with Phone
    login_data = {
        "username": "1234567890",
        "password": "password123"
    }
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data

    # 3. Login with Email (same user)
    login_data_email = {
        "username": "phoneuser@example.com",
        "password": "password123"
    }
    response = client.post("/auth/login", data=login_data_email)
    assert response.status_code == 200

