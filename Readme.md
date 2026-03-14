# ClickToSelect – AI Interview Platform

ClickToSelect is a multi-service interview platform for candidate screening, recruiter workflows, AI-assisted interviewing, and skill verification.

It includes:
- a FastAPI backend (`backend/`) for auth, profiles, jobs, interviews, scoring, reports, cheat logs, uploads,
- a React + Vite frontend (`frontend/`) for candidate and recruiter experiences,
- a separate RAG/LLM service (`rag/`) used by interview and skill-verification flows.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Key Features](#key-features)
3. [Repository Structure](#repository-structure)
4. [Prerequisites](#prerequisites)
5. [Quick Start (All Services)](#quick-start-all-services)
6. [Environment Variables](#environment-variables)
7. [Interview Flow (Recruiter + Candidate Split)](#interview-flow-recruiter--candidate-split)
8. [Core API Areas](#core-api-areas)
9. [Frontend Routes](#frontend-routes)
10. [Troubleshooting](#troubleshooting)
11. [Development Notes](#development-notes)

---

## Architecture

### Services and Ports

- **Frontend (React/Vite):** `http://127.0.0.1:5173`
- **Backend (FastAPI):** `http://127.0.0.1:8000`
- **RAG/LLM service (FastAPI):** `http://127.0.0.1:8080`
- **PostgreSQL (Docker):** `localhost:5432`

### Runtime relationship

1. Frontend calls backend for all product flows.
2. Backend stores state in PostgreSQL.
3. Backend calls RAG/LLM service (`/api/verify/*`) for interview questioning/scoring sessions.
4. Candidate and recruiter use separate interview UIs with role-safe behavior.

---

## Key Features

- JWT-based auth with candidate/recruiter roles.
- Candidate profile, skills, resume upload, and interview participation.
- Recruiter profile, job creation, shortlist, and interview orchestration.
- AI/LLM interview session initialization (3 sessions per interview), question generation, and scoring.
- Recruiter-controlled follow-up question publishing:
  - accept LLM follow-up, or
  - publish recruiter custom follow-up.
- Candidate answer submission from a **separate candidate interview page**.
- Recruiter manual scoring path for custom questions.
- Interview session cleanup on end (`/interview/end` -> LLM session delete).
- Cheat monitoring hooks and logs.
- Report and leaderboard endpoints.

---

## Repository Structure

```text
ClickToSelect/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ database/
│  │  ├─ models/
│  │  ├─ routers/
│  │  ├─ schemas/
│  │  ├─ utils/
│  │  └─ websocket/
│  ├─ docker-compose.yml
│  ├─ requirements.txt
│  └─ API_TESTING_GUIDE.md
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ pages/candidate/
│  │  ├─ pages/recruiter/
│  │  └─ components/
│  └─ package.json
├─ rag/
│  ├─ main.py
│  ├─ rag_qa.py
│  ├─ github_repo.py
│  └─ requirements.txt
└─ Readme.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Docker + Docker Compose
- Internet on first RAG run (model download via `sentence-transformers`)

---

## Quick Start (All Services)

### 1) Start PostgreSQL (Docker)

From `backend/`:

```bash
docker compose up -d
```

This starts Postgres using:
- user: `postgres`
- password: `postgres@12`
- db: `ai_interviewer_db`

### 2) Configure and run backend

From `backend/`:

```bash
python -m venv venv
```

Activate:
- Windows PowerShell:

```bash
venv\Scripts\Activate.ps1
```

- Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `backend/.env` (example below in env section), then run:

```bash
uvicorn app.main:app --reload
```

Backend docs: `http://127.0.0.1:8000/docs`

### 3) Run RAG/LLM service (required for interview start and AI scoring)

From `rag/`:

```bash
python -m venv .venv
```

Activate and install:

```bash
pip install -r requirements.txt
```

Run:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8080
```

RAG docs: `http://127.0.0.1:8080/docs`

### 4) Run frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend runs at Vite default (usually `http://127.0.0.1:5173`).

---

## Environment Variables

### `backend/.env`

Minimum required:

```env
DATABASE_URL=postgresql://postgres:postgres%4012@localhost:5432/ai_interviewer_db
JWT_SECRET_KEY=supersecretkey
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=10
```

Notes:
- `DATABASE_URL` is mandatory.
- JWT values have code defaults but should be set explicitly outside local dev.

### `frontend/.env` (optional)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Interview Flow (Recruiter + Candidate Split)

### Recruiter side

1. Create interview: `POST /interview/create`
2. Add candidate: `POST /interview/add-candidate`
3. Start interview: `POST /interview/start`
	- backend creates 3 LLM sessions via `rag` service.
4. Generate follow-up: `GET /interview/question`
5. Publish question decision: `POST /interview/ask`
	- `accept_followup` (LLM question), or
	- `custom_question` (recruiter text).
6. Review candidate answer state from interview candidate row.
7. If custom question path, submit manual score: `POST /interview/manual-score`.
8. End interview: `POST /interview/end` (LLM sessions cleared).

### Candidate side

1. Open candidate interview page: `/candidate/interview?interviewId=<id>`
2. Fetch published question: `GET /interview/me/question`
3. Submit answer: `POST /interview/me/answer`
4. Receive either:
	- immediate LLM score (LLM question), or
	- awaiting recruiter manual score (custom question).

---

## Core API Areas

High-level groups (see backend docs for complete schemas):

- Auth: `/auth/register`, `/auth/login`
- Candidate profile: `/candidate/*`
- Recruiter profile: `/recruiter/*`
- Job management: `/job/*`
- Skills: `/skill/*`
- Skill brain flow: `/skill-brain/*`
- Interview orchestration: `/interview/*`
- Question/answer/score/report: `/question/*`, `/answer/*`, `/score/*`, `/report/*`
- Shortlist: `/shortlist/*`
- Leaderboard: `/leaderboard/*`
- Upload: `/upload/*`
- Cheat logs/reporting: `/cheat/*`

Detailed API walkthrough examples are available in:
- `backend/API_TESTING_GUIDE.md`

---

## Frontend Routes

### Candidate

- `/profile`
- `/skill-verify`
- `/candidate/interview?interviewId=<id>`

### Recruiter

- `/recruiter/profile`
- `/recruiter/job/:id`
- `/recruiter/parallel/:interviewId`
- `/recruiter/parallel?interviewId=<id>`
- `/recruiter/llm-setup`

---

## Troubleshooting

### 1) `Failed to initialize LLM session` / 404 on `localhost:8080`

Cause:
- RAG service not running, wrong folder, wrong port, or missing `/api/verify/*` routes.

Fix:
1. Start service from `rag/`.
2. Run `uvicorn main:app --host 127.0.0.1 --port 8080`.
3. Confirm `http://127.0.0.1:8080/docs` shows `/api/verify/init`.

### 2) SQLAlchemy error: missing interview columns (`status`, etc.)

Cause:
- Existing DB schema predates new interview columns.

Fix:
- Restart backend once; startup runs idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` for interview schema sync.

### 3) Frontend shows build errors after edits

From `frontend/`:

```bash
npm run build
```

Fix JSX syntax or import issues shown in output.

### 4) Candidate cannot answer from recruiter page

Expected behavior:
- Recruiter page publishes and reviews.
- Candidate answers from `/candidate/interview` page.

---

## Development Notes

- Backend SQLAlchemy engine runs with `echo=True`, so SQL is printed in logs.
- Interview candidate state now stores active question + pending answer + manual-score flag.
- Password hashing context supports `pbkdf2_sha256` + `bcrypt` for reliability.
- Keep backend and rag services running together for interview workflows.

---

## Recommended Local Startup Order

1. `backend/docker-compose.yml` -> Postgres
2. `backend` -> FastAPI
3. `rag` -> FastAPI on 8080
4. `frontend` -> Vite

Once all four are up, full candidate/recruiter + interview flows are available.
