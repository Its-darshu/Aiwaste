from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from fastapi.staticfiles import StaticFiles
from .api import auth, reports, tasks, admin
from .services.websocket import manager

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Waste Management System")

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Waste Management API"}
