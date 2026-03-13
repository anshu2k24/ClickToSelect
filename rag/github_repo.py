import os
from git import Repo

# Configurations
ALLOWED_EXTENSIONS = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".rs", ".kt"]
EXCLUDED_DIRS = ["node_modules", ".git", "dist", "build", "__pycache__"]
REPO_DIR = os.path.join(os.path.dirname(__file__), "data", "repos")

os.makedirs(REPO_DIR, exist_ok=True)

def clone_repository(repo_url: str):
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    repo_path = os.path.join(REPO_DIR, repo_name)

    if os.path.exists(repo_path):
        print(f"[INFO] Repo already exists: {repo_path}")
        return repo_path, repo_name

    print(f"[INFO] Cloning {repo_url}...")
    Repo.clone_from(repo_url, repo_path)
    print("[INFO] Clone complete.")
    return repo_path, repo_name

def should_ignore(path):
    return any(excluded in path for excluded in EXCLUDED_DIRS)

def read_files(repo_path):
    documents = []
    for root, dirs, files in os.walk(repo_path):
        if should_ignore(root):
            continue
        for file in files:
            if any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        documents.append({"content": content, "file_path": full_path})
                except:
                    continue
    return documents

def chunk_text(text, chunk_size=1200, overlap=200):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def chunk_documents(documents):
    all_chunks = []
    for doc in documents:
        chunks = chunk_text(doc["content"])
        for chunk in chunks:
            all_chunks.append({"text": chunk, "file_path": doc["file_path"]})
    return all_chunks

def embed_and_store(chunks, repo_name, collection, embedder):
    if not chunks:
        return
    texts = [c["text"] for c in chunks]
    metadatas = [{"file_path": c["file_path"], "repo": repo_name} for c in chunks]
    ids = [f"{repo_name}_{i}" for i in range(len(texts))]

    print(f"[INFO] Generating embeddings for {repo_name}...")
    embeddings = embedder.encode(texts, show_progress_bar=False)

    collection.add(
        documents=texts,
        embeddings=embeddings.tolist(),
        metadatas=metadatas,
        ids=ids
    )
    print(f"[INFO] Stored {len(texts)} chunks in Chroma for {repo_name}.")