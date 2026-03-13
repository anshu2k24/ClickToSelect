from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db
from app.models.candidate_skill_model import CandidateSkill


router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/")
def leaderboard(db: Session = Depends(get_db)):

    results = db.query(

        CandidateSkill.candidate_id,

        func.avg(CandidateSkill.score).label("avg_score")

    ).group_by(

        CandidateSkill.candidate_id

    ).order_by(

        func.avg(CandidateSkill.score).desc()

    ).all()

    return [
        {
            "candidate_id": str(row.candidate_id),
            "avg_score": float(row.avg_score) if row.avg_score is not None else 0.0
        }
        for row in results
    ]