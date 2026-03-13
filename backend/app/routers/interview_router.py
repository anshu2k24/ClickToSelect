from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.interview_model import Interview
from app.models.interview_candidate_model import InterviewCandidate
from app.models.job_model import Job
from app.models.candidate_model import CandidateProfile
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
    dependencies=[Depends(get_current_user)]
)
@router.post("/create")
def create_interview(
    job_id: str,
    interview_type: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    interview = Interview(
        job_id=job_id,
        interview_type=interview_type
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return interview
@router.post("/add-candidate")
def add_candidate(
    interview_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    data = InterviewCandidate(
        interview_id=interview_id,
        candidate_id=candidate_id
    )

    db.add(data)
    db.commit()
    db.refresh(data)

    return data
@router.get("/candidates/{interview_id}")
def get_candidates(interview_id: str, db: Session = Depends(get_db)):

    candidates = db.query(InterviewCandidate).filter(
        InterviewCandidate.interview_id == interview_id
    ).all()

    return candidates
@router.post("/start")
def start_interview(
    interview_id: str,
    _=Depends(require_roles("recruiter"))
):

    return {
        "interview_id": interview_id,
        "status": "started"
    }
@router.post("/end")
def end_interview(
    interview_id: str,
    _=Depends(require_roles("recruiter"))
):

    return {
        "interview_id": interview_id,
        "status": "completed"
    }