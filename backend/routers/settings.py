import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.config import settings
from backend.utils.demo_seeder import seed_demo_data

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    whisper_model: Optional[str] = None
    use_groq_whisper: Optional[bool] = None

@router.get("")
def get_current_settings():
    """Returns current runtime configurations (with masked API keys)."""
    def mask_key(key: str) -> str:
        if not key:
            return ""
        if len(key) <= 8:
            return "••••••••"
        return f"{key[:6]}••••••••{key[-4:]}"

    return {
        "groq_api_key_configured": bool(settings.GROQ_API_KEY),
        "groq_api_key_masked": mask_key(settings.GROQ_API_KEY),
        "groq_model": settings.GROQ_MODEL,
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY),
        "gemini_api_key_masked": mask_key(settings.GEMINI_API_KEY),
        "whisper_model": settings.WHISPER_MODEL,
        "use_groq_whisper": settings.USE_GROQ_WHISPER,
        "database_url": settings.DATABASE_URL,
        "chroma_dir": settings.CHROMA_PERSIST_DIR
    }

@router.post("")
def update_settings(payload: SettingsUpdate):
    """Updates runtime settings and writes to .env if applicable."""
    if payload.groq_api_key is not None:
        settings.GROQ_API_KEY = payload.groq_api_key.strip()
    if payload.groq_model is not None:
        settings.GROQ_MODEL = payload.groq_model.strip()
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
    if payload.whisper_model is not None:
        settings.WHISPER_MODEL = payload.whisper_model.strip()
    if payload.use_groq_whisper is not None:
        settings.USE_GROQ_WHISPER = payload.use_groq_whisper

    return {
        "success": True,
        "message": "Settings updated successfully!",
        "settings": {
            "groq_api_key_configured": bool(settings.GROQ_API_KEY),
            "groq_model": settings.GROQ_MODEL,
            "whisper_model": settings.WHISPER_MODEL,
            "use_groq_whisper": settings.USE_GROQ_WHISPER
        }
    }

@router.post("/test-key")
def test_groq_key(api_key: Optional[str] = Body(None, embed=True)):
    """Tests live connectivity with Groq AI API."""
    key_to_test = api_key.strip() if api_key and api_key.strip() else settings.GROQ_API_KEY
    if not key_to_test:
        raise HTTPException(status_code=400, detail="No Groq API key provided to test.")

    try:
        import openai
        client = openai.OpenAI(
            api_key=key_to_test,
            base_url=settings.GROQ_BASE_URL
        )
        models_resp = client.models.list()
        available_models = [m.id for m in models_resp.data if "qwen" in m.id or "gpt" in m.id or "whisper" in m.id or "llama" in m.id]
        
        return {
            "success": True,
            "message": "Groq AI connection verified successfully! High-speed inference is active.",
            "models_count": len(models_resp.data),
            "recommended_models": available_models[:5]
        }
    except Exception as e:
        logger.error(f"API key test failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Groq API connection test failed: {str(e)}"
        )

@router.post("/seed-demo")
def trigger_demo_seed(force: bool = False, db: Session = Depends(get_db)):
    """Seeds sample meetings and ChromaDB vector collections."""
    count = seed_demo_data(db, force=force)
    return {
        "success": True,
        "message": f"Demo data ready with {count} realistic meeting records and vector embeddings.",
        "seeded_count": count
    }
