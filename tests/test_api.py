from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai import ai_service
from unittest.mock import MagicMock
import pytest

client = TestClient(app)

# Mock AI Service to avoid loading model during tests
ai_service.detect_garbage = MagicMock(return_value=True)
ai_service.verify_cleanup = MagicMock(return_value=True)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Smart Waste Management API"}

def test_auth_flow():
    # 1. Login with Google (Mock token)
    # We need to mock the verify_id_token or the jwt decode in auth.py
    # But since we implemented a "skip verification" for demo, we can just send a dummy token
    # that decodes to something valid if we use a library to sign it, OR
    # we can rely on the fact that our auth.py just decodes without verify.
    
    # Let's create a dummy JWT
    from jose import jwt
    token = jwt.encode({"email": "test@example.com", "sub": "test-uid", "name": "Test User"}, "secret", algorithm="HS256")
    
    response = client.post("/auth/google", json={"token": token, "role": "user"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    
    # 2. Get Current User
    # We need to pass the SAME token as Bearer
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_report_flow():
    # Login first
    from jose import jwt
    token = jwt.encode({"email": "reporter@example.com", "sub": "reporter-uid", "name": "Reporter"}, "secret", algorithm="HS256")
    client.post("/auth/google", json={"token": token, "role": "user"})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Report
    # We need to upload a file
    with open("ai_service/dataset/clean/clean_0.jpg", "rb") as f: # Use a real file from dataset
        # Wait, we might not know the exact name. Let's create a dummy file.
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

