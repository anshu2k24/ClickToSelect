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
    # Build conversation history
    history_text = ""
    for msg in history:
        role_name = "Interviewer" if msg.role == "assistant" else "Candidate"
        history_text += f"{role_name}: {msg.content}\n"

    topics_str = ", ".join(topics)
    repos_str = ", ".join(repo_names) if repo_names else "None"

    # Context directive
    repo_directive = f"Use their GitHub repos ({repos_str}) as context. Ask WHY they implemented things a certain way or HOW it scales. Do not just ask for syntax." if repo_names else f"Focus on deep conceptual questions for {topics_str}."

    # Strict State Machine for the LLM
    if q_num == 1:
        action = f"Introduce yourself briefly and ask your very first question. {repo_directive}"
    elif q_num <= 7:
        action = f"""1. Evaluate the Candidate's Latest Message.
- IF the message is gibberish (e.g., "xfgsdxgsdg"), keyboard mashing, "I don't know", or fundamentally wrong: Output EXACTLY '[END_INTERVIEW]' and nothing else. Stop immediately.
- IF the message is acceptable: Provide a maximum 1-sentence evaluation. Then, ask your next technical question. {repo_directive}"""
    else:
        action = """1. Evaluate the Candidate's Latest Message in exactly 1 sentence.
2. Output EXACTLY '[LEVEL_UP]' if they demonstrated strong knowledge overall. Output EXACTLY '[END_INTERVIEW]' if their overall performance was weak.
DO NOT ASK ANY MORE QUESTIONS."""

    # Final Prompt Assembly
    return f"""You are a strict, senior technical interviewer evaluating a candidate for a {level} role in {topics_str}.

CRITICAL RULES:
1. NEVER simulate the candidate's response. Wait for the user.
2. NEVER prefix your questions with "Question 2 of 7:" or similar numbering. Just ask the question directly.
3. Keep feedback extremely brief (1 sentence maximum).

CURRENT INSTRUCTION:
{action}

Reference Material:
{context if context else 'No specific reference material found.'}

Conversation History:
{history_text}

Candidate's Latest Message: {latest_msg}

Interviewer (You):
"""