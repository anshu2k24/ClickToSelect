from pydantic import BaseModel


class JobCreate(BaseModel):

    recruiter_id: str

    title: str

    role: str

    description: str

    experience_required: int

    location: str