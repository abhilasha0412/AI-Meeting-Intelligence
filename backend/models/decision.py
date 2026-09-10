from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    decision_text = Column(Text, nullable=False)
    category = Column(String(100), default="General") # e.g. "Architecture", "Timeline", "Resource", "Product"

    # Relationships
    meeting = relationship("Meeting", back_populates="decisions")
