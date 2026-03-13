from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.database.db import Base


class CheatLog(Base):

    __tablename__ = "cheat_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"))

    event_type = Column(String)

    confidence = Column(Float)

    timestamp = Column(DateTime, default=datetime.utcnow)