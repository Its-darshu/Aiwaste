from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .database import engine, Base
from fastapi.staticfiles import StaticFiles
from .api import auth, reports, tasks, admin
from .services.websocket import manager
import os
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Migration: Add complaint_id column if not exists
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE reports ADD COLUMN complaint_id VARCHAR"))
        conn.execute(text("CREATE UNIQUE INDEX ix_reports_complaint_id ON reports (complaint_id)"))
        print("Migrated: Added complaint_id column")
except Exception as e:
    # Column likely exists
    pass

app = FastAPI(title="Smart Waste Management System")

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount frontend static files if they exist (Production mode)
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# CORS Configuration
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Authentication"])
app.include_router(reports.router, tags=["Reports"])
app.include_router(tasks.router, tags=["Tasks"])
app.include_router(admin.router, tags=["Admin"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await manager.broadcast("STATS_UPDATE")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("STATS_UPDATE")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Serve specific files from dist root (like favicon.ico)
    if full_path and os.path.exists(f"frontend/dist/{full_path}"):
        return FileResponse(f"frontend/dist/{full_path}")
    
    # Serve index.html for all other routes (SPA)
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    
    return {"message": "Frontend not built. Run 'npm run build' in frontend directory."}
