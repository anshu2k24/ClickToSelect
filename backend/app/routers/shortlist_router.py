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

    data = Shortlist(

        job_id=job_id,

        candidate_id=candidate_id

    )

    db.add(data)

    db.commit()

    db.refresh(data)

    return data