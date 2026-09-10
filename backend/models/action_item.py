from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    task = Column(String(512), nullable=False)
    assignee = Column(String(100), default="Unassigned")
    deadline = Column(String(100), default="Next Sprint")
    status = Column(String(50), default="Pending") # "Pending", "Completed"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="action_items")
