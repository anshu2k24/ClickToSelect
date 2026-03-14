from sqlalchemy import Column, ForeignKey, String, Integer, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


# class Interview(Base):

#     __tablename__ = "interviews"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

#     job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))

#     interview_type = Column(String)   # parallel / individual

#     interview_date = Column(DateTime)

#     duration = Column(Integer)

class Interview(Base):

    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))

    interview_type = Column(String)   # parallel / individual

    interview_date = Column(DateTime)

    duration = Column(Integer)

    status = Column(String, default="created")

    llm_sessions = Column(ARRAY(String), default=list)