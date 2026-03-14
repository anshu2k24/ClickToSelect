from sqlalchemy import Column, ForeignKey, String, Integer, ARRAY
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


# class InterviewCandidate(Base):

#     __tablename__ = "interview_candidates"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

#     interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"))

#     candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

#     status = Column(String, default="pending")

class InterviewCandidate(Base):

    __tablename__ = "interview_candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"))

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    session_index = Column(Integer)

    scores = Column(ARRAY(Integer), default=list)

    status = Column(String, default="pending")