import os
import uuid
import json
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Meeting, TranscriptChunk, ActionItem, Decision
from backend.services.whisper_service import whisper_service
from backend.services.llm_service import llm_service
from backend.services.rag_service import rag_service
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/meetings", tags=["Meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".flac", ".webm", ".aac"}

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_and_process_meeting(
    file: UploadFile = File(...),
    custom_title: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Receives meeting audio, transcribes with Whisper, extracts structured insights with Groq LLM,
    stores everything in SQLite, and indexes transcript chunks in ChromaDB.
    """
    original_filename = file.filename or "recording.mp3"
    ext = Path(original_filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Save uploaded file
    file_id = str(uuid.uuid4())[:8]
    safe_filename = f"{file_id}_{original_filename.replace(' ', '_')}"
    saved_path = Path(settings.UPLOAD_DIR_PATH) / safe_filename

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            
        with open(saved_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved uploaded audio to: {saved_path} ({len(content)} bytes)")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File save error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save audio file: {str(e)}")

    # 1. Whisper Transcription
    try:
        logger.info(f"Starting Whisper transcription for {saved_path}...")
        transcription_result = whisper_service.transcribe_audio(str(saved_path))
        transcript_text = transcription_result.get("text", "").strip()
        duration_seconds = float(transcription_result.get("duration", 0.0))
        segments = transcription_result.get("segments", [])
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {str(e)}")

    # 2. LLM Structured Analysis
    try:
        logger.info("Running LLM structured analysis...")
        llm_insights = llm_service.analyze_transcript(transcript_text, original_filename)
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        llm_insights = {
            "title": custom_title or original_filename.rsplit(".", 1)[0].replace("_", " ").title(),
            "summary": "Transcription finished, but structured AI analysis failed.",
            "key_topics": ["General"],
            "important_points": [],
            "sentiment": "Neutral",
            "action_items": [],
            "decisions": []
        }

    meeting_title = custom_title if custom_title and custom_title.strip() else llm_insights.get("title") or original_filename

    # 3. Store in SQLite Database
    try:
        meeting = Meeting(
            title=meeting_title,
            filename=original_filename,
            file_path=f"uploads/{safe_filename}",
            duration_seconds=duration_seconds,
            status="Completed",
            sentiment=llm_insights.get("sentiment", "Positive"),
            summary=llm_insights.get("summary", ""),
            key_topics_json=json.dumps(llm_insights.get("key_topics", [])),
            important_points_json=json.dumps(llm_insights.get("important_points", []))
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # Store transcript chunks
        for seg in segments:
            chunk = TranscriptChunk(
                meeting_id=meeting.id,
                chunk_index=seg.get("chunk_index", 0),
                start_time=seg.get("start", 0.0),
                end_time=seg.get("end", 0.0),
                speaker=seg.get("speaker", "Speaker"),
                text=seg.get("text", "")
            )
            db.add(chunk)

        # Store action items
        for item in llm_insights.get("action_items", []):
            action = ActionItem(
                meeting_id=meeting.id,
                task=item.get("task", ""),
                assignee=item.get("assignee", "Team"),
                deadline=item.get("deadline", "Next Sprint"),
                status=item.get("status", "Pending")
            )
            db.add(action)

        # Store decisions
        for dec in llm_insights.get("decisions", []):
            decision = Decision(
                meeting_id=meeting.id,
                decision_text=dec.get("decision_text", ""),
                category=dec.get("category", "General")
            )
            db.add(decision)

        db.commit()
        db.refresh(meeting)
        logger.info(f"Meeting #{meeting.id} '{meeting.title}' saved to database!")
    except Exception as e:
        db.rollback()
        logger.error(f"Database insertion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

    # 4. Store Embeddings in ChromaDB Vector Store
    try:
        rag_service.index_meeting(meeting.id, meeting.title, segments)
        logger.info(f"Meeting #{meeting.id} vector embeddings indexed in ChromaDB.")
    except Exception as e:
        logger.warning(f"ChromaDB indexing warning: {e}")

    return {
        "success": True,
        "message": "Meeting successfully transcribed and analyzed!",
        "meeting_id": meeting.id,
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "duration_seconds": meeting.duration_seconds,
            "status": meeting.status,
            "sentiment": meeting.sentiment,
            "created_at": meeting.created_at.isoformat() if meeting.created_at else None
        }
    }

@router.get("")
def list_meetings(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns list of meetings with summary counts."""
    query = db.query(Meeting)
    
    if search:
        query = query.filter(Meeting.title.ilike(f"%{search}%"))
    if status and status != "All":
        query = query.filter(Meeting.status == status)
        
    meetings = query.order_by(Meeting.created_at.desc()).all()
    
    result = []
    for m in meetings:
        topics = json.loads(m.key_topics_json) if m.key_topics_json else []
        action_count = len(m.action_items)
        pending_action_count = sum(1 for a in m.action_items if a.status == "Pending")
        
        result.append({
            "id": m.id,
            "title": m.title,
            "filename": m.filename,
            "file_path": m.file_path,
            "duration_seconds": m.duration_seconds,
            "status": m.status,
            "sentiment": m.sentiment,
            "summary": m.summary,
            "key_topics": topics,
            "action_items_count": action_count,
            "pending_action_items_count": pending_action_count,
            "decisions_count": len(m.decisions),
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
        
    return {"meetings": result, "total": len(result)}

@router.get("/{meeting_id}")
def get_meeting_details(meeting_id: int, db: Session = Depends(get_db)):
    """Returns full meeting details including transcripts, action items, and decisions."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    topics = json.loads(meeting.key_topics_json) if meeting.key_topics_json else []
    important_points = json.loads(meeting.important_points_json) if meeting.important_points_json else []

    transcripts = [
        {
            "id": t.id,
            "chunk_index": t.chunk_index,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "speaker": t.speaker,
            "text": t.text
        }
        for t in sorted(meeting.transcripts, key=lambda x: x.start_time)
    ]

    action_items = [
        {
            "id": a.id,
            "task": a.task,
            "assignee": a.assignee,
            "deadline": a.deadline,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in meeting.action_items
    ]

    decisions = [
        {
            "id": d.id,
            "decision_text": d.decision_text,
            "category": d.category
        }
        for d in meeting.decisions
    ]

    return {
        "id": meeting.id,
        "title": meeting.title,
        "filename": meeting.filename,
        "file_path": meeting.file_path,
        "duration_seconds": meeting.duration_seconds,
        "status": meeting.status,
        "sentiment": meeting.sentiment,
        "summary": meeting.summary,
        "key_topics": topics,
        "important_points": important_points,
        "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
        "transcripts": transcripts,
        "action_items": action_items,
        "decisions": decisions
    }

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """Deletes meeting, related rows, ChromaDB vectors, and audio file."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Delete audio file if present
    if meeting.file_path:
        local_path = Path(settings.BASE_DIR) / meeting.file_path
        if local_path.exists():
            try:
                local_path.unlink()
                logger.info(f"Deleted audio file: {local_path}")
            except Exception as e:
                logger.warning(f"Could not remove audio file: {e}")

    # Remove ChromaDB vectors
    try:
        rag_service.delete_meeting(meeting_id)
    except Exception as e:
        logger.warning(f"ChromaDB delete error: {e}")

    db.delete(meeting)
    db.commit()

    return {"success": True, "message": f"Meeting '{meeting.title}' deleted successfully."}
