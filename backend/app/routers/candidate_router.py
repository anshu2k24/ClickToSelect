from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.candidate_model import CandidateProfile
from app.models.user_model import User
from app.schemas.candidate_schema import CandidateCreate
from app.utils.jwt_dependency import get_current_user, require_roles


router = APIRouter(
    prefix="/candidate",
    tags=["Candidate"],
    dependencies=[Depends(get_current_user)]
)


def _candidate_response(candidate: CandidateProfile, user: User):

    return {
        "id": str(candidate.id),
        "user_id": str(candidate.user_id),
        "name": user.name,
        "email": user.email,
        "mobile_no": candidate.mobile_no,
        "dob": candidate.dob.isoformat() if candidate.dob else None,
        "experience_years": candidate.experience_years,
        "organisation": candidate.organisation,
        "location": candidate.location,
        "github_link": candidate.github_link,
        "linkedin_link": candidate.linkedin_link,
        "resume_url": candidate.resume_url,
        "interested_in_internship": candidate.interested_in_internship,
    }


@router.post("/profile")
def create_profile(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate"))
):

    existing = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user["user_id"]
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Candidate profile already exists")

    candidate = CandidateProfile(
        user_id=user["user_id"],
        **data.dict()
    )

    db.add(candidate)

    db.commit()

    db.refresh(candidate)

    db_user = db.query(User).filter(User.id == candidate.user_id).first()

    return _candidate_response(candidate, db_user)


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate"))
):

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user["user_id"]
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    db_user = db.query(User).filter(User.id == candidate.user_id).first()

    return _candidate_response(candidate, db_user)


@router.put("/me")
def update_my_profile(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate"))
):

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user["user_id"]
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    for field, value in data.dict().items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)

    db_user = db.query(User).filter(User.id == candidate.user_id).first()

    return _candidate_response(candidate, db_user)


@router.get("/list")
def list_candidates(
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    candidates = db.query(CandidateProfile, User).join(
        User,
        CandidateProfile.user_id == User.id
    ).all()

    return [
        _candidate_response(candidate, user)
        for candidate, user in candidates
    ]