from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.job_model import Job
from app.models.recruiter_model import RecruiterProfile
from app.schemas.job_schema import JobCreate
from app.utils.jwt_dependency import get_current_user, require_roles


router = APIRouter(
    prefix="/job",
    tags=["Jobs"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/create")
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("recruiter"))
):

    recruiter = db.query(RecruiterProfile).filter(
        RecruiterProfile.id == data.recruiter_id
    ).first()

    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")

    if str(recruiter.user_id) != user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot create job for another recruiter")

    job = Job(**data.dict())

    db.add(job)

    db.commit()

    db.refresh(job)

    return job


@router.get("/list")
def list_jobs(db: Session = Depends(get_db)):

    jobs = db.query(Job).all()

    return jobs
@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job
@router.put("/update/{job_id}")
def update_job(
    job_id: str,
    title: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.title = title

    db.commit()

    return job
@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_roles("recruiter"))
):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)

    db.commit()

    return {"message": "job deleted"}