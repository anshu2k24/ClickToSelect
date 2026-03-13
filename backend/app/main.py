from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database.db import engine, Base
from app.websocket.interview_socket import manager

# import models
from app.models import user_model, candidate_model, recruiter_model
from app.models import job_model
from app.models import candidate_skill_model
from app.models import shortlist_model
from app.models import interview_model
from app.models import interview_candidate_model
from app.models import question_model
from app.models import answer_model
from app.models import score_model
# import routers
from app.routers import auth_router, candidate_router
from app.routers import job_router
from app.routers import shortlist_router
from app.routers import leaderboard_router
from app.routers import interview_router
from app.routers import question_router
from app.routers import answer_router
from app.routers import score_router
from app.routers import report_router
from app.routers import skill_router
from app.routers import recruiter_router
from app.routers import upload_router
from app.routers import brain_router
from app.routers import cheat_router
from app.routers import skill_brain_router
Base.metadata.create_all(bind=engine)


def ensure_candidate_skills_schema():
    if engine.dialect.name != "postgresql":
        return

    statements = [
        "ALTER TABLE candidate_skills ADD COLUMN IF NOT EXISTS feedback VARCHAR",
        "ALTER TABLE candidate_skills ADD COLUMN IF NOT EXISTS scores DOUBLE PRECISION[]",
        "ALTER TABLE candidate_skills ADD COLUMN IF NOT EXISTS llm_session_id VARCHAR",
        "ALTER TABLE candidate_skills ADD COLUMN IF NOT EXISTS interview_start_time TIMESTAMP",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


ensure_candidate_skills_schema()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(candidate_router.router)
app.include_router(job_router.router)
app.include_router(shortlist_router.router)
app.include_router(leaderboard_router.router)
app.include_router(interview_router.router)
app.include_router(question_router.router)
app.include_router(answer_router.router)
app.include_router(score_router.router)
app.include_router(report_router.router)
app.include_router(skill_router.router)
app.include_router(recruiter_router.router)
app.include_router(upload_router.router)
app.include_router(brain_router.router)
app.include_router(cheat_router.router)
app.include_router(skill_brain_router.router)
@app.get("/")
def root():
    return {"message": "AI Interview Backend Running"}
@app.websocket("/ws/interview/{interview_id}")
async def interview_socket(websocket: WebSocket, interview_id: str):

    await manager.connect(interview_id, websocket)

    try:

        while True:

            data = await websocket.receive_json()

            await manager.broadcast(interview_id, data)

    except:

        manager.disconnect(interview_id, websocket)