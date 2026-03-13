from datetime import date, datetime, timedelta

from app.database.db import SessionLocal
from app.models.candidate_model import CandidateProfile
from app.models.interview_candidate_model import InterviewCandidate
from app.models.interview_model import Interview
from app.models.job_model import Job
from app.models.question_model import Question
from app.models.recruiter_model import RecruiterProfile
from app.models.user_model import User
from app.utils.auth_utils import hash_password

DEFAULT_PASSWORD = "123456"


def get_or_create_user(db, *, name, email, role):
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.name = name
        user.role = role
        user.password_hash = hash_password(DEFAULT_PASSWORD)
        return user

    user = User(
        name=name,
        email=email,
        role=role,
        password_hash=hash_password(DEFAULT_PASSWORD),
    )
    db.add(user)
    db.flush()
    return user


def get_or_create_recruiter_profile(db, user):
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == user.id).first()
    if profile:
        return profile

    profile = RecruiterProfile(
        user_id=user.id,
        company_name="ClickToSelect Hiring",
        company_description="Demo recruiter profile seeded from backend script.",
        company_website="https://clicktoselect.local",
        location="Bengaluru",
    )
    db.add(profile)
    db.flush()
    return profile


def get_or_create_candidate_profile(db, user, *, mobile, years, org, location):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
    if profile:
        return profile

    profile = CandidateProfile(
        user_id=user.id,
        mobile_no=mobile,
        dob=date(2000, 1, 1),
        experience_years=years,
        organisation=org,
        location=location,
        github_link="",
        linkedin_link="",
        resume_url="",
        interested_in_internship=False,
    )
    db.add(profile)
    db.flush()
    return profile


def seed():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            user.password_hash = hash_password(DEFAULT_PASSWORD)

        recruiter_user = get_or_create_user(
            db,
            name="Recruiter Demo",
            email="recruiter.demo@clicktoselect.local",
            role="recruiter",
        )
        recruiter_profile = get_or_create_recruiter_profile(db, recruiter_user)

        candidate_specs = [
            ("Arjun Mehta", "arjun.demo@clicktoselect.local", "9990001001", 3, "React Team", "Bengaluru"),
            ("Priya Nair", "priya.demo@clicktoselect.local", "9990001002", 4, "ML Team", "Remote"),
            ("Rohan Sharma", "rohan.demo@clicktoselect.local", "9990001003", 2, "Java Team", "Pune"),
        ]

        candidate_profiles = []
        for name, email, mobile, years, org, location in candidate_specs:
            user = get_or_create_user(db, name=name, email=email, role="candidate")
            profile = get_or_create_candidate_profile(
                db,
                user,
                mobile=mobile,
                years=years,
                org=org,
                location=location,
            )
            candidate_profiles.append(profile)

        job = db.query(Job).filter(
            Job.recruiter_id == recruiter_profile.id,
            Job.title == "Frontend Engineer"
        ).first()

        if not job:
            job = Job(
                recruiter_id=recruiter_profile.id,
                title="Frontend Engineer",
                role="React",
                description="Build interview-ready frontend features with React and FastAPI integrations.",
                experience_required=2,
                location="Bengaluru / Remote",
            )
            db.add(job)
            db.flush()

        interview = db.query(Interview).filter(
            Interview.job_id == job.id,
            Interview.interview_type == "individual"
        ).first()

        if not interview:
            interview = Interview(
                job_id=job.id,
                interview_type="individual",
                interview_date=datetime.utcnow() + timedelta(days=1),
                duration=45,
            )
            db.add(interview)
            db.flush()

        for candidate in candidate_profiles:
            link = db.query(InterviewCandidate).filter(
                InterviewCandidate.interview_id == interview.id,
                InterviewCandidate.candidate_id == candidate.id,
            ).first()
            if not link:
                db.add(InterviewCandidate(
                    interview_id=interview.id,
                    candidate_id=candidate.id,
                    status="pending",
                ))

        question_texts = [
            "Explain React reconciliation and when rerenders happen.",
            "How do you optimize a React app for performance bottlenecks?",
            "Describe a FastAPI + React integration pattern for authenticated APIs.",
            "How do you structure state management for a medium-size React app?",
            "How would you test this feature end-to-end before release?",
        ]

        existing_questions = db.query(Question).filter(Question.interview_id == interview.id).count()
        if existing_questions == 0:
            for text in question_texts:
                db.add(Question(interview_id=interview.id, question_text=text))

        db.commit()

        print("Demo seed complete.")
        print(f"Recruiter login: recruiter.demo@clicktoselect.local / {DEFAULT_PASSWORD}")
        print(f"Candidate login: arjun.demo@clicktoselect.local / {DEFAULT_PASSWORD}")
        print(f"Interview ID: {interview.id}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
