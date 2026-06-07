#!/usr/bin/env python3
"""Import and activate Phase 2 workflows: WF_SCOUT, WF_REX, WF_VERA"""

import json, os, sys, urllib.request, urllib.error

# Config
with open(os.path.join(os.path.dirname(__file__), '../../.env')) as f:
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
        err = e.read().decode()
        return {'error': err}

def tg_node(node_id, name, x, y, text):
    return {
        'id': node_id, 'name': name,
        'type': 'n8n-nodes-base.telegram', 'typeVersion': 1.2,
        'position': [x, y],
        'credentials': {'telegramApi': {'id': TELEGRAM_CRED, 'name': 'Telegram Bot'}},
        'parameters': {'chatId': CHAT_ID, 'text': text}
    }

def import_activate(name, nodes, connections):
    payload = {
        'name': name, 'nodes': nodes, 'connections': connections,
        'settings': {'executionOrder': 'v1'}, 'staticData': None, 'pinData': {}
    }
    r = n8n('POST', '/workflows', payload)
    if 'error' in r:
        print(f'❌ {name} import failed: {r["error"][:200]}')
        return None
    wf_id = r.get('id')
    print(f'✅ {name} imported — ID: {wf_id}')
    r2 = n8n('POST', f'/workflows/{wf_id}/activate')
    if 'error' in r2:
        print(f'⚠️  {name} activate failed: {r2["error"][:200]}')
    else:
        print(f'✅ {name} activated — active: {r2.get("active")}')
    return wf_id


# ── WF_SCOUT ─────────────────────────────────────────────────────────────────
scout_nodes = [
    {
        'id': 'scout-trigger', 'name': 'Daily 07:00',
        'type': 'n8n-nodes-base.scheduleTrigger', 'typeVersion': 1.2,
        'position': [200, 300],
        'parameters': {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 7 * * *'}]}}
    },
    {
        'id': 'scout-llm', 'name': 'Scout LLM Research',
        'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2,
        'position': [420, 300],
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
                    {"role": "system", "content": "You are Scout, Research Intelligence Agent for COPREM OS. Research today's top 5 relevant updates for Thai e-commerce/beauty brand business. Topics: Thailand beauty/haircare market, TikTok/Shopee platform updates, AI/LLM tech news, competitor brand activity. Return a JSON array. Each item: {topic, summary, source, relevance: HIGH/MED/LOW, impact_on_coprem, action_required: boolean}."},
                    {"role": "user", "content": "Return findings as JSON array only."}
                ],
                "max_tokens": 1500
            })
        }
    },
    {
        'id': 'scout-parse', 'name': 'Parse Findings',
        'type': 'n8n-nodes-base.code', 'typeVersion': 2,
        'position': [640, 300],
        'parameters': {'jsCode': (
            "const response = $input.first().json;\n"
            "const content = response.choices?.[0]?.message?.content || '[]';\n"
            "const today = new Date().toISOString().split('T')[0];\n"
            "let findings = [];\n"
            "try { findings = JSON.parse(content); if (!Array.isArray(findings)) findings = [findings]; }\n"
            "catch(e) { findings = [{topic:'Parse Error', summary: content.substring(0,200), relevance:'LOW', action_required:false, source:'system', impact_on_coprem:'none'}]; }\n"
            "const highFindings = findings.filter(f => f.relevance === 'HIGH');\n"
            "const feedEntry = findings.map(f =>\n"
            "  '---\\n['+today+'] [SOURCE: '+(f.source||'AI Research')+'] [RELEVANCE: '+f.relevance+']\\n'"
            "  +'**Topic:** '+f.topic+'\\n**Summary:** '+f.summary+'\\n'"
            "  +'**Impact on Coprem:** '+(f.impact_on_coprem||'None')+'\\n'"
            "  +'**Action Required:** '+(f.action_required?'Yes':'No')+'\\n---'\n"
            ").join('\\n');\n"
            "return [{ json: { date: today, findings, highCount: highFindings.length, highFindings, feedEntry } }];"
        )}
    },
    {
        'id': 'scout-check', 'name': 'Any HIGH?',
        'type': 'n8n-nodes-base.if', 'typeVersion': 2,
        'position': [860, 300],
        'parameters': {'conditions': {'conditions': [
            {'id': 'c1', 'leftValue': '={{ $json.highCount }}', 'rightValue': 0,
             'operator': {'type': 'number', 'operation': 'gt'}}
        ]}}
    },
    tg_node('scout-alert', 'Alert — HIGH Finding', 1080, 200,
        '=🔍 Scout Alert — {{ $json.date }}\n\n'
        '{{ $json.highFindings.map(f => "🔴 " + f.topic + "\\n" + f.summary).join("\\n\\n") }}\n\n'
        'Full feed: services/research/feeds/market_intel.md'),
    {
        'id': 'scout-noop', 'name': 'No Alert',
        'type': 'n8n-nodes-base.noOp', 'typeVersion': 1,
        'position': [1080, 420], 'parameters': {}
    }
]

