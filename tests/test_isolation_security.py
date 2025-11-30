from fastapi.testclient import TestClient
from backend.main import app
from backend.services.ai import ai_service
from unittest.mock import MagicMock
import os
import pytest

client = TestClient(app)

# Mock AI Service
ai_service.detect_garbage = MagicMock(return_value=True)
ai_service.detect_garbage_bytes = MagicMock(return_value=True)

# Helper to create user and get token
def get_auth_token(email, password, role="user"):
    # Signup
    client.post("/auth/signup", json={
        "email": email,
        "password": password,
        "full_name": f"Test {role}",
        "role": role
    })
    # Login
    response = client.post("/auth/login", data={
        "username": email,
        "password": password
    })
    return response.json().get("access_token")

def test_isolation_and_security():
    # 1. Setup Users
    token_user_a = get_auth_token("usera@test.com", "pass", "user")
    token_user_b = get_auth_token("userb@test.com", "pass", "user")
    token_admin = get_auth_token("admin@test.com", "pass", "admin")
    token_worker = get_auth_token("worker@test.com", "pass", "worker")

    headers_a = {"Authorization": f"Bearer {token_user_a}"}
    headers_b = {"Authorization": f"Bearer {token_user_b}"}
    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    headers_worker = {"Authorization": f"Bearer {token_worker}"}

    # 2. User A creates a report
    with open("test_image.jpg", "wb") as f:
        f.write(b"fake image content")
    
    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/reports/",
            headers=headers_a,
            data={
                "description": "User A Report",
                "latitude": 10.0,
                "longitude": 20.0
            },
            files={"file": ("test_image.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    report_a = response.json()
    
    # Verify unique filename (UUID)
    # The image_url should not end with "test_image.jpg" directly, but have a UUID prefix or be a UUID
    assert "test_image.jpg" not in os.path.basename(report_a["image_url"])
    assert "uploads/" in report_a["image_url"]

    # 3. User B tries to list reports
    # /reports/my should return empty for B
    response = client.get("/reports/my", headers=headers_b)
    assert response.status_code == 200
    assert len(response.json()) == 0

    # /reports/ (Admin endpoint) should be forbidden for B
    response = client.get("/reports/", headers=headers_b)
    assert response.status_code == 403

    # 4. Admin checks reports
    response = client.get("/reports/", headers=headers_admin)
    assert response.status_code == 200
    all_reports = response.json()
    assert any(r["id"] == report_a["id"] for r in all_reports)

    # 5. Worker checks available tasks
    response = client.get("/tasks/available", headers=headers_worker)
    assert response.status_code == 200
    tasks = response.json()
    assert any(r["id"] == report_a["id"] for r in tasks)

    # Cleanup
    if os.path.exists("test_image.jpg"):
        os.remove("test_image.jpg")

if __name__ == "__main__":
    test_isolation_and_security()
