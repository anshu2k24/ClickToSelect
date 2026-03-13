from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.candidate_model import CandidateProfile
from app.schemas.candidate_schema import CandidateCreate
from app.utils.jwt_dependency import get_current_user, require_roles


router = APIRouter(
    prefix="/candidate",
    tags=["Candidate"],
    dependencies=[Depends(get_current_user)]
)


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

    return candidate