from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.db import get_db
from app.models.score_model import Score

router = APIRouter(prefix="/report", tags=["Reports"])
@router.get("/{candidate_id}")
def get_report(candidate_id: str, db: Session = Depends(get_db)):

    result = db.query(
        func.avg(Score.final_score)
    ).filter(
        Score.candidate_id == candidate_id
    ).scalar()

    return {
        "candidate_id": candidate_id,
        "final_score": result
    }