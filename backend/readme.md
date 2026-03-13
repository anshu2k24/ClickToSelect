# AI Interview Platform – Backend

## Overview

This project is the backend for an **AI-powered interview platform** that helps recruiters conduct automated technical interviews with the assistance of an AI model.

The system supports:

* Candidate onboarding
* Skill verification
* Leaderboard ranking
* Recruiter job creation
* Candidate shortlisting
* Interview management
* AI-powered answer evaluation
* HR scoring
* Final interview reports

The backend is built using **FastAPI** and **PostgreSQL**.

---

# Tech Stack

Backend Framework

* FastAPI

Database

* PostgreSQL

ORM

* SQLAlchemy

Authentication

* JWT (JSON Web Tokens)

AI Integration

* External AI model endpoint (`/brain`)

Real-time communication

* WebSockets (for interviews)

---

# Project Structure

```
backend/
│
├── app
│
├── routers
│   ├── auth_router.py
│   ├── candidate_router.py
│   ├── recruiter_router.py
│   ├── job_router.py
│   ├── shortlist_router.py
│   ├── interview_router.py
│   ├── question_router.py
│   ├── answer_router.py
│   ├── score_router.py
│   ├── report_router.py
│   ├── skill_router.py
│   └── upload_router.py
│
├── models
│   ├── user_model.py
│   ├── candidate_model.py
│   ├── recruiter_model.py
│   ├── job_model.py
│   ├── candidate_skill_model.py
│   ├── shortlist_model.py
│   ├── interview_model.py
│   ├── interview_candidate_model.py
│   ├── question_model.py
│   ├── answer_model.py
│   └── score_model.py
│
├── schemas
│   ├── user_schema.py
│   ├── candidate_schema.py
│   └── job_schema.py
│
├── database
│   └── db.py
│
├── utils
│   └── auth_utils.py
│
├── services
│
├── websocket
│
└── main.py
```

---

# Database Schema

Main tables used in the system:

```
users
candidates
candidate_skills
recruiters
jobs
shortlists
interviews
interview_candidates
questions
answers
scores
```

---

# System Flow

## Candidate Flow

1. Candidate registers
2. Candidate logs in
3. Candidate creates profile
4. Candidate adds skills and GitHub links
5. AI verifies skills
6. Candidate appears in leaderboard
7. Recruiter shortlists candidate
8. Candidate attends interview
9. Candidate answers questions
10. AI evaluates answers
11. HR provides scores
12. Final report generated

---

## Recruiter Flow

1. Recruiter registers
2. Recruiter creates company profile
3. Recruiter creates job posting
4. Recruiter views leaderboard
5. Recruiter shortlists candidates
6. Recruiter creates interview
7. Recruiter adds candidates
8. Recruiter conducts interview
9. Recruiter scores candidates
10. Final interview report generated

---

# API Endpoints

## Authentication

```
POST /auth/register
POST /auth/login
```

---

## Candidate

```
POST /candidate/profile
```

---

## Skills

```
POST /skill/add
GET /skill/{candidate_id}
DELETE /skill/{skill_id}
```

---

## Recruiter

```
POST /recruiter/profile
GET /recruiter/{recruiter_id}
```

---

## Jobs

```
POST /job/create
GET /job/list
GET /job/{job_id}
PUT /job/update/{job_id}
DELETE /job/{job_id}
```

---

## Leaderboard

```
GET /leaderboard
```

---

## Shortlisting

```
POST /shortlist/add
```

---

## Interviews

```
POST /interview/create
POST /interview/add-candidate
GET /interview/candidates/{interview_id}
POST /interview/start
POST /interview/end
```

---

## Questions

```
POST /question/add
GET /question/list/{interview_id}
```

---

## Answers

```
POST /answer/submit
```

---

## Scores

```
POST /score/ai
POST /score/hr
```

---

## Reports

```
GET /report/{candidate_id}
```

---

## File Upload

```
POST /upload/resume
```

---

# AI Model Integration

The backend integrates with an AI model exposed through the endpoint:

```
POST /brain
```

The model analyzes candidate answers and returns:

* Answer summary
* AI score
* Feedback
* Suggested next question

---

# Running the Project

## 1. Clone repository

```
git clone <repo-url>
cd backend
```

---

## 2. Create virtual environment

```
python -m venv venv
```

Activate:

Windows

```
venv\Scripts\activate
```

Mac/Linux

```
source venv/bin/activate
```

---

## 3. Install dependencies

```
pip install -r requirements.txt
```

---

## 4. Setup environment variables

Create `.env`

Example:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_interviewer_db
```

---

## 5. Run the server

```
uvicorn app.main:app --reload
```

Server will start at:

```
http://127.0.0.1:8000
```

API documentation:

```
http://127.0.0.1:8000/docs
```

---

# Testing the System

Use Swagger UI to test the flow:

1. Register user
2. Login
3. Create candidate profile
4. Add skills
5. Create recruiter profile
6. Create job
7. Shortlist candidate
8. Create interview
9. Add candidate
10. Add question
11. Submit answer
12. Call AI `/brain`
13. Add HR score
14. Generate report

---

# Future Improvements

* Cheating detection system
* Real-time interview analytics
* Candidate performance insights
* Email interview invites
* Resume parsing
* AI interview question generation

---

# License

MIT License
