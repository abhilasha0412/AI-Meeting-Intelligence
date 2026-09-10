import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.database import init_db, SessionLocal
from backend.routers import (
    meetings_router,
    action_items_router,
    chat_router,
    analytics_router,
    settings_router
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("meeting_intelligence")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SQLite database tables...")
    init_db()
    logger.info("Database initialized successfully!")
    yield
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack AI Meeting Intelligence with Whisper, Groq LLM, and ChromaDB RAG",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded audio directory
uploads_dir = settings.UPLOAD_DIR_PATH
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include API Routers
app.include_router(meetings_router)
app.include_router(action_items_router)
app.include_router(chat_router)
app.include_router(analytics_router)
app.include_router(settings_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groq_configured": bool(settings.GROQ_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
