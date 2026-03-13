from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.shortlist_model import Shortlist
from app.models.job_model import Job
from app.models.candidate_model import CandidateProfile
from app.utils.jwt_dependency import get_current_user, require_roles


router = APIRouter(
    prefix="/shortlist",
    tags=["Shortlist"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/add")
def shortlist_candidate(
    job_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.query(Shortlist).filter(
        Shortlist.job_id == job_id,
        Shortlist.candidate_id == candidate_id
    ).first()

    if existing:
        return existing

    data = Shortlist(

        job_id=job_id,

        candidate_id=candidate_id

    )

    db.add(data)

    db.commit()

    db.refresh(data)

    return data


@router.get("/job/{job_id}")
def list_shortlisted_candidates(
    job_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    shortlist = db.query(Shortlist).filter(
        Shortlist.job_id == job_id
    ).all()

    return shortlist