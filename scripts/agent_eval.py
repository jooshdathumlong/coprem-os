#!/usr/bin/env python3
"""COPREM Agent Eval Script — วัด performance ของ agents จาก audit_log + query_log"""

import sys
import json
import subprocess
from datetime import datetime, timedelta, timezone

CONTAINER = "03-system-postgres-1"
DB_USER = "coprem"
DB_NAME = "coprem_os"

PERIOD_DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 7


def query(sql, params=None):
    if params:
        for p in params:
            if isinstance(p, datetime):
                sql = sql.replace("%s", f"'{p.isoformat()}'", 1)
            else:
                sql = sql.replace("%s", f"'{p}'", 1)
    cmd = ["docker", "exec", CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME,
           "-t", "-A", "-F", "\t", "-c", sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    rows = [r.split("\t") for r in result.stdout.strip().split("\n") if r.strip()]
    return rows


def section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)


def run():
    since = datetime.now(timezone.utc) - timedelta(days=PERIOD_DAYS)
    since_str = since.isoformat()
    print(f"\nCOPREM Agent Eval Report")
    print(f"Period: last {PERIOD_DAYS} days (since {since.strftime('%Y-%m-%d')})")

    # 1. Message throughput
    section("1. Message Throughput")
    rows = query(f"""
        SELECT
            COUNT(*) FILTER (WHERE event_type='WEBHOOK_RECEIVED'),
            COUNT(*) FILTER (WHERE event_type='WEBHOOK_REJECTED'),
            COUNT(*) FILTER (WHERE event_type='AGENT_CALLED'),
            COUNT(*) FILTER (WHERE event_type='AGENT_OUTPUT'),
            COUNT(*) FILTER (WHERE event_type='HITL_REQUIRED')
        FROM audit_log WHERE timestamp >= '{since_str}'
    """)
    received, rejected, called, output, hitl = [int(x or 0) for x in rows[0]]
    delivery_rate = (output / received * 100) if received > 0 else 0
    print(f"  Received      : {received}")
    print(f"  Rejected      : {rejected}")
    print(f"  Agent Called  : {called}")
    print(f"  Agent Output  : {output}")
    print(f"  HITL Required : {hitl}")
    print(f"  Delivery Rate : {delivery_rate:.1f}%")

    # 2. Response latency
    section("2. Response Latency (WEBHOOK → AGENT_OUTPUT)")
    rows = query(f"""
        SELECT
            ROUND(AVG(EXTRACT(EPOCH FROM (o.timestamp - i.timestamp)))::numeric, 2),
            ROUND(MIN(EXTRACT(EPOCH FROM (o.timestamp - i.timestamp)))::numeric, 2),
            ROUND(MAX(EXTRACT(EPOCH FROM (o.timestamp - i.timestamp)))::numeric, 2),
            COUNT(*)
        FROM audit_log i
        JOIN audit_log o ON
            o.event_type = 'AGENT_OUTPUT'
            AND o.timestamp > i.timestamp
            AND o.timestamp < i.timestamp + interval '2 minutes'
        WHERE i.event_type = 'WEBHOOK_RECEIVED'
          AND i.timestamp >= '{since_str}'
    """)
    avg_s = None
    if rows and rows[0][0] not in ('', None):
        avg_s, min_s, max_s, pairs = rows[0]
        avg_s = float(avg_s) if avg_s else None
        slo_ok = "✅" if avg_s and avg_s < 10 else "❌"
        print(f"  Avg latency : {avg_s}s {slo_ok} (SLO <10s)")
        print(f"  Min / Max   : {min_s}s / {max_s}s")
        print(f"  Pairs found : {pairs}")
    else:
        print("  No data")

    # 3. Error rate
    section("3. Failed Tasks")
    rows = query(f"""
        SELECT COUNT(*), COUNT(*) FILTER (WHERE retry_count >= 3)
        FROM failed_tasks_db WHERE created_at >= '{since_str}'
    """)
    if rows and rows[0][0]:
        failed, quarantined = int(rows[0][0] or 0), int(rows[0][1] or 0)
        print(f"  Failed tasks : {failed}")
        print(f"  Quarantined  : {quarantined}")
    else:
        print("  No data")

    # 4. KB retrieval quality
    section("4. KB Retrieval Quality")
    rows = query(f"""
        SELECT COUNT(*),
               ROUND(AVG(relevance_score)::numeric, 3),
               COUNT(*) FILTER (WHERE relevance_score >= 0.7),
               COUNT(*) FILTER (WHERE relevance_score < 0.4)
        FROM query_log WHERE queried_at >= '{since_str}'
    """)
    if rows and rows[0][0] and rows[0][0] != '0':
        total, avg_rel, high, low = rows[0]
        avg_rel = float(avg_rel) if avg_rel else 0
        slo_ok = "✅" if avg_rel >= 0.7 else "⚠️"
        print(f"  Total queries : {total}")
        print(f"  Avg relevance : {avg_rel} {slo_ok} (SLO ≥0.7)")
        print(f"  High (≥0.7)   : {high}")
        print(f"  Low  (<0.4)   : {low}")
    else:
        print("  No queries yet")

    # 5. HITL rate
    section("5. HITL Rate")
    if received > 0:
        hitl_rate = hitl / received * 100
        slo_ok = "✅" if hitl_rate < 20 else "⚠️"
        print(f"  HITL Rate : {hitl_rate:.1f}% {slo_ok} (SLO <20%)")
    else:
        print("  No data")

    # 6. Event breakdown
    section("6. Event Breakdown")
    rows = query(f"""
        SELECT event_type, COUNT(*) FROM audit_log
        WHERE timestamp >= '{since_str}'
        GROUP BY event_type ORDER BY COUNT(*) DESC
    """)
    for row in rows:
        if row[0]:
            print(f"  {row[0]:<25} {row[1]}")

    # SLO Summary
    section("SLO Summary")
    checks = [
        ("Delivery Rate ≥90%", delivery_rate >= 90),
        ("Avg Latency <10s", avg_s is not None and avg_s < 10),
        ("HITL Rate <20%", received > 0 and (hitl / received * 100) < 20),
    ]
    all_pass = True
    for label, passed in checks:
        icon = "✅" if passed else "❌"
        if not passed:
            all_pass = False
        print(f"  {icon} {label}")
    print(f"\n  Overall: {'✅ PASS' if all_pass else '⚠️  REVIEW NEEDED'}")
    print()


if __name__ == "__main__":
    run()
