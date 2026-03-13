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

def build_interviewer_prompt(context: str, topics: List[str], level: str, history: List[Message], latest_msg: str, q_num: int, repo_names: List[str]) -> str:
    history_text = ""
    for msg in history:
        role_name = "Interviewer" if msg.role == "assistant" else "Candidate"
        history_text += f"{role_name}: {msg.content}\n"

    topics_str = ", ".join(topics)

    # 1. Define the Phase of the Interview
    if q_num in [1, 2]:
        phase_instruction = f"Ask a general conceptual question about {topics_str} to establish baseline knowledge. Do NOT ask about their repo yet."
    elif q_num in [3, 4, 5]:
        if repo_names:
            phase_instruction = "Transition to the candidate's repository. Using the Reference Material, ask a 'why' or 'how' architectural question about their code. Do not just ask for syntax."
        else:
            phase_instruction = f"Ask an intermediate scenario-based question regarding {topics_str}."
    else:
        phase_instruction = "Ask a more advanced question or an edge-case troubleshooting scenario."

    # 2. Define the State and Evaluation Logic (The "Slope")
    if q_num == 1:
        state = f"Briefly introduce yourself and ask your first question. {phase_instruction}"
    elif q_num <= 7:
        state = f"""EVALUATION & ADAPTATION RULES:
1. If the answer is mostly correct: Give 1 brief sentence of positive feedback, slightly increase the difficulty, and ask the next question.
2. If the answer is partially wrong: Give 1 brief sentence correcting them, maintain or lower the difficulty, and ask the next question.
3. If the answer is completely wrong: DO NOT end the interview. Give a brief correction, drop the difficulty to a fundamental, basic concept, and ask the next question to give them a chance to recover.
4. TERMINATION RULE: ONLY output EXACTLY '[END_INTERVIEW]' if the input is literal gibberish/keyboard mashing, or if they have completely failed the easiest, most basic fallback questions.

NEXT ACTION: Provide your 1-sentence evaluation, then execute this phase: {phase_instruction}"""
    else:
        state = """Evaluate their final answer in 1 sentence.
If the candidate demonstrated acceptable knowledge overall (even if they missed some hard questions but got basics right), output EXACTLY '[LEVEL_UP]'.
If they repeatedly failed basic fundamental questions, output EXACTLY '[END_INTERVIEW]'.
DO NOT ASK ANY MORE QUESTIONS."""

    # 3. Final Prompt Assembly
    return f"""You are a strict but fair senior technical interviewer evaluating a candidate on {topics_str} ({level} level).

CRITICAL RULES:
1. NEVER simulate the candidate's response. Wait for the user.
2. NEVER prefix your questions with "Question X of Y:". Just ask the question directly.
3. Keep feedback extremely brief (1 sentence maximum). Do not lecture.

CURRENT INSTRUCTION:
{state}

Reference Material (Code / Docs retrieved from their repo or subject files):
{context if context else 'No specific reference material found.'}

Conversation History:
{history_text}

Candidate's Latest Message: {latest_msg}

Interviewer (You):
"""