# import os
# import json
# import requests
# import chromadb
# from fastapi import FastAPI
# from fastapi.responses import HTMLResponse, StreamingResponse
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sentence_transformers import SentenceTransformer

# # ─── Config ───────────────────────────────────────────────────────────────────

# DB_PATH         = os.path.join(os.path.dirname(__file__), "data", "chroma_db")
# COLLECTION_NAME = "codebase"
# OLLAMA_URL      = "http://localhost:11434/api/generate"
# OLLAMA_MODEL    = "llama3.1"
# TOP_K           = 4

# # ─── App ──────────────────────────────────────────────────────────────────────

# app = FastAPI(title="AI Interviewer RAG API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# embedder   = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
# db_client  = chromadb.PersistentClient(path=DB_PATH)
# collection = None

# class Message(BaseModel):
#     role: str
#     content: str

# class QueryRequest(BaseModel):
#     message: str
#     topic: str
#     level: str
#     history: list[Message] = []
#     repo_name: str | None = None

# # ─── Startup ──────────────────────────────────────────────────────────────────

# @app.on_event("startup")
# async def startup_event():
#     global collection
#     try:
#         collection = db_client.get_collection(COLLECTION_NAME)
#         print(f"[startup] Loaded ChromaDB collection '{COLLECTION_NAME}' "
#               f"with {collection.count()} chunks.")
#     except Exception as e:
#         print(f"[startup] Collection '{COLLECTION_NAME}' not found yet: {e}")
#         print("[startup] Run your ingestion script first to populate the DB.")

# # ─── Retrieval ────────────────────────────────────────────────────────────────

# def retrieve(query: str, repo_name: str | None = None, top_k: int = TOP_K) -> list[str]:
#     if collection is None:
#         return []
#     query_embedding = embedder.encode([query]).tolist()
#     kwargs = {"query_embeddings": query_embedding, "n_results": top_k}
#     if repo_name:
#         kwargs["where"] = {"repo": repo_name}
#     results = collection.query(**kwargs)
#     return results["documents"][0] if results["documents"] else []

# # ─── LLM ──────────────────────────────────────────────────────────────────────

# def stream_llama(prompt: str):
#     try:
#         resp = requests.post(
#             OLLAMA_URL,
#             json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
#             stream=True,
#             timeout=120,
#         )
#         resp.raise_for_status()
#         for line in resp.iter_lines():
#             if line:
#                 try:
#                     data = json.loads(line.decode("utf-8"))
#                     if "response" in data:
#                         yield data["response"]
#                     if data.get("done"):
#                         break
#                 except Exception:
#                     pass
#     except requests.exceptions.RequestException as e:
#         yield f"\n[Error contacting Ollama: {e}]"

# def build_interviewer_prompt(context: str, topic: str, level: str, history: list[Message], latest_msg: str) -> str:
#     # Format the history so LLaMA has context of what was already asked/answered
#     history_text = ""
#     for msg in history:
#         role_name = "Interviewer" if msg.role == "assistant" else "Candidate"
#         history_text += f"{role_name}: {msg.content}\n"

#     # Strict system instructions to force interviewer behavior
#     return f"""You are an expert, friendly technical interviewer. You are interviewing a candidate for a software engineering role. 
# The core topic is '{topic}' and the candidate's requested starting level is '{level}'.

# YOUR DIRECTIVES:
# 1. Act naturally as an interviewer. Do not break character.
# 2. Read the "Conversation History" to understand what has already been asked and how the candidate performed.
# 3. If the candidate just answered a question, briefly evaluate it. If they did well, slightly increase the difficulty. If they struggled, gently guide them or drop the difficulty.
# 4. ASK ONLY ONE QUESTION AT A TIME. Do NOT bombard the candidate with multiple questions.
# 5. Base your next question strictly on the topic and utilize the "Reference Material" below for technical accuracy and inspiration. 
# 6. Keep your responses concise. Never answer your own questions.

# Reference Material (Use this to formulate your next question):
# {context if context else 'No specific reference material found. Rely on your internal knowledge.'}

# Conversation History:
# {history_text}

# Candidate's Latest Message: {latest_msg}

# Interviewer (You):
# """

# # ─── Routes ───────────────────────────────────────────────────────────────────

# @app.get("/", response_class=HTMLResponse)
# async def get_index():
#     html_path = os.path.join(os.path.dirname(__file__), "index.html")
#     with open(html_path, "r") as f:
#         return HTMLResponse(content=f.read())

# @app.post("/query")
# async def query_rag(request: QueryRequest):
#     # Smart Retrieval: Search ChromaDB based on the topic + the user's last answer to find relevant follow-up material.
#     # If it's the very first message, search for general topic questions at their level.
#     search_query = f"{request.topic} {request.level} interview questions" if not request.message else f"{request.topic} {request.message}"
    
#     chunks = retrieve(search_query, request.repo_name)
#     context = "\n\n---\n\n".join(chunks) if chunks else ""
    
