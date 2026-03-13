from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.answer_model import Answer
from app.models.question_model import Question
from app.models.candidate_model import CandidateProfile
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(
    prefix="/answer",
    tags=["Answers"],
    dependencies=[Depends(get_current_user)]
)
@router.post("/submit")
def submit_answer(
    question_id: str,
    candidate_id: str,
    answer_text: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("candidate"))
):

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    candidate = db.query(CandidateProfile).filter(
        CandidateProfile.id == candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    answer = Answer(
        question_id=question_id,
        candidate_id=candidate_id,
        answer_text=answer_text
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return answer