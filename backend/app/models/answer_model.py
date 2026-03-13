from sqlalchemy import Column, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class Answer(Base):

    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"))

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    answer_text = Column(Text)