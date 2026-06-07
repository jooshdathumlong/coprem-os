#!/usr/bin/env python3
"""Deploy WF_ANALYST — Weekly Self-Audit workflow to n8n"""

import json, os, urllib.request, urllib.error

ROOT = os.path.join(os.path.dirname(__file__), '../..')
with open(os.path.join(ROOT, '.env')) as f:
    env = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k] = v

API_KEY = env.get('N8N_API_KEY', '')
BASE = 'http://localhost:5678/api/v1'
TELEGRAM_CRED = 'bekevyLkkiivHo0L'
POSTGRES_CRED = 'rdxzBrj9putuOkku'
CHAT_ID = '7731591925'

def n8n(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {'error': e.read().decode()}

nodes = [
    {
        'id': 'analyst-trigger', 'name': 'Sunday 22:00',
        'type': 'n8n-nodes-base.scheduleTrigger', 'typeVersion': 1.2,
        'position': [200, 300],
        'parameters': {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 22 * * 0'}]}}
    },
    {
        'id': 'analyst-workload', 'name': 'Query Workload + Costs',
        'type': 'n8n-nodes-base.postgres', 'typeVersion': 2.5,
        'position': [420, 300],
        'credentials': {'postgres': {'id': POSTGRES_CRED, 'name': 'Postgres coprem_os'}},
        'parameters': {
            'operation': 'executeQuery',
            'query': """
SELECT
  'workload' as data_type,
  agent_name as label,
  AVG(task_count)::numeric(10,2) as value,
  COUNT(*) as sample_count
FROM agent_workload_log
WHERE snapshot_date >= CURRENT_DATE - 7
GROUP BY agent_name

UNION ALL

SELECT
  'cost' as data_type,
  threshold_status as label,
  AVG(total_spend)::numeric(10,6) as value,
  COUNT(*) as sample_count
FROM finance_daily_costs
WHERE report_date >= CURRENT_DATE - 7
GROUP BY threshold_status

UNION ALL

SELECT
  'qa' as data_type,
  verdict as label,
  COUNT(*)::numeric as value,
  COUNT(*) as sample_count
FROM qa_audit_log
WHERE audit_date >= CURRENT_DATE - 7
GROUP BY verdict

ORDER BY data_type, value DESC;
"""
        }
    },
    {
        'id': 'analyst-research', 'name': 'Query High-Priority Research',
        'type': 'n8n-nodes-base.postgres', 'typeVersion': 2.5,
        'position': [420, 500],
        'credentials': {'postgres': {'id': POSTGRES_CRED, 'name': 'Postgres coprem_os'}},
        'parameters': {
            'operation': 'executeQuery',
            'query': "SELECT topic, summary, feed_type, action_required FROM research_feeds WHERE relevance='HIGH' AND action_required=true AND created_at >= NOW() - INTERVAL '7 days' ORDER BY created_at DESC LIMIT 10;"
        }
    },
    {
        'id': 'analyst-llm', 'name': 'Analyst LLM — Generate Report',
        'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2,
        'position': [680, 300],
        'parameters': {
            'method': 'POST', 'url': 'http://litellm:4000/chat/completions',
            'sendHeaders': True,
            'headerParameters': {'parameters': [
                {'name': 'Content-Type', 'value': 'application/json'},
                {'name': 'Authorization', 'value': 'Bearer sk-1234'}
            ]},
            'sendBody': True, 'specifyBody': 'json',
            'jsonBody': json.dumps({
                "model": "ollama/qwen2.5:3b",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are the Analyst, the Self-Audit Agent for COPREM OS. "
                            "You receive system performance data and produce a weekly improvement report. "
                            "Your job: identify the top 3 improvements ranked by Impact/Effort score (1-5 each). "
                            "Be specific — name which agent should act, what to change, what outcome to expect. "
                            "Output JSON: {health: HEALTHY/DEGRADED/CRITICAL, top_finding: string, proposals: [{score, agent, title, evidence, outcome}]}"
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            "Workload/Cost/QA data: {{ $('Query Workload + Costs').all().map(i=>i.json).slice(0,15) | json }}\n"
                            "High-priority research actions: {{ $('Query High-Priority Research').all().map(i=>i.json) | json }}\n"
                            "Generate the weekly improvement report."
                        )
                    }
                ],
                "max_tokens": 1500
            })
        }
    },
    {
        'id': 'analyst-parse', 'name': 'Parse + Format Report',
        'type': 'n8n-nodes-base.code', 'typeVersion': 2,
        'position': [900, 300],
        'parameters': {'jsCode': (
            "const resp = $input.first().json;\n"
            "const content = resp.choices?.[0]?.message?.content || '{}';\n"
            "const week = new Date().toISOString().split('T')[0];\n"
            "let report;\n"
            "try { report = JSON.parse(content); }\n"
            "catch(e) { report = {health:'DEGRADED', top_finding: content.substring(0,200), proposals:[]}; }\n"
            "const emoji = {HEALTHY:'✅',DEGRADED:'⚠️',CRITICAL:'🔴'}[report.health] || '⚠️';\n"
            "const proposalText = (report.proposals||[]).map((p,i) =>\n"
            "  `${i+1}. [Score ${p.score||'?'}/25] ${p.agent||'?'}: ${p.title||'?'}\\n   ${p.evidence||''}`\n"
            ").join('\\n');\n"
            "const telegramMsg = `🔍 Analyst Weekly — ${week}\\n\\n`+\n"
            "  `${emoji} ${report.health}\\n`+\n"
            "  `Top finding: ${report.top_finding}\\n\\n`+\n"
            "  `Proposals:\\n${proposalText || 'No proposals this week'}`;\n"
            "return [{ json: { week, health: report.health, top_finding: report.top_finding, telegramMsg, proposalCount: (report.proposals||[]).length } }];"
        )}
    },
    {
        'id': 'analyst-send', 'name': 'Send Report to Prem',
        'type': 'n8n-nodes-base.telegram', 'typeVersion': 1.2,
        'position': [1100, 300],
        'credentials': {'telegramApi': {'id': TELEGRAM_CRED, 'name': 'Telegram Bot'}},
        'parameters': {'chatId': CHAT_ID, 'text': '={{ $json.telegramMsg }}'}
    }
]

