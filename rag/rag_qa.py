import json
import requests
from pydantic import BaseModel
from typing import List, Optional

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.1"
TOP_K = 4

class Message(BaseModel):
    role: str
    content: str

def retrieve(query: str, repo_names: Optional[List[str]], collection, embedder) -> list[str]:
    query_embedding = embedder.encode([query]).tolist()
    kwargs = {"query_embeddings": query_embedding, "n_results": TOP_K}
    
    if repo_names:
        if len(repo_names) == 1:
            kwargs["where"] = {"repo": repo_names[0]}
        else:
            kwargs["where"] = {"repo": {"$in": repo_names}}
    
    results = collection.query(**kwargs)
    return results["documents"][0] if results["documents"] else []

# ─── STREAMING (Used by old Chat UI) ──────────────────────────────────────────
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

# ─── JSON GENERATION (Used by new Verification API) ───────────────────────────
def generate_json_llama(prompt: str) -> dict:
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL, 
                "prompt": prompt, 
                "stream": False,
                "format": "json" # Forces LLaMA 3.1 to output strict JSON
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        return json.loads(data["response"])
    except Exception as e:
        print(f"Error generating JSON: {e}")
        return {}

# ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

def build_interviewer_prompt(context: str, topics: List[str], level: str, history: List[Message], latest_msg: str, q_num: int, repo_names: List[str]) -> str:
    # Old Streaming UI Prompt (Unchanged to prevent breaking existing features)
    history_text = ""
    for msg in history:
        role_name = "Interviewer" if msg.role == "assistant" else "Candidate"
        history_text += f"{role_name}: {msg.content}\n"

    topics_str = ", ".join(topics)
    if q_num in [1, 2]:
        phase_instruction = f"Ask a general conceptual question about {topics_str} to establish baseline knowledge."
    elif q_num in [3, 4, 5]:
        phase_instruction = "Transition to the candidate's repository (if any). Ask a 'why' or 'how' architectural question about their code."
    else:
        phase_instruction = "Ask a more advanced question or an edge-case scenario."

    if q_num == 1:
        state = f"Briefly introduce yourself and ask your first question. {phase_instruction}"
    elif q_num <= 7:
        state = f"""EVALUATION RULES: 1. Give 1 brief sentence of feedback. 2. Drop difficulty if they fail, raise if they pass. NEXT ACTION: {phase_instruction}"""
    else:
        state = "Evaluate their final answer in 1 sentence. Output EXACTLY '[LEVEL_UP]' if good, or '[END_INTERVIEW]' if bad."

    return f"""You are a strict but fair technical interviewer on {topics_str} ({level} level).
CRITICAL RULES:
1. NEVER simulate the candidate's response.
2. Keep feedback extremely brief.
CURRENT INSTRUCTION:
{state}
Reference Material: {context if context else 'None'}
Conversation History: {history_text}
Candidate's Latest Message: {latest_msg}
Interviewer (You):
"""

def build_json_question_prompt(context: str, skill: str, level: str, history: List[dict]) -> str:
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    return f"""You are an AI technical interviewer evaluating a candidate on {skill} at the {level} level.
Based on the conversation history, generate the NEXT single interview question. 
Reference Material: {context if context else 'None'}
History: {history_text}

You must return your response STRICTLY as a JSON object in this exact format:
{{
    "question": "Your question text goes here"
}}
"""

def build_json_eval_prompt(context: str, skill: str, level: str, history: List[dict]) -> str:
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    return f"""You are an AI technical interviewer evaluating a candidate on {skill} at the {level} level.
Review the candidate's latest answer in the history below.
History: {history_text}

Provide a score out of 100 based on their accuracy. 
Based on their performance, decide if they should be placed at the "Beginner", "Intermediate", or "Advanced" level.
You must return your response STRICTLY as a JSON object in this exact format:
{{
    "score": <number between 0 and 100>,
    "level": "<Beginner or Intermediate or Advanced>"
}}
"""