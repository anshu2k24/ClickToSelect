from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.recruiter_model import RecruiterProfile
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])
@router.post("/profile")
def create_profile(
    company_name: str,
    location: str,
    company_description: str | None = None,
    company_website: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    existing = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user["user_id"]
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Recruiter profile already exists")

    profile = RecruiterProfile(
        user_id=user["user_id"],
        company_name=company_name,
        company_description=company_description,
        company_website=company_website,
        location=location
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile
@router.get("/{recruiter_id}")
def get_profile(recruiter_id: str, db: Session = Depends(get_db)):

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.id == recruiter_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")

    return profile