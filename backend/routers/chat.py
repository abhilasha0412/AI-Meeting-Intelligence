import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.rag_service import rag_service
from backend.models import Meeting

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["AI Chatbot"])

class ChatRequest(BaseModel):
    message: str
    meeting_id: Optional[int] = None

class SourceCitation(BaseModel):
    meeting_id: int
    meeting_title: str
    timestamp_formatted: str
    start_time: float
    end_time: float
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    has_sources: bool

@router.post("", response_model=ChatResponse)
def query_ai_assistant(request: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG Chat endpoint:
    1. Embeds question using Sentence Transformers.
    2. Searches ChromaDB for relevant meeting transcript chunks.
    3. Feeds grounded context to Groq AI / Gemini.
    4. Returns intelligent answer + source citations.
    """
    question = request.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    meeting_count = db.query(Meeting).count()
    if meeting_count == 0:
        return ChatResponse(
            answer="You don't have any meeting recordings in your database yet. Upload a meeting audio file or load demo data to start chatting with AI Meeting Intelligence!",
            sources=[],
            has_sources=False
        )

    logger.info(f"Processing RAG chat query: '{question}' (meeting_id={request.meeting_id})")
    rag_result = rag_service.query(question=question, meeting_id=request.meeting_id)

    # Augment source metadata with actual meeting duration if available
    sources_output = []
    for s in rag_result.get("sources", []):
        m_id = s.get("meeting_id")
        meeting = db.query(Meeting).filter(Meeting.id == m_id).first() if m_id else None
        
        sources_output.append(SourceCitation(
            meeting_id=s.get("meeting_id", 0),
            meeting_title=s.get("meeting_title", "Meeting"),
            timestamp_formatted=s.get("timestamp_formatted", "00:00"),
            start_time=s.get("start_time", 0.0),
            end_time=s.get("end_time", 0.0),
            snippet=s.get("snippet", "")
        ))

    return ChatResponse(
        answer=rag_result.get("answer", "I couldn't find this information in your meeting records."),
        sources=sources_output,
        has_sources=len(sources_output) > 0
    )
