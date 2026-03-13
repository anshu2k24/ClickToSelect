from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.score_model import Score
from app.models.question_model import Question
from app.models.candidate_model import CandidateProfile
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(
    prefix="/score",
    tags=["Scores"],
    dependencies=[Depends(get_current_user)]
)
@router.post("/ai")
def ai_score(
    question_id: str,
    candidate_id: str,
    ai_score: float,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    score = Score(
        question_id=question_id,
        candidate_id=candidate_id,
        ai_score=ai_score,
        hr_score=0,
        final_score=ai_score
    )

    db.add(score)
    db.commit()
    db.refresh(score)

    return score
@router.post("/hr")
def hr_score(
    question_id: str,
    candidate_id: str,
    hr_score: float,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    score = db.query(Score).filter(
        Score.question_id == question_id,
        Score.candidate_id == candidate_id
    ).first()

    if not score:
        raise HTTPException(status_code=404, detail="Score record not found")

    score.hr_score = hr_score

    score.final_score = (score.ai_score + hr_score) / 2

    db.commit()

    return score