from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.candidate_skill_model import CandidateSkill
from app.models.candidate_model import CandidateProfile
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(
    prefix="/skill",
    tags=["Skills"],
    dependencies=[Depends(get_current_user)]
)
@router.post("/add")
def add_skill(
    candidate_id: str,
    skill_name: str,
    github_url: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("candidate"))
):

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == candidate_id
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    skill = CandidateSkill(
        candidate_id=candidate_id,
        skill_name=skill_name,
        github_url=github_url,
        score=0,
        feedback=""
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill
@router.get("/{candidate_id}")
def get_skills(candidate_id: str, db: Session = Depends(get_db)):

    skills = db.query(CandidateSkill).filter(
        CandidateSkill.candidate_id == candidate_id
    ).all()

    return skills
@router.delete("/{skill_id}")
def delete_skill(skill_id: str, db: Session = Depends(get_db)):

    skill = db.query(CandidateSkill).filter(
        CandidateSkill.id == skill_id
    ).first()

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    db.delete(skill)
    db.commit()

    return {"message": "skill deleted"}


@router.put("/{skill_id}/verify")
def verify_skill(
    skill_id: str,
    score: float,
    feedback: str = "",
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate"))
):

    skill = db.query(CandidateSkill).filter(
        CandidateSkill.id == skill_id
    ).first()

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == skill.candidate_id
    ).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if str(candidate.user_id) != user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot verify another candidate's skill")

    skill.score = score
    skill.feedback = feedback

    db.commit()
    db.refresh(skill)

    return skill