from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.candidate_model import CandidateProfile
from app.models.cheat_log_model import CheatLog
from app.models.interview_candidate_model import InterviewCandidate
from app.models.interview_model import Interview
from app.models.job_model import Job
from app.models.recruiter_model import RecruiterProfile
from app.utils.jwt_dependency import require_roles

router = APIRouter(prefix="/cheat", tags=["Cheat Detection"])


@router.post("/report")
def report_cheat(
    candidate_id: str | None = None,
    interview_id: str | None = None,
    event_type: str | None = None,
    confidence: float | None = None,
    payload: dict | None = Body(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_roles("candidate"))
):

    if payload:
        candidate_id = payload.get("candidate_id", candidate_id)
        interview_id = payload.get("interview_id", interview_id)
        event_type = payload.get("event_type", event_type)
        confidence = payload.get("confidence", confidence)

    if not candidate_id or not interview_id or not event_type or confidence is None:
        raise HTTPException(status_code=422, detail="candidate_id, interview_id, event_type, confidence are required")

    candidate = db.query(CandidateProfile).filter(CandidateProfile.id == candidate_id).first()
    if not candidate or str(candidate.user_id) != str(user["user_id"]):
        raise HTTPException(status_code=403, detail="Candidate is not allowed to report for this profile")

    interview_link = db.query(InterviewCandidate).filter(
        InterviewCandidate.interview_id == interview_id,
        InterviewCandidate.candidate_id == candidate.id
    ).first()

    if not interview_link:
        raise HTTPException(status_code=403, detail="Candidate is not linked to this interview")

    log = CheatLog(
        candidate_id=candidate_id,
        interview_id=interview_id,
        event_type=event_type,
        confidence=confidence
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.get("/{interview_id}")
def get_cheat_logs(
    interview_id: str,
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    job = db.query(Job).filter(Job.id == interview.job_id).first()
    recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user["user_id"]).first()

    if not job or not recruiter or str(job.recruiter_id) != str(recruiter.id):
        raise HTTPException(status_code=403, detail="Recruiter is not allowed to view these logs")

    logs = db.query(CheatLog).filter(
        CheatLog.interview_id == interview_id
    ).order_by(CheatLog.timestamp.desc()).all()

    return logs