connections = {
    'Sunday 22:00': {'main': [[
        {'node': 'Query Workload + Costs', 'type': 'main', 'index': 0},
        {'node': 'Query High-Priority Research', 'type': 'main', 'index': 0}
    ]]},
    'Query Workload + Costs': {'main': [[{'node': 'Analyst LLM — Generate Report', 'type': 'main', 'index': 0}]]},
    'Query High-Priority Research': {'main': [[{'node': 'Analyst LLM — Generate Report', 'type': 'main', 'index': 0}]]},
    'Analyst LLM — Generate Report': {'main': [[{'node': 'Parse + Format Report', 'type': 'main', 'index': 0}]]},
    'Parse + Format Report': {'main': [[{'node': 'Send Report to Prem', 'type': 'main', 'index': 0}]]}
}

payload = {
    'name': 'WF_ANALYST — Weekly Self-Audit Report',
    'nodes': nodes, 'connections': connections,
    'settings': {'executionOrder': 'v1'}, 'staticData': None, 'pinData': {}
}

print('=== WF_ANALYST ===')
r = n8n('POST', '/workflows', payload)
if 'error' in r:
    print(f'❌ Import failed: {r["error"][:300]}')
    exit(1)

wf_id = r.get('id')
print(f'✅ Imported — ID: {wf_id}')

r2 = n8n('POST', f'/workflows/{wf_id}/activate')
if 'error' in r2:
    print(f'⚠️  Activate failed: {r2["error"][:200]}')
else:
    print(f'✅ Activated — active: {r2.get("active")}')

print(f'\nWF_ANALYST ID: {wf_id}')
