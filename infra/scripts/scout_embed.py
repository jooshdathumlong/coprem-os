#!/usr/bin/env python3
"""
scout_embed.py — Scout pgvector pipeline
Reads services/research/feeds/*.md → parses entries → embeds via Ollama nomic-embed-text
→ stores in research_feeds table with vector embeddings
Run: python3 infra/scripts/scout_embed.py
"""

import os, re, json, sys
import urllib.request
import psycopg2
from datetime import datetime

ROOT = os.path.join(os.path.dirname(__file__), '../..')
FEEDS_DIR = os.path.join(ROOT, 'services/research/feeds')
OLLAMA_URL = 'http://localhost:11434/api/embeddings'
EMBED_MODEL = 'nomic-embed-text'

# Load env
env = {}
with open(os.path.join(ROOT, '.env')) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k] = v

PG_PASS = env.get('POSTGRES_PASSWORD', '')
PG_DSN = f"host=localhost port=5432 dbname=coprem_os user=coprem password={PG_PASS}"

FEED_TYPE_MAP = {
    'market_intel.md': 'market_intel',
    'tech_updates.md': 'tech_updates',
    'competitor_watch.md': 'competitor_watch',
    'opportunities.md': 'opportunities',
    'regulatory.md': 'regulatory',
}

def get_embedding(text):
    payload = json.dumps({"model": EMBED_MODEL, "prompt": text}).encode()
    req = urllib.request.Request(OLLAMA_URL, data=payload,
        headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get('embedding', [])
    except Exception as e:
        print(f'  ⚠️  Embedding failed: {e}')
        return None

def parse_feed_entries(content, feed_type):
    """Parse feed markdown into structured entries."""
    entries = []
    # Match blocks between --- separators
    blocks = re.split(r'\n---\n', content)
    for block in blocks:
        block = block.strip()
        if not block or block.startswith('#') or 'INIT' in block:
            continue
        # Parse header: [DATE] [SOURCE: X] [RELEVANCE: Y]
        date_m = re.search(r'\[(\d{4}-\d{2}-\d{2})\]', block)
        source_m = re.search(r'\[SOURCE:\s*([^\]]+)\]', block, re.IGNORECASE)
        rel_m = re.search(r'\[RELEVANCE:\s*(HIGH|MED|LOW)\]', block, re.IGNORECASE)
        topic_m = re.search(r'\*\*Topic:\*\*\s*(.+)', block)
        summary_m = re.search(r'\*\*Summary:\*\*\s*(.+)', block)
        impact_m = re.search(r'\*\*Impact[^:]*:\*\*\s*(.+)', block)
        action_m = re.search(r'\*\*Action Required:\*\*\s*(Yes|No)', block, re.IGNORECASE)

        if not (date_m and topic_m and summary_m):
            continue

        entries.append({
            'feed_type': feed_type,
            'entry_date': date_m.group(1),
            'source': source_m.group(1).strip() if source_m else None,
            'relevance': rel_m.group(1).upper() if rel_m else 'LOW',
            'topic': topic_m.group(1).strip(),
            'summary': summary_m.group(1).strip(),
            'impact': impact_m.group(1).strip() if impact_m else None,
            'action_required': action_m and action_m.group(1).lower() == 'yes',
        })
    return entries

def run():
    print(f'Scout Embed Pipeline — {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print(f'Feeds dir: {FEEDS_DIR}')

    conn = psycopg2.connect(PG_DSN)
    cur = conn.cursor()

    total_new = 0
    total_skipped = 0

    for filename, feed_type in FEED_TYPE_MAP.items():
        path = os.path.join(FEEDS_DIR, filename)
        if not os.path.exists(path):
            print(f'  ⚠️  {filename} not found — skipping')
            continue

        with open(path) as f:
            content = f.read()

        entries = parse_feed_entries(content, feed_type)
        print(f'\n{filename}: {len(entries)} entries found')

        for entry in entries:
            # Check if already embedded (dedup by feed_type + entry_date + topic)
            cur.execute(
                "SELECT id FROM research_feeds WHERE feed_type=%s AND entry_date=%s AND topic=%s LIMIT 1",
                (entry['feed_type'], entry['entry_date'], entry['topic'])
            )
            if cur.fetchone():
                total_skipped += 1
                continue

            # Get embedding
            embed_text = f"{entry['topic']} {entry['summary']}"
            embedding = get_embedding(embed_text)

            # Insert
            cur.execute("""
                INSERT INTO research_feeds
                    (feed_type, entry_date, source, relevance, topic, summary, impact, action_required, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::vector)
            """, (
                entry['feed_type'], entry['entry_date'], entry['source'],
                entry['relevance'], entry['topic'], entry['summary'],
                entry['impact'], entry['action_required'],
                str(embedding) if embedding else None
            ))
            conn.commit()
            total_new += 1
            print(f'  ✅ [{entry["relevance"]}] {entry["topic"][:60]}')

    cur.close()
    conn.close()
    print(f'\nDone — {total_new} new entries embedded, {total_skipped} skipped (already in DB)')

if __name__ == '__main__':
    run()
