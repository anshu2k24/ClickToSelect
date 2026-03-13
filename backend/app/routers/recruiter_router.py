from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.recruiter_model import RecruiterProfile
from app.models.user_model import User
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])


def _recruiter_response(profile: RecruiterProfile, user: User):

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "name": user.name,
        "email": user.email,
        "company_name": profile.company_name,
        "company_description": profile.company_description,
        "company_website": profile.company_website,
        "location": profile.location,
    }


@router.post("/profile")
def create_profile(
    company_name: str | None = None,
    location: str | None = None,
    company_description: str | None = None,
    company_website: str | None = None,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    if payload:
        company_name = payload.get("company_name", company_name)
        location = payload.get("location", location)
        company_description = payload.get("company_description", company_description)
        company_website = payload.get("company_website", company_website)

    if not company_name or not location:
        raise HTTPException(status_code=422, detail="company_name and location are required")

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

    db_user = db.query(User).filter(User.id == profile.user_id).first()

    return _recruiter_response(profile, db_user)


@router.get("/me")
def get_my_profile(
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user["user_id"]
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")

    db_user = db.query(User).filter(User.id == profile.user_id).first()

    return _recruiter_response(profile, db_user)


@router.put("/me")
def update_my_profile(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user["user_id"]
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")

    for field in ["company_name", "company_description", "company_website", "location"]:
        if field in payload:
            setattr(profile, field, payload[field])

    db.commit()
    db.refresh(profile)

    db_user = db.query(User).filter(User.id == profile.user_id).first()

    return _recruiter_response(profile, db_user)


@router.get("/{recruiter_id}")
def get_profile(recruiter_id: str, db: Session = Depends(get_db)):

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.id == recruiter_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")

    db_user = db.query(User).filter(User.id == profile.user_id).first()

    return _recruiter_response(profile, db_user)