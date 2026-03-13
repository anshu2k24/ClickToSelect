from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.question_model import Question
from app.models.interview_model import Interview
from app.utils.jwt_dependency import get_current_user, require_roles

router = APIRouter(
    prefix="/question",
    tags=["Questions"],
    dependencies=[Depends(get_current_user)]
)
@router.post("/add")
def add_question(
    interview_id: str,
    question_text: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    question = Question(
        interview_id=interview_id,
        question_text=question_text
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question
@router.get("/list/{interview_id}")
def get_questions(interview_id: str, db: Session = Depends(get_db)):

    questions = db.query(Question).filter(
        Question.interview_id == interview_id
    ).all()

    return questions