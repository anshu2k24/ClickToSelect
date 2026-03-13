from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class Shortlist(Base):

    __tablename__ = "shortlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"))

    status = Column(String, default="pending")