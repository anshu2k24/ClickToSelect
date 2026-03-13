import os
import uuid
import chromadb
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional

import github_repo
import rag_qa

# ─── DB Initialization ────────────────────────────────────────────────────────
BASE_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH       = os.path.join(BASE_DATA_DIR, "chroma_db")
os.makedirs(DB_PATH, exist_ok=True)

embedder   = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
db_client  = chromadb.PersistentClient(path=DB_PATH)
collection = db_client.get_or_create_collection("codebase")

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(title="AI RAG Interviewer & Skill Verification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas (Existing UI) ────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    message: str
    topics: List[str]
    level: str
    history: List[rag_qa.Message] = []
    repo_names: List[str] = []
    question_number: int

class IngestRequest(BaseModel):
    repo_urls: List[str]

# ─── Schemas (New Skill Verification APIs) ────────────────────────────────────
class VerifyInitRequest(BaseModel):
    skill_name: str
    github_url: Optional[str] = None

class VerifyAnswerRequest(BaseModel):
    candidate_response: str

# In-memory session store for the new API
verification_sessions = {}

# ─── EXISTING UI ROUTES ───────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(html_path, "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/ingest")
def ingest_repos(req: IngestRequest):
    if len(req.repo_urls) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 repositories allowed.")
    
    ingested_repos = []
    try:
        for url in req.repo_urls:
            url = url.strip()
            if not url: continue
            repo_path, repo_name = github_repo.clone_repository(url)
            documents = github_repo.read_files(repo_path)
            chunks = github_repo.chunk_documents(documents)
            github_repo.embed_and_store(chunks, repo_name, collection, embedder)
            ingested_repos.append(repo_name)
            
        return {"status": "success", "repo_names": ingested_repos, "message": f"Successfully ingested: {', '.join(ingested_repos)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_rag(request: QueryRequest):
    topics_str = " ".join(request.topics)
    search_query = f"{topics_str} {request.level} architectural interview questions" if request.question_number == 1 else f"{topics_str} {request.message}"
    
    chunks = rag_qa.retrieve(search_query, request.repo_names, collection, embedder)
    context = "\n\n---\n\n".join(chunks) if chunks else ""
    
    prompt = rag_qa.build_interviewer_prompt(
        context, request.topics, request.level, request.history, 
        request.message, request.question_number, request.repo_names
    )
    
    return StreamingResponse(rag_qa.stream_llama(prompt), media_type="text/plain")

# ─── NEW SKILL VERIFICATION ROUTES ────────────────────────────────────────────

@app.post("/api/verify/init")
def verify_init(req: VerifyInitRequest):
    session_id = str(uuid.uuid4())
    repo_name = None
    
    if req.github_url:
        try:
            repo_path, repo_name = github_repo.clone_repository(req.github_url)
            documents = github_repo.read_files(repo_path)
            chunks = github_repo.chunk_documents(documents)
            github_repo.embed_and_store(chunks, repo_name, collection, embedder)
        except Exception as e:
            print(f"[ERROR] Failed to ingest GitHub URL during init: {e}")

    verification_sessions[session_id] = {
        "skill": req.skill_name,
        "repo_name": repo_name,
        "level": "Beginner",
        "history": [],
        "q_num": 1
    }
    return {"status": "success", "session_id": session_id}


@app.get("/api/verify/question")
def verify_get_question(session_id: str):
    if session_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = verification_sessions[session_id]
    search_query = f"{session['skill']} {session['level']} interview questions"
    
    chunks = rag_qa.retrieve(search_query, [session['repo_name']] if session['repo_name'] else None, collection, embedder)
    context = "\n\n---\n\n".join(chunks) if chunks else ""

    prompt = rag_qa.build_json_question_prompt(context, session['skill'], session['level'], session['history'])
    json_response = rag_qa.generate_json_llama(prompt)

    if "question" in json_response:
        # Save interviewer's question to history
        session['history'].append({"role": "Interviewer", "content": json_response["question"]})
        return {"question": json_response["question"]}
    else:
        return {"question": f"Could you explain your experience with {session['skill']}?"}


@app.post("/api/verify/answer")
def verify_post_answer(session_id: str, req: VerifyAnswerRequest):
    if session_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = verification_sessions[session_id]
    session['history'].append({"role": "Candidate", "content": req.candidate_response})
    session['q_num'] += 1
    
    return {"status": "success"}


@app.get("/api/verify/evaluation")
def verify_get_evaluation(session_id: str):
    if session_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = verification_sessions[session_id]
    
    # We evaluate based on the last Candidate answer
    search_query = session['skill']
    chunks = rag_qa.retrieve(search_query, [session['repo_name']] if session['repo_name'] else None, collection, embedder)
    context = "\n\n---\n\n".join(chunks) if chunks else ""

    prompt = rag_qa.build_json_eval_prompt(context, session['skill'], session['level'], session['history'])
    json_response = rag_qa.generate_json_llama(prompt)

    # Update session level based on LLM decision
    if "level" in json_response:
        session['level'] = json_response["level"]
        
    return {
        "score": json_response.get("score", 0),
        "level": json_response.get("level", session['level'])
    }