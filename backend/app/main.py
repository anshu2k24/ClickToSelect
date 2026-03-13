from fastapi import FastAPI, WebSocket
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
Base.metadata.create_all(bind=engine)

app = FastAPI()

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