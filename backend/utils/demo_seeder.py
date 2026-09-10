import json
import logging
from sqlalchemy.orm import Session
from backend.models import Meeting, TranscriptChunk, ActionItem, Decision
from backend.services.rag_service import rag_service

logger = logging.getLogger(__name__)

DEMO_MEETINGS = [
    {
        "title": "Q3 Product Strategy & AI Integration Sync",
        "filename": "q3_strategy_sync.mp3",
        "duration_seconds": 2520.0, # 42 minutes
        "status": "Completed",
        "sentiment": "Positive",
        "summary": "The leadership and engineering teams aligned on the Q3 roadmap focusing on AI-assisted meeting intelligence, real-time audio transcription, and enterprise vector search. Key discussion centered around migrating our inference workloads to Groq's high-throughput architecture for sub-second responses. The team agreed to complete the frontend dashboard by Friday and schedule security penetration testing before next month's beta rollout.",
        "key_topics": ["Groq AI Integration", "RAG Vector Architecture", "Frontend Dashboard Polish", "Security & SOC2 Compliance"],
        "important_points": [
            "Whisper and Groq API pipelines achieved 5x faster audio-to-insight throughput in benchmarking tests.",
            "Alex reported frontend UI is 85% finished with dark/light mode and interactive Recharts charts.",
            "Elena confirmed ChromaDB vector collections are configured for semantic meeting recall.",
            "Security compliance audit review scheduled for the 15th of next month."
        ],
        "transcripts": [
            {
                "chunk_index": 0,
                "start": 0.0,
                "end": 24.5,
                "speaker": "Sarah (Product Lead)",
                "text": "Good morning everyone. Welcome to our Q3 strategy sync. Today we need to lock in our deliverables for the AI Meeting Intelligence platform, specifically our transcription speed and RAG search accuracy."
            },
            {
                "chunk_index": 1,
                "start": 25.0,
                "end": 58.2,
                "speaker": "John (Backend Lead)",
                "text": "Thanks Sarah. On the backend, we integrated Groq's API and Whisper. Audio processing that used to take three minutes now completes in under ten seconds. The structured JSON extractor is yielding 99% schema accuracy."
            },
            {
                "chunk_index": 2,
                "start": 59.0,
                "end": 92.4,
                "speaker": "Alex (Frontend Engineer)",
                "text": "From the frontend perspective, the dashboard, audio waveform player, and AI assistant chat interface are roughly 85% complete. We'll wrap up the remaining responsiveness and animation touches by this Friday."
            },
            {
                "chunk_index": 3,
                "start": 93.0,
                "end": 135.0,
                "speaker": "Elena (AI / Data Lead)",
                "text": "Regarding RAG and search, ChromaDB vector indexing is running smoothly. We store each chunk with timestamp metadata so users can jump directly to the exact spoken moment in the audio recording."
            },
            {
                "chunk_index": 4,
                "start": 136.0,
                "end": 180.0,
                "speaker": "Sarah (Product Lead)",
                "text": "That is fantastic progress. Let's make sure we test the full end-to-end pipeline with large audio files, and let's finalize our action items before wrapping up."
            }
        ],
        "action_items": [
            {
                "task": "Complete frontend responsiveness, animations, and toast alerts",
                "assignee": "Alex Rivera",
                "deadline": "This Friday",
                "status": "Pending"
            },
            {
                "task": "Benchmark Whisper audio transcription on 60-minute meeting recordings",
                "assignee": "John Doe",
                "deadline": "Next Tuesday",
                "status": "Completed"
            },
            {
                "task": "Configure ChromaDB persistent storage and citation deep-linking",
                "assignee": "Elena Rostova",
                "deadline": "Oct 12",
                "status": "Completed"
            },
            {
                "task": "Prepare SOC2 compliance checklist and security audit documentation",
                "assignee": "Sarah Connor",
                "deadline": "Oct 15",
                "status": "Pending"
            }
        ],
        "decisions": [
            {
                "decision_text": "Adopt Groq AI and Whisper as primary inference engines for ultra-fast meeting analysis.",
                "category": "Architecture"
            },
            {
                "decision_text": "Use ChromaDB vector embeddings with chunk-level timestamp citation for all RAG queries.",
                "category": "Product"
            },
            {
                "decision_text": "Launch beta testing cohort immediately after the Friday frontend release.",
                "category": "Timeline"
            }
        ]
    },
    {
        "title": "Engineering Architecture & Security Review",
        "filename": "architecture_review.mp3",
        "duration_seconds": 1800.0, # 30 minutes
        "status": "Completed",
        "sentiment": "Constructive",
        "summary": "Technical review examining data isolation, database index performance on SQLite, and vector indexing throughput. The team established automated data cleaning for temporary audio files and ratified strict privacy policies ensuring no customer recordings are cached without consent.",
        "key_topics": ["Database Indexing", "Data Privacy & Encryption", "Audio File Lifecycle", "API Rate Limiting"],
        "important_points": [
            "Agreed on automatic cleanup for temporary uploaded audio files after vector embedding.",
            "Added database foreign key cascade rules for meetings and transcript chunks.",
            "Established rate limiters on the FastAPI upload endpoint."
        ],
        "transcripts": [
            {
                "chunk_index": 0,
                "start": 0.0,
                "end": 35.0,
                "speaker": "Marcus (Security Architect)",
                "text": "Let's review our audio data lifecycle. When a user uploads a recording, we transcribe it and embed the vectors. We must ensure audio files in temporary directories are managed securely."
            },
            {
                "chunk_index": 1,
                "start": 36.0,
                "end": 78.0,
                "speaker": "John (Backend Lead)",
                "text": "We store uploaded audio in the uploads directory with UUID-based names. Database records link directly to the file path, and we have a cleanup handler when a meeting is deleted."
            },
            {
                "chunk_index": 2,
                "start": 79.0,
                "end": 120.0,
                "speaker": "Marcus (Security Architect)",
                "text": "Great. Make sure we also have encryption at rest for SQLite and sanitize all user query inputs before passing to vector search."
            }
        ],
        "action_items": [
            {
                "task": "Implement file deletion hook when meeting is removed from UI",
                "assignee": "John Doe",
                "deadline": "Thursday",
                "status": "Completed"
            },
            {
                "task": "Audit SQLite foreign key constraints and query execution plans",
                "assignee": "Marcus Vance",
                "deadline": "Next Week",
                "status": "Pending"
            }
        ],
        "decisions": [
            {
                "decision_text": "Enforce strict UUID hashing for all uploaded meeting audio files.",
                "category": "Security"
            },
            {
                "decision_text": "Cascade deletion across ChromaDB vectors and SQLite rows when a meeting is deleted.",
                "category": "Architecture"
            }
        ]
    }
]

