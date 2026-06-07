#!/usr/bin/env python3
"""
Coprem KB Embedder v2 — Local Files → pgvector
Sources:
  - 02-knowledge/courses/    (KB-COURSE)  pillar=SKILL
  - 02-knowledge/personal/   (KB-PERSONAL) pillar=PERSONAL
  - 02-knowledge/work/       (KB-WORK)     pillar=JOB
  - 01-projects/             (KB-PROJECT)  pillar=PERSONAL
Embedding: Gemini text-embedding-004 (768 dims) via Google API
"""
import os, sys, json, time, hashlib, subprocess, urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200
PG_CONTAINER = "03-system-postgres-1"
PG_USER = "coprem"
PG_DB = "coprem_os"
BATCH = 20
OLLAMA_URL = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"
TRANSLATE_MODEL = "scb10x/typhoon-translate1.5-4b:latest"

SOURCES = [
    (ROOT / "02-knowledge/courses",  "SKILL",    "KB-COURSE"),
    (ROOT / "02-knowledge/personal", "PERSONAL", "KB-PERSONAL"),
    (ROOT / "02-knowledge/work",     "JOB",      "KB-WORK"),
    (ROOT / "01-projects",           "PERSONAL", "KB-PROJECT"),
]

def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

def get_api_keys() -> list[str]:
    return []  # not used — Ollama is local

def translate_to_english(text: str) -> str:
    """Translate text to English using typhoon-translate. Falls back to original if error."""
    try:
        payload = json.dumps({
            "model": TRANSLATE_MODEL,
            "messages": [{"role": "user", "content": f"Translate to English:\n{text[:1200]}"}],
            "stream": False,
        }).encode()
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/chat", data=payload, method="POST",
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.loads(r.read())
        result = data.get("message", {}).get("content", "").strip()
        return result if result else text
    except Exception:
        return text

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed via Ollama nomic-embed-text — local, no rate limit."""
    results = []
    for text in texts:
        payload = json.dumps({"model": EMBED_MODEL, "input": text}).encode()
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/embed", data=payload, method="POST",
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
        results.append(data["embeddings"][0])
    return results

def clean_text(text: str) -> str:
    return text.replace('\x00', '').encode('utf-8', 'ignore').decode('utf-8')

def chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end].strip())
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c for c in chunks if len(c) > 100]

def content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

def pg_exists(pg_cid: str, h: str) -> bool:
    sql = f"SELECT 1 FROM memory_embeddings WHERE tags @> ARRAY['{h}'] LIMIT 1;"
    r = subprocess.run(["docker", "exec", pg_cid, "psql", "-U", PG_USER, "-d", PG_DB,
                        "-t", "-c", sql], capture_output=True, text=True)
    return "1" in r.stdout

def pg_insert(pg_cid: str, content: str, pillar: str, kb_id: str, fname: str,
              embedding: list[float], h: str):
    vec = "[" + ",".join(f"{x:.6f}" for x in embedding) + "]"
    safe = lambda s: s.replace("'", "''")
    sql = (f"INSERT INTO memory_embeddings (content, memory_type, pillar, kb_id, tags, embedding) "
           f"VALUES ('{safe(content)}', 'kb_segment', '{safe(pillar)}', '{safe(kb_id)}', "
           f"ARRAY['{safe(fname)}','{h}'], '{vec}'::vector) ON CONFLICT DO NOTHING;")
    r = subprocess.run(["docker", "exec", pg_cid, "psql", "-U", PG_USER, "-d", PG_DB,
                        "-c", sql], capture_output=True, text=True)
    return r.returncode == 0 and "ERROR" not in r.stderr

def main():
    load_env()
    pg_cid = subprocess.run(["docker", "ps", "--filter", "name=postgres", "-q"],
                             capture_output=True, text=True).stdout.strip().split("\n")[0]
    print(f"Postgres: {pg_cid[:12]}")

    total = skipped = errors = 0

    for source_dir, pillar, kb_id in SOURCES:
        if not source_dir.exists():
            continue
        files = sorted(source_dir.glob("**/*.md")) + sorted(source_dir.glob("**/*.txt"))
        print(f"\n[{kb_id}] {len(files)} files in {source_dir.name}/")

        batch_chunks, batch_meta = [], []

        def flush_batch():
            nonlocal total, errors
            if not batch_chunks:
                return
            try:
                vecs = embed_texts(batch_chunks)
                for chunk, vec, (pl, ki, fn, h) in zip(batch_chunks, vecs, batch_meta):
                    ok = pg_insert(pg_cid, chunk, pl, ki, fn, vec, h)
                    if ok:
                        total += 1
                    else:
                        errors += 1
            except Exception as e:
                print(f"\n  batch error: {e}")
                errors += len(batch_chunks)
            batch_chunks.clear()
            batch_meta.clear()

        for f in files:
            try:
                text = clean_text(f.read_text(errors="ignore").strip())
            except Exception:
                continue
            if len(text) < 50:
                continue
            for chunk in chunk_text(text):
                h = content_hash(chunk)
                if pg_exists(pg_cid, h):
                    skipped += 1
                    continue
                batch_chunks.append(chunk)
                batch_meta.append((pillar, kb_id, f.name, h))
                if len(batch_chunks) >= BATCH:
                    flush_batch()
                    print(f"  embedded {total} | skipped {skipped} | errors {errors}", end="\r")

        flush_batch()

    print(f"\n\nDone — embedded: {total} | skipped (already exists): {skipped} | errors: {errors}")

if __name__ == "__main__":
    main()
