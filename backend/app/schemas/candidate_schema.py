from pydantic import BaseModel
from datetime import date
from typing import Optional

class CandidateCreate(BaseModel):

    mobile_no: str
    dob: date
    experience_years: int
    organisation: str
    location: str

    github_link: str
    linkedin_link: str
    resume_url: Optional[str] = None
    interested_in_internship: bool = False