#     prompt = build_interviewer_prompt(context, request.topic, request.level, request.history, request.message)
#     return StreamingResponse(stream_llama(prompt), media_type="text/plain")

# @app.get("/health")
# async def health():
#     return {
#         "status": "ok",
#         "collection": COLLECTION_NAME,
#         "chunks_indexed": collection.count() if collection else 0,
#         "model": OLLAMA_MODEL,
#     }

import os
import json
import requests
import chromadb
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# ─── Config ───────────────────────────────────────────────────────────────────

DB_PATH         = os.path.join(os.path.dirname(__file__), "data", "chroma_db")
COLLECTION_NAME = "codebase"
OLLAMA_URL      = "http://localhost:11434/api/generate"
OLLAMA_MODEL    = "llama3.1"
TOP_K           = 4

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="AI Interviewer RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

embedder   = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
db_client  = chromadb.PersistentClient(path=DB_PATH)
collection = None

class Message(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    message: str
    topic: str
    level: str
    history: list[Message] = []
    repo_name: str | None = None
    question_number: int # Tracks which question we are on (1 to 6)

# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    global collection
    try:
        collection = db_client.get_collection(COLLECTION_NAME)
        print(f"[startup] Loaded ChromaDB collection '{COLLECTION_NAME}'")
    except Exception as e:
        print(f"[startup] Collection '{COLLECTION_NAME}' not found yet: {e}")

# ─── Retrieval ────────────────────────────────────────────────────────────────

def retrieve(query: str, repo_name: str | None = None, top_k: int = TOP_K) -> list[str]:
    if collection is None:
        return []
    query_embedding = embedder.encode([query]).tolist()
    kwargs = {"query_embeddings": query_embedding, "n_results": top_k}
    if repo_name:
        kwargs["where"] = {"repo": repo_name}
    results = collection.query(**kwargs)
    return results["documents"][0] if results["documents"] else []

# ─── LLM ──────────────────────────────────────────────────────────────────────

def stream_llama(prompt: str):
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": True},
            stream=True,
            timeout=120,
        )
        resp.raise_for_status()
        for line in resp.iter_lines():
            if line:
                try:
                    data = json.loads(line.decode("utf-8"))
                    if "response" in data:
                        yield data["response"]
                    if data.get("done"):
                        break
                except Exception:
                    pass
    except requests.exceptions.RequestException as e:
        yield f"\n[Error contacting Ollama: {e}]"

def build_interviewer_prompt(context: str, topic: str, level: str, history: list[Message], latest_msg: str, q_num: int) -> str:
    history_text = ""
    for msg in history:
        role_name = "Interviewer" if msg.role == "assistant" else "Candidate"
        history_text += f"{role_name}: {msg.content}\n"

    # Dynamic instructions based on what question number we are on
    if q_num == 1:
        state_directive = f"Introduce yourself briefly. Ask QUESTION 1 of 5 for the {level} level. Focus on a core conceptual understanding of {topic}."
    elif q_num <= 5:
        state_directive = f"""Evaluate the candidate's last answer. If their answer is completely wrong and shows zero understanding, you MUST stop the interview by outputting exactly '[END_INTERVIEW]'. 
If the answer is acceptable, provide brief feedback and ask QUESTION {q_num} of 5. Focus mostly on conceptual understanding rather than pure syntax. You may ask a code-based question, but keep code-based questions to a maximum of 2 out of the 5 questions."""
    else:
        state_directive = f"""Evaluate the candidate's answer to question 5. DO NOT ask any more questions. 
If the candidate demonstrated good understanding of the {level} level overall, output your feedback and end your response with exactly the tag '[LEVEL_UP]'. 
If they failed to demonstrate sufficient knowledge, output your feedback and end your response with exactly the tag '[END_INTERVIEW]'."""

    return f"""You are an expert technical interviewer evaluating a candidate on {topic} at the {level} level.

YOUR DIRECTIVES:
1. {state_directive}
2. ASK ONLY ONE QUESTION AT A TIME. 
3. Keep your responses concise and conversational.
4. Base your questions on the topic and utilize the "Reference Material" below for technical accuracy.

Reference Material:
{context if context else 'No specific reference material found. Rely on your internal knowledge.'}

Conversation History:
{history_text}

Candidate's Latest Message: {latest_msg}

Interviewer (You):
"""

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(html_path, "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/query")
async def query_rag(request: QueryRequest):
    search_query = f"{request.topic} {request.level} conceptual interview questions" if request.question_number == 1 else f"{request.topic} {request.message}"
    chunks = retrieve(search_query, request.repo_name)
    context = "\n\n---\n\n".join(chunks) if chunks else ""
    
    prompt = build_interviewer_prompt(context, request.topic, request.level, request.history, request.message, request.question_number)
    return StreamingResponse(stream_llama(prompt), media_type="text/plain")