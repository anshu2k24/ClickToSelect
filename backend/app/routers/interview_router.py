from datetime import datetime

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.candidate_model import CandidateProfile
from app.models.interview_candidate_model import InterviewCandidate
from app.models.interview_model import Interview
from app.models.job_model import Job
from app.utils.jwt_dependency import get_current_user, require_roles

LLM_BASE_URL = "http://localhost:8080/api/interview"

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
    dependencies=[Depends(get_current_user)],
)


def _get_interview_or_404(db: Session, interview_id: str) -> Interview:
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


def _get_interview_candidate_or_404(db: Session, interview_id: str, candidate_id: str) -> InterviewCandidate:
    row = db.query(InterviewCandidate).filter(
        InterviewCandidate.interview_id == interview_id,
        InterviewCandidate.candidate_id == candidate_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate is not linked to this interview")
    return row


def _to_int_score(value) -> int:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=502, detail="Invalid score returned by LLM service")

    if numeric < 0:
        numeric = 0
    if numeric > 100:
        numeric = 100
    return int(round(numeric))


@router.post("/create")
def create_interview(
    job_id: str,
    interview_type: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    interview = Interview(
        job_id=job_id,
        interview_type=interview_type,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.post("/add-candidate")
def add_candidate(
    interview_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    _get_interview_or_404(db, interview_id)

    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    existing = db.query(InterviewCandidate).filter(
        InterviewCandidate.interview_id == interview_id,
        InterviewCandidate.candidate_id == candidate_id,
    ).first()
    if existing:
        return existing

    count = db.query(InterviewCandidate).filter(InterviewCandidate.interview_id == interview_id).count()
    session_index = count % 3

    data = InterviewCandidate(
        interview_id=interview_id,
        candidate_id=candidate_id,
        session_index=session_index,
    )

    db.add(data)
    db.commit()
    db.refresh(data)
    return data


@router.get("/candidates/{interview_id}")
def get_candidates(
    interview_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    _get_interview_or_404(db, interview_id)
    candidates = db.query(InterviewCandidate).filter(InterviewCandidate.interview_id == interview_id).all()
    return candidates


@router.post("/start")
def start_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    interview = _get_interview_or_404(db, interview_id)

    if interview.status == "started" and isinstance(interview.llm_sessions, list) and len(interview.llm_sessions) == 3:
        return {
            "interview_id": interview_id,
            "sessions_created": interview.llm_sessions,
            "status": "started",
        }

    sessions = []

    for _ in range(3):
        try:
            res = requests.post(
                f"{LLM_BASE_URL}/init",
                json={"interview_id": interview_id},
                timeout=15,
            )
            res.raise_for_status()
            payload = res.json()
            session_id = payload.get("session_id")
            if not session_id:
                raise HTTPException(status_code=502, detail="LLM service did not return a session_id")
            sessions.append(session_id)
        except HTTPException:
            raise
        except requests.RequestException as exc:
            raise HTTPException(status_code=502, detail=f"Failed to initialize LLM session: {exc}")

    interview.llm_sessions = sessions
    interview.status = "started"

    db.commit()

    return {
        "interview_id": interview_id,
        "sessions_created": sessions,
        "status": "started",
    }


@router.post("/end")
def end_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    interview = _get_interview_or_404(db, interview_id)

    for session_id in interview.llm_sessions or []:
        try:
            requests.delete(
                f"{LLM_BASE_URL}/session",
                params={"session_id": session_id},
                timeout=10,
            )
        except requests.RequestException:
            pass

    interview.status = "completed"
    interview.llm_sessions = []

    db.commit()

    return {
        "interview_id": interview_id,
        "status": "completed",
    }


@router.post("/join")
def join_interview(
    interview_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("candidate", "recruiter")),
):
    _get_interview_or_404(db, interview_id)

    existing = db.query(InterviewCandidate).filter(
        InterviewCandidate.interview_id == interview_id,
        InterviewCandidate.candidate_id == candidate_id,
    ).first()
    if existing:
        return {
            "candidate_id": candidate_id,
            "session_index": existing.session_index,
            "interview_candidate_id": str(existing.id),
        }

    count = db.query(InterviewCandidate).filter(InterviewCandidate.interview_id == interview_id).count()
    session_index = count % 3

    data = InterviewCandidate(
        interview_id=interview_id,
        candidate_id=candidate_id,
        session_index=session_index,
    )

    db.add(data)
    db.commit()
    db.refresh(data)

    return {
        "candidate_id": candidate_id,
        "session_index": session_index,
        "interview_candidate_id": str(data.id),
    }


@router.get("/question")
def get_question(
    interview_id: str,
    candidate_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    interview_candidate = _get_interview_candidate_or_404(db, interview_id, candidate_id)
    interview = _get_interview_or_404(db, interview_id)

    llm_sessions = interview.llm_sessions or []
    if not llm_sessions:
        raise HTTPException(status_code=409, detail="Interview has not started any LLM sessions")

    if interview_candidate.session_index is None or interview_candidate.session_index >= len(llm_sessions):
        raise HTTPException(status_code=409, detail="Candidate session mapping is invalid for this interview")

    session_id = llm_sessions[interview_candidate.session_index]

    try:
        res = requests.get(
            f"{LLM_BASE_URL}/question",
            params={"session_id": session_id},
            timeout=15,
        )
        res.raise_for_status()
        payload = res.json()
        question = payload.get("question")
        if not question:
            raise HTTPException(status_code=502, detail="LLM service did not return a question")
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch follow-up question: {exc}")

    return {
        "candidate_id": candidate_id,
        "llm_question": question,
        "actions": ["accept_followup", "custom_question"],
    }


@router.post("/ask")
def ask_question(
    interview_id: str,
    candidate_id: str,
    decision: str,
    llm_question: str | None = None,
    custom_question: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    _get_interview_candidate_or_404(db, interview_id, candidate_id)

    normalized = (decision or "").strip().lower()

    if normalized in {"accept_followup", "llm"}:
        if not llm_question or not llm_question.strip():
            raise HTTPException(status_code=400, detail="llm_question is required when accepting LLM follow-up")

        return {
            "question_source": "llm",
            "question": llm_question.strip(),
            "candidate_id": candidate_id,
        }

    if normalized in {"custom_question", "custom"}:
        if not custom_question or not custom_question.strip():
            raise HTTPException(status_code=400, detail="custom_question is required for custom follow-up")

        return {
            "question_source": "recruiter",
            "question": custom_question.strip(),
            "candidate_id": candidate_id,
        }

    raise HTTPException(status_code=400, detail="decision must be 'accept_followup' or 'custom_question'")


@router.post("/answer")
def answer_question(
    interview_id: str,
    candidate_id: str,
    answer: str,
    source: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("candidate", "recruiter")),
):
    if not answer or not answer.strip():
        raise HTTPException(status_code=400, detail="answer is required")

    ic = _get_interview_candidate_or_404(db, interview_id, candidate_id)
    interview = _get_interview_or_404(db, interview_id)

    source_normalized = (source or "").strip().lower()

    if source_normalized == "llm":
        llm_sessions = interview.llm_sessions or []
        if not llm_sessions:
            raise HTTPException(status_code=409, detail="Interview has not started any LLM sessions")
        if ic.session_index is None or ic.session_index >= len(llm_sessions):
            raise HTTPException(status_code=409, detail="Candidate session mapping is invalid for this interview")

        session_id = llm_sessions[ic.session_index]

        try:
            answer_res = requests.post(
                f"{LLM_BASE_URL}/answer",
                json={
                    "session_id": session_id,
                    "candidate_response": answer.strip(),
                },
                timeout=15,
            )
            answer_res.raise_for_status()

            score_res = requests.get(
                f"{LLM_BASE_URL}/evaluation",
                params={"session_id": session_id},
                timeout=15,
            )
            score_res.raise_for_status()
            score_payload = score_res.json()
            score = _to_int_score(score_payload.get("score"))
        except HTTPException:
            raise
        except requests.RequestException as exc:
            raise HTTPException(status_code=502, detail=f"LLM scoring failed: {exc}")

        ic.scores = [*(ic.scores or []), score]
        db.commit()

        return {
            "score": score,
            "score_source": "llm",
        }

    if source_normalized in {"custom", "recruiter"}:
        return {
            "candidate_id": candidate_id,
            "answer_for_recruiter_review": answer.strip(),
            "requires_manual_score": True,
            "score_source": "recruiter",
        }

    raise HTTPException(status_code=400, detail="source must be 'llm' or 'custom'")


@router.post("/manual-score")
def manual_score(
    interview_id: str,
    candidate_id: str,
    score: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter")),
):
    if score < 0 or score > 100:
        raise HTTPException(status_code=400, detail="score must be between 0 and 100")

    ic = _get_interview_candidate_or_404(db, interview_id, candidate_id)

    ic.scores = [*(ic.scores or []), int(score)]

    db.commit()

    return {
        "message": "score added",
        "score": int(score),
        "score_source": "recruiter",
    }


@router.get("/my")
def get_my_interviews(
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate")),
):
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == user["user_id"]).first()

    if not candidate:
        return []

    rows = db.query(
        InterviewCandidate,
        Interview,
        Job,
    ).join(
        Interview,
        InterviewCandidate.interview_id == Interview.id,
    ).join(
        Job,
        Interview.job_id == Job.id,
    ).filter(
        InterviewCandidate.candidate_id == candidate.id,
    ).all()

    payload = []

    for interview_candidate, interview, job in rows:
        status_raw = (interview_candidate.status or "pending").lower()
        status = "COMPLETED" if status_raw in ["completed", "done"] else "UPCOMING"

        payload.append({
            "id": str(interview.id),
            "role": job.role or job.title or "Interview",
            "company": "Hiring Partner",
            "company_logo": "🏢",
            "scheduled_at": interview.interview_date.isoformat() if interview.interview_date else datetime.utcnow().isoformat(),
            "duration_mins": interview.duration or 45,
            "status": status,
            "round": interview.interview_type or "Technical Round",
            "interviewer": "AI + Recruiter Panel",
            "ai_level": "Role-based assessment",
            "accepted_at": datetime.utcnow().isoformat(),
            "join_url": "#" if status == "UPCOMING" else None,
        })

    return payload
