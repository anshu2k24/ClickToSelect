from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class CandidateSkill(Base):

    __tablename__ = "candidate_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    skill_name = Column(String)

    github_url = Column(String)

    score = Column(Float)

    feedback = Column(String)