scout_connections = {
    'Daily 07:00': {'main': [[{'node': 'Scout LLM Research', 'type': 'main', 'index': 0}]]},
    'Scout LLM Research': {'main': [[{'node': 'Parse Findings', 'type': 'main', 'index': 0}]]},
    'Parse Findings': {'main': [[{'node': 'Any HIGH?', 'type': 'main', 'index': 0}]]},
    'Any HIGH?': {'main': [
        [{'node': 'Alert — HIGH Finding', 'type': 'main', 'index': 0}],
        [{'node': 'No Alert', 'type': 'main', 'index': 0}]
    ]}
}


# ── WF_REX ────────────────────────────────────────────────────────────────────
rex_nodes = [
    {
        'id': 'rex-trigger', 'name': 'Nightly 23:00',
        'type': 'n8n-nodes-base.scheduleTrigger', 'typeVersion': 1.2,
        'position': [200, 300],
        'parameters': {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 23 * * *'}]}}
    },
    {
        'id': 'rex-litellm', 'name': 'Pull LiteLLM Usage',
        'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2,
        'position': [420, 300],
        'parameters': {
            'method': 'GET', 'url': 'http://litellm:4000/spend/logs',
            'sendHeaders': True,
            'headerParameters': {'parameters': [
                {'name': 'Authorization', 'value': '=Bearer {{ $env.LITELLM_MASTER_KEY }}'}
            ]},
            'sendQuery': True,
            'queryParameters': {'parameters': [
                {'name': 'start_date', 'value': "={{ $now.format('YYYY-MM-DD') }}"},
                {'name': 'end_date', 'value': "={{ $now.format('YYYY-MM-DD') }}"}
            ]}
        }
    },
    {
        'id': 'rex-calc', 'name': 'Rex — Calculate Cost',
        'type': 'n8n-nodes-base.code', 'typeVersion': 2,
        'position': [640, 300],
        'parameters': {'jsCode': (
            "const data = $input.first().json;\n"
            "const today = new Date().toISOString().split('T')[0];\n"
            "const logs = Array.isArray(data) ? data : (data.data || []);\n"
            "let totalSpend = 0;\n"
            "logs.forEach(log => { totalSpend += parseFloat(log.spend || log.cost || 0); });\n"
            "let status, action;\n"
            "if (totalSpend > 5) { status = '🔴 CRITICAL'; action = 'Switch to Ollama only immediately'; }\n"
            "else if (totalSpend > 3) { status = '🟠 HIGH'; action = 'Switch ALL tasks to Gemini Flash'; }\n"
            "else if (totalSpend > 1) { status = '🟡 WARNING'; action = 'Switch thinking tasks to Gemini Pro'; }\n"
            "else { status = '✅ NORMAL'; action = 'None'; }\n"
            "return [{ json: { date: today, totalSpend: totalSpend.toFixed(4), status, action, requiresAlert: totalSpend > 1, logCount: logs.length } }];"
        )}
    },
    {
        'id': 'rex-check', 'name': 'Threshold Exceeded?',
        'type': 'n8n-nodes-base.if', 'typeVersion': 2,
        'position': [860, 300],
        'parameters': {'conditions': {'conditions': [
            {'id': 'c1', 'leftValue': '={{ $json.requiresAlert }}', 'rightValue': True,
             'operator': {'type': 'boolean', 'operation': 'equal'}}
        ]}}
    },
    tg_node('rex-alert', 'Alert — Threshold', 1080, 200,
        '=💰 Rex Daily Report {{ $json.date }}\n\n'
        '{{ $json.status }} | Spend: ${{ $json.totalSpend }}\n\n'
        '⚡ Action: {{ $json.action }}'),
    tg_node('rex-normal', 'Normal — Under Threshold', 1080, 420,
        '=✅ Rex Daily {{ $json.date }} — Spend: ${{ $json.totalSpend }} (under threshold)')
]

rex_connections = {
    'Nightly 23:00': {'main': [[{'node': 'Pull LiteLLM Usage', 'type': 'main', 'index': 0}]]},
    'Pull LiteLLM Usage': {'main': [[{'node': 'Rex — Calculate Cost', 'type': 'main', 'index': 0}]]},
    'Rex — Calculate Cost': {'main': [[{'node': 'Threshold Exceeded?', 'type': 'main', 'index': 0}]]},
    'Threshold Exceeded?': {'main': [
        [{'node': 'Alert — Threshold', 'type': 'main', 'index': 0}],
        [{'node': 'Normal — Under Threshold', 'type': 'main', 'index': 0}]
    ]}
}


# ── WF_VERA ────────────────────────────────────────────────────────────────────
vera_nodes = [
    {
        'id': 'vera-trigger', 'name': 'Monday 08:00',
        'type': 'n8n-nodes-base.scheduleTrigger', 'typeVersion': 1.2,
        'position': [200, 300],
        'parameters': {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 8 * * 1'}]}}
    },
    {
        'id': 'vera-db', 'name': 'Query Agent Activity',
        'type': 'n8n-nodes-base.postgres', 'typeVersion': 2.5,
        'position': [420, 300],
        'credentials': {'postgres': {'id': POSTGRES_CRED, 'name': 'Postgres coprem_os'}},
        'parameters': {
            'operation': 'executeQuery',
            'query': "SELECT pillar, COUNT(*) as task_count FROM inbox_log WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY pillar ORDER BY task_count DESC;"
        }
    },
    {
        'id': 'vera-report', 'name': 'Vera — Build Report',
        'type': 'n8n-nodes-base.code', 'typeVersion': 2,
        'position': [640, 300],
        'parameters': {'jsCode': (
            "const rows = $input.all().map(i => i.json);\n"
            "const today = new Date().toISOString().split('T')[0];\n"
            "const agentMap = {JOB:'Jeff',PERSONAL:'Eilinaire',DEV:'Krit',BIZDEV:'Nova',RESEARCH:'Scout',HR:'Vera',FINANCE:'Rex',QA:'Quinn',LEGAL:'Lex'};\n"
            "const totalTasks = rows.reduce((s,r) => s + parseInt(r.task_count||0), 0);\n"
            "const activePillars = rows.map(r => r.pillar);\n"
            "const idleAgents = Object.keys(agentMap).filter(p => !activePillars.includes(p)).map(p => agentMap[p]);\n"
            "const lines = rows.map(r => (agentMap[r.pillar]||r.pillar)+': '+r.task_count+' tasks');\n"
            "return [{ json: { today, totalTasks, activeCount: rows.length, idleAgents, lines: lines.join(', ') } }];"
        )}
    },
    tg_node('vera-send', 'Send Report to Prem', 860, 300,
        '=👥 Vera Weekly Report — {{ $json.today }}\n\n'
        'Total tasks: {{ $json.totalTasks }} | Active agents: {{ $json.activeCount }}/9\n\n'
        '{{ $json.lines }}\n\n'
        '{{ $json.idleAgents.length > 0 ? "⚠️ Idle: " + $json.idleAgents.join(", ") : "✅ All agents active" }}')
]

vera_connections = {
    'Monday 08:00': {'main': [[{'node': 'Query Agent Activity', 'type': 'main', 'index': 0}]]},
    'Query Agent Activity': {'main': [[{'node': 'Vera — Build Report', 'type': 'main', 'index': 0}]]},
    'Vera — Build Report': {'main': [[{'node': 'Send Report to Prem', 'type': 'main', 'index': 0}]]}
}


# ── Run ───────────────────────────────────────────────────────────────────────
print('=== WF_SCOUT ===')
import_activate('WF_SCOUT — Daily Research & KB Update', scout_nodes, scout_connections)

print('\n=== WF_REX ===')
import_activate('WF_REX — Daily Cost & Finance Report', rex_nodes, rex_connections)

print('\n=== WF_VERA ===')
import_activate('WF_VERA — Weekly Agent Performance Report', vera_nodes, vera_connections)

print('\nDone.')
