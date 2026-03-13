from sqlalchemy import Column, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class Question(Base):

    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"))

    question_text = Column(Text)