def seed_demo_data(db: Session, force: bool = False) -> int:
    """
    Seeds sample meetings, transcripts, action items, decisions, and ChromaDB embeddings.
    """
    existing_count = db.query(Meeting).count()
    if existing_count > 0 and not force:
        logger.info(f"Database already contains {existing_count} meetings. Skipping automatic seed.")
        return existing_count

    created_count = 0
    for demo in DEMO_MEETINGS:
        meeting = Meeting(
            title=demo["title"],
            filename=demo["filename"],
            file_path=f"uploads/{demo['filename']}",
            duration_seconds=demo["duration_seconds"],
            status=demo["status"],
            sentiment=demo["sentiment"],
            summary=demo["summary"],
            key_topics_json=json.dumps(demo["key_topics"]),
            important_points_json=json.dumps(demo["important_points"])
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # Transcripts
        segments_for_rag = []
        for t in demo["transcripts"]:
            chunk = TranscriptChunk(
                meeting_id=meeting.id,
                chunk_index=t["chunk_index"],
                start_time=t["start"],
                end_time=t["end"],
                speaker=t["speaker"],
                text=t["text"]
            )
            db.add(chunk)
            segments_for_rag.append(t)

        # Action Items
        for a in demo["action_items"]:
            action = ActionItem(
                meeting_id=meeting.id,
                task=a["task"],
                assignee=a["assignee"],
                deadline=a["deadline"],
                status=a["status"]
            )
            db.add(action)

        # Decisions
        for d in demo["decisions"]:
            decision = Decision(
                meeting_id=meeting.id,
                decision_text=d["decision_text"],
                category=d["category"]
            )
            db.add(decision)

        db.commit()

        # Index in ChromaDB
        try:
            rag_service.index_meeting(meeting.id, meeting.title, segments_for_rag)
        except Exception as e:
            logger.warning(f"ChromaDB demo indexing note: {e}")

        created_count += 1

    logger.info(f"Successfully seeded {created_count} demo meetings!")
    return created_count
