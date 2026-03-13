"""
Ingestion script — reads all .md files from Rag_mds/, chunks them,
embeds with BAAI/bge-small-en-v1.5, and stores in a persistent ChromaDB.

Usage:
    source venv/bin/activate
    python ingest.py
"""

import os
import glob
import chromadb
from sentence_transformers import SentenceTransformer

# ─── Config ───────────────────────────────────────────────────────────────────

DOCS_DIR        = os.path.join(os.path.dirname(__file__), "..", "Rag_mds")
DB_PATH         = os.path.join(os.path.dirname(__file__), "data", "chroma_db")
COLLECTION_NAME = "codebase"
CHUNK_SIZE      = 1000   # characters per chunk
CHUNK_OVERLAP   = 200    # overlap between consecutive chunks

# ─── Helpers ──────────────────────────────────────────────────────────────────

def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return [c.strip() for c in chunks if c.strip()]


def load_markdown_files(directory: str) -> list[dict]:
    """Return list of {'filename': ..., 'content': ...} for every .md file."""
    docs = []
    pattern = os.path.join(directory, "**", "*.md")
    for filepath in sorted(glob.glob(pattern, recursive=True)):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        docs.append({
            "filename": os.path.basename(filepath),
            "path": filepath,
            "content": content,
        })
    return docs


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"📂  Scanning: {os.path.abspath(DOCS_DIR)}")
    raw_docs = load_markdown_files(DOCS_DIR)
    print(f"📄  Found {len(raw_docs)} markdown files\n")

    if not raw_docs:
        print("⚠️  No .md files found — nothing to ingest.")
        return

    # ── Chunk ──
    all_chunks   = []
    all_metadata = []
    all_ids      = []
    idx = 0
    for doc in raw_docs:
        chunks = chunk_text(doc["content"])
        print(f"  {doc['filename']:30s}  →  {len(chunks)} chunks")
        for chunk in chunks:
            all_chunks.append(chunk)
            all_metadata.append({
                "source": doc["filename"],
                "path": doc["path"],
            })
            all_ids.append(f"chunk_{idx}")
            idx += 1

    print(f"\n🔢  Total chunks: {len(all_chunks)}")

    # ── Embed ──
    print("🧠  Loading embedding model (BAAI/bge-small-en-v1.5)...")
    model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    print("🔄  Generating embeddings...")
    embeddings = model.encode(all_chunks, show_progress_bar=True).tolist()

    # ── Store ──
    print(f"💾  Writing to ChromaDB at: {os.path.abspath(DB_PATH)}")
    os.makedirs(DB_PATH, exist_ok=True)
    client = chromadb.PersistentClient(path=DB_PATH)

    # Delete old collection if it exists, then recreate
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"    (deleted old '{COLLECTION_NAME}' collection)")
    except Exception:
        pass

    collection = client.create_collection(COLLECTION_NAME)

    # ChromaDB accepts batches of max ~5000, but our data is small
    collection.add(
        ids=all_ids,
        documents=all_chunks,
        embeddings=embeddings,
        metadatas=all_metadata,
    )

    print(f"\n✅  Done!  {collection.count()} chunks indexed in collection '{COLLECTION_NAME}'")
    print("    You can now start the server:  uvicorn main:app --reload --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    main()
