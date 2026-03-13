from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import requests
import statistics
import os
from app.database.db import get_db
from app.models.candidate_skill_model import CandidateSkill
from app.utils.jwt_dependency import get_current_user

router = APIRouter(
    prefix="/skill-brain",
    tags=["SkillBrain"],
    dependencies=[Depends(get_current_user)]
)


def _get_llm_base_url() -> str:
    raw = os.getenv("LLM_BASE_URL", "")
    cleaned = raw.strip().strip('"').strip("'")
    if not cleaned:
        raise HTTPException(
            status_code=503,
            detail="LLM service is not configured. Set LLM_BASE_URL in backend .env",
        )
    if not cleaned.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=503,
            detail="LLM_BASE_URL must start with http:// or https://",
        )
    return cleaned.rstrip("/")


def _get_timeout_seconds() -> int:
    raw = os.getenv("MAX_INTERVIEW_TIMEOUT", "300")
    try:
        value = int(str(raw).strip().strip('"').strip("'"))
        return value if value > 0 else 300
    except (TypeError, ValueError):
        return 300

@router.post("/start")
def start_interview(
    skill_id: str,
    db: Session = Depends(get_db)
):
    llm_base_url = _get_llm_base_url()

    skill = db.query(CandidateSkill).filter(
        CandidateSkill.id == skill_id
    ).first()

    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    if skill.llm_session_id:
        raise HTTPException(
            status_code=400,
            detail="Interview already running"
        )

    # INIT LLM SESSION
    try:
        init_res = requests.post(
            f"{llm_base_url}/init",
            json={
                "skill_name": skill.skill_name,
                "github_url": skill.github_url
            },
            timeout=20,
        )
        init_res.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"LLM init failed: {exc}") from exc

    session_id = init_res.json().get("session_id")
    if not session_id:
        raise HTTPException(status_code=502, detail="LLM init response missing session_id")

    skill.llm_session_id = session_id
    skill.interview_start_time = datetime.utcnow()
    skill.scores = []

    db.commit()

    # GET FIRST QUESTION
    try:
        question_res = requests.get(
            f"{llm_base_url}/question",
            params={"session_id": session_id},
            timeout=20,
        )
        question_res.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"LLM question fetch failed: {exc}") from exc

    return question_res.json()

@router.post("/answer")
def answer_question(
    skill_id: str,
    candidate_response: str,
    db: Session = Depends(get_db)
):
    llm_base_url = _get_llm_base_url()
    max_interview_timeout = _get_timeout_seconds()

    skill = db.query(CandidateSkill).filter(
        CandidateSkill.id == skill_id
    ).first()

    if not skill or not skill.llm_session_id:
        raise HTTPException(
            status_code=400,
            detail="Interview not started"
        )

    elapsed = (
        datetime.utcnow() - skill.interview_start_time
    ).seconds

    # TIMEOUT CHECK
    if elapsed > max_interview_timeout:

        try:
            requests.delete(
                f"{llm_base_url}/session",
                params={"session_id": skill.llm_session_id},
                timeout=10,
            )
        except requests.RequestException:
            pass

        scores = skill.scores or []

        avg_score = statistics.mean(scores) if scores else 0

        skill.score = avg_score
        skill.llm_session_id = None
        skill.interview_start_time = None

        db.commit()

        return {
            "message": "Interview finished",
            "avg_score": avg_score
        }

    # SEND ANSWER
    try:
        answer_res = requests.post(
            f"{llm_base_url}/question",
            params={"session_id": skill.llm_session_id},
            json={"candidate_response": candidate_response},
            timeout=20,
        )
        answer_res.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"LLM answer send failed: {exc}") from exc

    # GET SCORE
    try:
        eval_res = requests.get(
            f"{llm_base_url}/evaluation",
            params={"session_id": skill.llm_session_id},
            timeout=20,
        )
        eval_res.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"LLM evaluation failed: {exc}") from exc

    score = eval_res.json().get("score")
    if score is None:
        raise HTTPException(status_code=502, detail="LLM evaluation response missing score")

    skill.scores.append(score)

    db.commit()

    # GET NEXT QUESTION
    try:
        question_res = requests.get(
            f"{llm_base_url}/question",
            params={"session_id": skill.llm_session_id},
            timeout=20,
        )
        question_res.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"LLM next question fetch failed: {exc}") from exc

    next_question = question_res.json().get("question")
    if next_question is None:
        raise HTTPException(status_code=502, detail="LLM question response missing question")

    return {
        "question": next_question,
        "last_score": score
    }