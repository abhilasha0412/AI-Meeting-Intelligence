from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)
    duration_seconds = Column(Float, default=0.0)
    status = Column(String(50), default="Completed") # "Processing", "Completed", "Failed"
    sentiment = Column(String(50), default="Neutral") # "Positive", "Neutral", "Negative", "Constructive"
    
    summary = Column(Text, nullable=True)
    key_topics_json = Column(Text, nullable=True) # JSON string list
    important_points_json = Column(Text, nullable=True) # JSON string list
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transcripts = relationship("TranscriptChunk", back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
