# Aiwaste Copilot Instructions

## Project Overview
Aiwaste is a waste management application that uses AI to classify waste as "Clean" or "Garbage". It consists of a React frontend, a FastAPI backend, and a TensorFlow-based AI service.

## Architecture & Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS. Served via Nginx proxy.
- **Backend**: FastAPI, SQLAlchemy, SQLite. Handles API requests and orchestrates AI inference.
- **AI Service**: TensorFlow/Keras (MobileNetV2). Located in `ai_service/` but mounted and imported directly by the backend.
- **Infrastructure**: Docker Compose, Nginx (Reverse Proxy).

## Key Workflows

### 1. Running the Application
- **Command**: `docker-compose up --build`
- **Access**:
  - Web App: `http://localhost` (proxied to frontend:5173)
  - API Docs: `http://localhost/api/docs` (proxied to backend:8000/docs)

### 2. AI Service Integration
- The `ai_service` directory is a Python package.
- **Pattern**: The backend imports `ai_service` modules directly (e.g., `from ai_service.inference import predict`).
- **Model**: The model is a binary classifier (Clean vs Garbage) saved as `ai_service/models/waste_model.h5`.
- **Training**: Scripts in `ai_service/train.py` handle model training.

### 3. Database
- **Type**: SQLite (`waste.db` in root).
- **ORM**: SQLAlchemy.
- **Migrations**: Managed via SQLAlchemy models in `backend/models/`.

## Project Structure
- `frontend/`: React application.
- `backend/`: FastAPI application.
  - `main.py`: Entry point.
  - `api/`: Route handlers.
- `ai_service/`: ML logic (training, inference, model definition).
- `nginx/`: Nginx configuration for routing traffic.

## Development Guidelines
- **Frontend**: Use functional components and Hooks. Style with Tailwind CSS classes.
- **Backend**: Follow FastAPI patterns. Use Pydantic schemas for validation (`backend/schemas.py`).
- **AI**: Ensure `ai_service` remains independent of backend logic where possible, to allow standalone training/testing.
- **Git**: `ai_service/dataset/` and `uploads/` are ignored. Do not commit large files or secrets.

## Common Tasks
- **Add a new API endpoint**:
  1. Define schema in `backend/schemas.py`.
  2. Create route in `backend/api/`.
  3. Register router in `backend/main.py`.
- **Update AI Model**:
  1. Train using `ai_service/train.py`.
  2. Save new model to `ai_service/models/`.
  3. Restart backend container to reload model.
