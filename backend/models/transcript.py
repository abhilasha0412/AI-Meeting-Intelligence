from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    chunk_index = Column(Integer, default=0)
    start_time = Column(Float, default=0.0) # In seconds
    end_time = Column(Float, default=0.0)   # In seconds
    speaker = Column(String(100), default="Speaker")
    text = Column(Text, nullable=False)

    # Relationships
    meeting = relationship("Meeting", back_populates="transcripts")
