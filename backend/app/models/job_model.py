from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class Job(Base):

    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("recruiters.id"))

    title = Column(String)

    role = Column(String)

    description = Column(String)

    experience_required = Column(Integer)

    location = Column(String)