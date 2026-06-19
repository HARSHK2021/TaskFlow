from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.routes import auth, tasks, habits, analytics, profile


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="Smart Task Manager API",
    description="A production-level task management and habit tracking API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(habits.router, prefix="/habits", tags=["Habits"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])

@app.get("/")
async def root():
    return {"message": "Smart Task Manager API is running!", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
