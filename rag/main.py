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

app = FastAPI(title="RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

embedder   = SentenceTransformer("BAAI/bge-small-en-v1.5", device="cpu")
db_client  = chromadb.PersistentClient(path=DB_PATH)
collection = None


class QueryRequest(BaseModel):
    query: str
    repo_name: str | None = None


# ─── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    global collection
    try:
        collection = db_client.get_collection(COLLECTION_NAME)
        print(f"[startup] Loaded ChromaDB collection '{COLLECTION_NAME}' "
              f"with {collection.count()} chunks.")
    except Exception as e:
        print(f"[startup] Collection '{COLLECTION_NAME}' not found yet: {e}")
        print("[startup] Run your ingestion script first to populate the DB.")


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


def build_prompt(context: str, user_query: str) -> str:
    return f"""You are an AI assistant helping a user understand a codebase.

Below is retrieved code / documentation from the repository:

{context}

User Question:
{user_query}

Please provide a direct, concise answer based strictly on the context above.
"""


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def get_index():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(html_path, "r") as f:
        return HTMLResponse(content=f.read())


@app.post("/query")
async def query_rag(request: QueryRequest):
    chunks = retrieve(request.query, request.repo_name)
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant context found."
    prompt = build_prompt(context, request.query)
    return StreamingResponse(stream_llama(prompt), media_type="text/plain")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "collection": COLLECTION_NAME,
        "chunks_indexed": collection.count() if collection else 0,
        "model": OLLAMA_MODEL,
    }
