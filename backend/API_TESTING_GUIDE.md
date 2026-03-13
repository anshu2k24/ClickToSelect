# API Testing Guide (All Endpoints)

This document helps you test all backend endpoints using Swagger, Postman, or curl.

## Base URL

- Local API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

## Prerequisites

1. Start PostgreSQL:

```bash
docker compose -f docker-compose.yml up -d
```

2. Start backend:

```bash
uvicorn app.main:app --reload
```

3. Optional: Start AI brain service (for `/brain/`). If not running, backend returns `502 Brain service is unavailable`.

---

## Auth Flow

### 1) Register Candidate

`POST /auth/register`

```json
{
  "name": "Candidate One",
  "email": "candidate1@example.com",
  "password": "Test@12345",
  "role": "candidate"
}
```

Expected: `200`

### 2) Register Recruiter

`POST /auth/register`

```json
{
  "name": "Recruiter One",
  "email": "recruiter1@example.com",
  "password": "Test@12345",
  "role": "recruiter"
}
```

Expected: `200`

### 3) Login Candidate

`POST /auth/login`

```json
{
  "email": "candidate1@example.com",
  "password": "Test@12345"
}
```

Save `access_token` as `CAND_TOKEN`.

### 4) Login Recruiter

`POST /auth/login`

```json
{
  "email": "recruiter1@example.com",
  "password": "Test@12345"
}
```

Save `access_token` as `REC_TOKEN`.

---

## Headers for Protected APIs

Candidate header:

```http
Authorization: Bearer <CAND_TOKEN>
```

Recruiter header:

```http
Authorization: Bearer <REC_TOKEN>
```

---

## Candidate Endpoints

### Create Candidate Profile (candidate only)

`POST /candidate/profile`

```json
{
  "mobile_no": "9999999999",
  "dob": "2000-01-01",
  "experience_years": 2,
  "organisation": "ABC Corp",
  "location": "Chennai",
  "github_link": "https://github.com/candidate",
  "linkedin_link": "https://linkedin.com/in/candidate",
  "resume_url": "uploads/resume.txt",
  "interested_in_internship": false
}
```

Expected: `200`

---

## Recruiter Endpoints

### Create Recruiter Profile (recruiter only)

`POST /recruiter/profile?company_name=TestCo&location=Bengaluru`

Optional params:
- `company_description`
- `company_website`

Expected: `200`

### Get Recruiter Profile

`GET /recruiter/{recruiter_id}`

Expected: `200` or `404`

---

## Skill Endpoints

### Add Skill (candidate only)

`POST /skill/add?candidate_id={candidate_id}&skill_name=Python&github_url=https://github.com/candidate/repo`

Expected: `200`

### Get Skills

`GET /skill/{candidate_id}`

Expected: `200`

### Delete Skill

`DELETE /skill/{skill_id}`

Expected: `200` or `404`

---

## Leaderboard Endpoint

### Get Leaderboard

`GET /leaderboard/`

Expected: `200` with list of:

```json
[
  {
    "candidate_id": "...",
    "avg_score": 0.0
  }
]
```

---

## Job Endpoints (recruiter only)

### Create Job

`POST /job/create`

```json
{
  "recruiter_id": "<recruiter_profile_id>",
  "title": "Backend Developer",
  "role": "Backend",
  "description": "Build APIs",
  "experience_required": 2,
  "location": "Remote"
}
```

Expected: `200`

### List Jobs

`GET /job/list`

Expected: `200`

### Get Job

`GET /job/{job_id}`

Expected: `200` or `404`

### Update Job

`PUT /job/update/{job_id}?title=Senior Backend Developer`

Expected: `200` or `404`

### Delete Job

`DELETE /job/{job_id}`

Expected: `200` or `404`

---

## Shortlist Endpoints (recruiter only)

### Shortlist Candidate

`POST /shortlist/add?job_id={job_id}&candidate_id={candidate_id}`

Expected: `200` or `404`

---

## Interview Endpoints (recruiter only)

### Create Interview

`POST /interview/create?job_id={job_id}&interview_type=individual`

Expected: `200` or `404`

### Add Candidate to Interview

`POST /interview/add-candidate?interview_id={interview_id}&candidate_id={candidate_id}`

Expected: `200` or `404`

### Get Interview Candidates

`GET /interview/candidates/{interview_id}`

Expected: `200`

### Start Interview

`POST /interview/start?interview_id={interview_id}`

Expected: `200`

### End Interview

`POST /interview/end?interview_id={interview_id}`

Expected: `200`

---

## Question Endpoints (recruiter only)

### Add Question

`POST /question/add?interview_id={interview_id}&question_text=Explain%20REST`

Expected: `200` or `404`

### List Questions

`GET /question/list/{interview_id}`

Expected: `200`

---

## Answer Endpoints (candidate only)

### Submit Answer

`POST /answer/submit?question_id={question_id}&candidate_id={candidate_id}&answer_text=REST%20is%20stateless`

Expected: `200` or `404`

---

## Score Endpoints (recruiter only)

### Store AI Score

`POST /score/ai?question_id={question_id}&candidate_id={candidate_id}&ai_score=8.5`

Expected: `200` or `404`

### Store HR Score

`POST /score/hr?question_id={question_id}&candidate_id={candidate_id}&hr_score=9.0`

Expected: `200` or `404`

---

## Report Endpoint

### Get Candidate Report

`GET /report/{candidate_id}`

Expected: `200`

Response shape:

```json
{
  "candidate_id": "...",
  "final_score": 8.75
}
```

---

## Upload Endpoint

### Upload Resume

`POST /upload/resume` (multipart/form-data)

Form key: `file`

Expected: `200`

Response shape:

```json
{
  "filename": "resume.txt",
  "path": "uploads/resume.txt"
}
```

---

## Brain Endpoint (Public)

### Evaluate with AI Brain

`POST /brain/`

```json
{
  "question": "What is OOP?",
  "answer": "OOP is object-oriented programming",
  "candidate_id": "<candidate_id>"
}
```

Expected:
- `200` when AI service is running
- `502` when AI service is down

---

## Security / Authorization Checks

These should fail with `403`:

1. Candidate token on `POST /job/create`
2. Recruiter token on `POST /answer/submit`
3. Recruiter token on `POST /candidate/profile`

These should fail with `401`:

1. Any protected endpoint without `Authorization` header

---

## Quick Smoke Validation Script

Use the same full Python smoke script you already ran in terminal. It validates register/login, profile creation, role restrictions, protected APIs, upload, report, and brain behavior in one run.
