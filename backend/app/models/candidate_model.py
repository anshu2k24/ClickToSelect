from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database.db import Base


class CandidateProfile(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    mobile_no = Column(String)
    dob = Column(Date)

    experience_years = Column(Integer)

    organisation = Column(String)

    location = Column(String)

    github_link = Column(String)
    linkedin_link = Column(String)

    resume_url = Column(String)

    interested_in_internship = Column(Boolean, default=False)