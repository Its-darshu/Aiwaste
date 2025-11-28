from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from fastapi.staticfiles import StaticFiles
from .api import auth, reports, tasks, admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Waste Management System")

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS Configuration
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:80",
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Waste Management API"}
