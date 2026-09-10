import os
from pathlib import Path
from pydantic_settings import BaseSettings

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
CHROMA_DIR = BASE_DIR / "chroma_db"

# Explicitly load .env file from root
load_dotenv(BASE_DIR / ".env")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "AI Meeting Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/meeting_intelligence.db"
    
    # LLM Settings (Groq AI primary)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    
    # Optional Gemini Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Whisper Settings
    WHISPER_MODEL: str = "base" # tiny, base, small, medium, large
    USE_GROQ_WHISPER: bool = True # Use ultra-fast Groq whisper when key is present
    
    # Chroma & Embeddings
    CHROMA_PERSIST_DIR: str = str(CHROMA_DIR)
    UPLOAD_DIR_PATH: str = str(UPLOAD_DIR)
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
