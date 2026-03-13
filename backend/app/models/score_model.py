from sqlalchemy import Column, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class Score(Base):

    __tablename__ = "scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"))

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    ai_score = Column(Float)

    hr_score = Column(Float)

    final_score = Column(Float)