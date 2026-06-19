from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.routes import auth, tasks, habits, analytics, profile

app = FastAPI(
    title="Smart Task Manager API",
    description="A production-level task management and habit tracking API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(habits.router, prefix="/api/habits", tags=["Habits"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])

@app.get("/")
async def root():
    return {"message": "Smart Task Manager API is running!", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
