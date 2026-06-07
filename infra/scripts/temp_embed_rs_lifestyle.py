#!/usr/bin/env python3
"""Embed rs_lifestyle summary data into memory_embeddings for L3 semantic search."""
import json, subprocess, urllib.request
from datetime import datetime

OLLAMA_URL = "http://localhost:11434"
EMBED_MODEL = "nomic-embed-text"
CONTAINER = "03-system-postgres-1"

def embed(text):
    payload = json.dumps({"model": EMBED_MODEL, "input": text}).encode()
    req = urllib.request.Request(f"{OLLAMA_URL}/api/embed", data=payload,
                                  method="POST", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["embeddings"][0]

def pg(sql, db="coprem_os"):
    r = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", "coprem", "-d", db, "-t", "-q"],
                       input=sql.encode(), capture_output=True, timeout=30)
    return r.stdout.decode().strip()

def upsert(content, pillar, kb_id):
    vec = embed(content)
    vec_str = "[" + ",".join(str(v) for v in vec) + "]"
    safe = content.replace("'", "''")
    sql = f"""
INSERT INTO memory_embeddings (content, memory_type, pillar, kb_id, embedding_768)
VALUES ('{safe}', 'kb_segment', '{pillar}', '{kb_id}', '{vec_str}'::vector)
ON CONFLICT DO NOTHING;
"""
    pg(sql)
    return len(vec)

# ── Build text summaries from rs_lifestyle DB ─────────────────
def get_summaries():
    segments = []

    # 1. KOL summary
    r = pg("""
SELECT COUNT(*) as total,
       COUNT(cost_thb) as with_cost,
       SUM(cost_thb) as total_budget,
       ROUND(AVG(cost_thb),0) as avg_cost
FROM rs_lifestyle.kol_list;
""", db="coprem")
    parts = [x.strip() for x in r.split("|")]
    if len(parts) >= 4:
        total, with_cost, budget, avg = parts
        segments.append((
            f"ข้อมูล KOL Batiste (Native Jump 2026)\n"
            f"- KOL ทั้งหมด: {total} คน\n"
            f"- มีข้อมูลค่าจ้าง: {with_cost} คน\n"
            f"- งบ KOL รวม: {budget} THB\n"
            f"- ค่าจ้างเฉลี่ย: {avg} THB/คน\n"
            f"- ช่องทาง: TikTok (Nano influencer 1,000-7,000 followers)\n"
            f"- Content type: 1x VDO on TikTok, 1-1.30 mins",
            "JOB", "KB-RS-KOL"
        ))

    # 2. Sales summary
    r = pg("""
SELECT event_name,
       COUNT(*) as txn,
       SUM(sold_price) as revenue,
       MIN(sale_date)::text as from_date,
       MAX(sale_date)::text as to_date
FROM rs_lifestyle.sales_transactions
GROUP BY event_name;
""", db="coprem")
    for line in r.split("\n"):
        p = [x.strip() for x in line.split("|")]
        if len(p) >= 5 and p[0]:
            segments.append((
                f"ยอดขาย {p[0]}\n"
                f"- จำนวน transactions: {p[1]} รายการ\n"
                f"- ยอดขายรวม: {p[2]} THB\n"
                f"- ช่วงวันที่: {p[3]} ถึง {p[4]}\n"
                f"- สินค้า: Scrub Daddy / Scrub Mommy\n"
                f"- ช่องทาง: Central / The Mall (EmQuartier)",
                "JOB", "KB-RS-SALES"
            ))

    # 3. Products Batiste
    r = pg("""
SELECT name_en, retail_price_thb, wholesale_consignment_thb, wholesale_outright_thb, gp_consignment, gp_outright
FROM rs_lifestyle.products p
JOIN rs_lifestyle.brands b ON p.brand_id = b.id
WHERE b.name = 'Batiste';
""", db="coprem")
    lines = [l for l in r.split("\n") if l.strip() and "|" in l]
    if lines:
        prod_text = "ราคาสินค้า Batiste Dry Shampoo\n"
        for l in lines:
            p = [x.strip() for x in l.split("|")]
            if len(p) >= 6:
                prod_text += f"- {p[0]}: Retail {p[1]} THB | Consignment {p[2]} THB (GP 30%) | Outright {p[3]} THB (GP 40%)\n"
        segments.append((prod_text, "JOB", "KB-RS-PRODUCTS"))

    # 4. Trade conditions summary
    r = pg("""
SELECT c.name as channel, tc.subject, tc.expense_rate
FROM rs_lifestyle.trade_conditions tc
JOIN rs_lifestyle.channels c ON tc.channel_id = c.id
WHERE tc.expense_rate IS NOT NULL
ORDER BY tc.expense_rate DESC
LIMIT 10;
""", db="coprem")
    lines = [l for l in r.split("\n") if l.strip() and "|" in l]
    if lines:
        trade_text = "เงื่อนไขทางการค้า (Trade Conditions) Scrub Daddy — Central Department 2026\n"
        for l in lines:
            p = [x.strip() for x in l.split("|")]
            if len(p) >= 3:
                pct = float(p[2]) * 100 if p[2] else 0
                trade_text += f"- {p[1]}: {pct:.1f}%\n"
        segments.append((trade_text, "JOB", "KB-RS-TRADE"))

    # 5. Brand overview
    segments.append((
        "บริษัท Royal Shammi Co., Ltd.\n"
        "- สินค้าหลัก: Batiste Dry Shampoo (Hair Care) + Scrub Daddy (Household Cleaning)\n"
        "- ช่องทาง Online: TikTok, Facebook, Instagram, Lazada, Shopee, LINE OA\n"
        "- ช่องทาง Offline: Watsons, Villa Market, Big C, Central/The Mall, Tops, Foodland\n"
        "- KOL strategy: Nano influencer TikTok ผ่าน Native Jump agency\n"
        "- MKT budget 2026: ~1,000,000 THB (KOL + Ads + Content + Affiliate + Event)",
        "JOB", "KB-RS-BRAND"
    ))

    return segments

def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Embedding rs_lifestyle summaries...")

    # Clear old rs-lifestyle embeddings first
    pg("DELETE FROM memory_embeddings WHERE kb_id ILIKE 'KB-RS-%';")
    print("  Cleared old KB-RS-* segments")

    summaries = get_summaries()
    print(f"  {len(summaries)} segments to embed")

    for i, (content, pillar, kb_id) in enumerate(summaries):
        upsert(content, pillar, kb_id)
        print(f"  ✅ [{i+1}/{len(summaries)}] {kb_id} ({len(content)} chars)")

    # Verify
    count = pg("SELECT COUNT(*) FROM memory_embeddings WHERE kb_id ILIKE 'KB-RS-%';")
    print(f"\n✅ Done — {count.strip()} KB-RS-* segments in memory_embeddings")

if __name__ == "__main__":
    try:
        main()
    finally:
        pass
