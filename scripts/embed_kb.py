#!/usr/bin/env python3
"""
S1 — KB Semantic Embedder
Reads KB segments from Dify API, embeds via nomic-embed-text (Ollama),
stores in memory_embeddings.embedding_768 for vector search.
Run: python3 scripts/embed_kb.py
"""
import os, sys, json, time, hashlib, subprocess, urllib.request, urllib.parse
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_URL  = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"
PG_HOST, PG_PORT, PG_DB = "localhost", "5432", "coprem_os"
PG_USER = "coprem"

DIFY_API_KEY = os.getenv("DIFY_KB_API_KEY") or os.getenv("DIFY_API_KEY", "")
DIFY_BASE    = "https://api.dify.ai/v1"

# KB datasets to embed: {dataset_id: (pillar, kb_id_label)}
KB_TARGETS = {
    "64329612-bb5d-4090-8fce-e49499d26379": ("JOB",      "KB-04"),
    "044558e7-3203-40ec-be65-5ec6f812e4b0": ("SKILL",    "KB-06"),
    "6b35bc3e-3e47-45d0-8dd4-c9a93629fdf3": ("PERSONAL", "KB-03"),
    "4da3b0fe-49ea-4c12-9273-92045b8f9678": ("JOB",      "KB-02"),
}

def load_env():
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

def embed(text: str) -> list[float]:
    payload = json.dumps({"model": EMBED_MODEL, "input": text}).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/embed",
        data=payload, method="POST",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    return data["embeddings"][0]

def dify_list_documents(dataset_id: str) -> list:
    url = f"{DIFY_BASE}/datasets/{dataset_id}/documents?limit=100"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {os.environ['DIFY_API_KEY']}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get("data", [])

def dify_list_segments(dataset_id: str, doc_id: str) -> list:
    url = f"{DIFY_BASE}/datasets/{dataset_id}/documents/{doc_id}/segments?limit=500"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {os.environ['DIFY_API_KEY']}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get("data", [])
    except Exception as e:
        print(f"  segments error: {e}")
        return []

def get_pg_container() -> str:
    result = subprocess.run(
        ["docker", "ps", "--filter", "name=postgres", "-q"],
        capture_output=True, text=True
    )
    cid = result.stdout.strip().split("\n")[0]
    if not cid:
        raise RuntimeError("Postgres container not found")
    return cid

def pg_upsert(pg_cid: str, content: str, pillar: str, kb_id: str, embedding: list[float]):
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    # Escape single quotes in content
    safe_content = content.replace("'", "''")
    sql = (
        f"INSERT INTO memory_embeddings (content, memory_type, pillar, kb_id, embedding_768) "
        f"VALUES ('{safe_content}', 'kb_segment', '{pillar}', '{kb_id}', '{embedding_str}'::vector) "
        f"ON CONFLICT DO NOTHING;"
    )
    subprocess.run(
        ["docker", "exec", pg_cid, "psql", "-U", PG_USER, "-d", PG_DB, "-c", sql],
        capture_output=True
    )

def main():
    load_env()
    if not DIFY_API_KEY:
        print("ERROR: DIFY_DATASET_KEY not set"); sys.exit(1)

    pg_cid = get_pg_container()
    print(f"Postgres container: {pg_cid[:12]}")

    total = 0
    for dataset_id, (pillar, kb_label) in KB_TARGETS.items():
        print(f"\n[{kb_label}] pillar={pillar} dataset={dataset_id[:8]}...")
        docs = dify_list_documents(dataset_id)
        print(f"  {len(docs)} documents")
        for doc in docs:
            segs = dify_list_segments(dataset_id, doc["id"])
            for seg in segs:
                content = (seg.get("content") or "").strip()
                if len(content) < 20:
                    continue
                vec = embed(content)
                pg_upsert(pg_cid, content, pillar, kb_label, vec)
                total += 1
                if total % 50 == 0:
                    print(f"  Embedded {total} segments so far...")
                time.sleep(0.05)

    print(f"\nDone: {total} segments embedded into memory_embeddings.embedding_768")

if __name__ == "__main__":
    main()
