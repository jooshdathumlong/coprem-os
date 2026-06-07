#!/usr/bin/env python3
"""
Deploy Content Automation into WF01:
1. Update L1-A Preprocessor v6 (adds new commands)
2. Add Switch node for command routing
3. Add HTTP nodes: caption / desc / kol / campaign / report
4. Wire HITL responses back to Telegram
"""
import json, os, sys, requests
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
ENV  = {}
for line in (ROOT / '.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        k, _, v = line.partition('=')
        ENV[k.strip()] = v.strip()

N8N_BASE = 'http://localhost:5678'
API_KEY  = ENV.get('N8N_API_KEY', '')
HEADERS  = {'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json'}
WF01_ID  = 'v4I9Kej9VjM2bdEm'
DASH_URL = 'http://localhost:3001'
TG_CRED  = 'bekevyLkkiivHo0L'

L1A_V6 = (ROOT / 'services/job/workflows/specs/wf01_l1a_v6.js').read_text()

def get_wf():
    r = requests.get(f'{N8N_BASE}/api/v1/workflows/{WF01_ID}', headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()

def save_wf(wf: dict):
    """DELETE + POST pattern — never PUT"""
    wf_id = wf['id']
    # Deactivate first
    requests.post(f'{N8N_BASE}/api/v1/workflows/{wf_id}/deactivate', headers=HEADERS, timeout=10)
    # Delete
    requests.delete(f'{N8N_BASE}/api/v1/workflows/{wf_id}', headers=HEADERS, timeout=10)
    # Re-create
    wf.pop('id', None)
    wf.pop('createdAt', None)
    wf.pop('updatedAt', None)
    r = requests.post(f'{N8N_BASE}/api/v1/workflows', headers=HEADERS, json=wf, timeout=15)
    if not r.ok:
        print(f'ERROR: {r.status_code} {r.text[:300]}')
        sys.exit(1)
    new_id = r.json()['id']
    # Reactivate
    requests.post(f'{N8N_BASE}/api/v1/workflows/{new_id}/activate', headers=HEADERS, timeout=10)
    print(f'✅ WF01 saved as {new_id}')
    return new_id

def make_http_node(name, node_id, x, y, method, endpoint, body_params):
    """Create HTTP Request node v4.2 calling dashboard API"""
    return {
        'id': node_id,
        'name': name,
        'type': 'n8n-nodes-base.httpRequest',
        'typeVersion': 4.2,
        'position': [x, y],
        'parameters': {
            'method': method,
            'url': f'{DASH_URL}{endpoint}',
            'authentication': 'none',
            'sendBody': True,
            'bodyParameters': {
                'parameters': body_params
            },
            'options': { 'timeout': 60000 },
        },
    }

def make_telegram_node(name, node_id, x, y, text_expr):
    return {
        'id': node_id,
        'name': name,
        'type': 'n8n-nodes-base.telegram',
        'typeVersion': 1.2,
        'position': [x, y],
        'credentials': { 'telegramApi': { 'id': TG_CRED, 'name': 'Telegram Bot' } },
        'parameters': {
            'resource': 'message',
            'operation': 'sendMessage',
            'chatId': '={{ $json.chat_id || $json.chatId }}',
            'text': text_expr,
            'additionalFields': { 'parse_mode': 'Markdown' },
        },
    }

def main():
    print('Fetching WF01...')
    wf = get_wf()
    nodes = wf['nodes']
    connections = wf['connections']

    # 1. Update L1-A v6
    for node in nodes:
        if 'L1-A' in node.get('name', '') or 'Preprocessor' in node.get('name', ''):
            node['parameters']['jsCode'] = L1A_V6
            node['name'] = 'L1-A Preprocessor'
            print(f'✅ L1-A updated to v6')
            break

    # 2. Find Switch node (Route by Type) and add new cases
    for node in nodes:
        if node.get('name') in ('Route by Type', 'Switch'):
            rules = node['parameters'].get('rules', {}).get('values', [])
            existing_types = [r.get('value') for r in rules]
            new_types = [
                ('caption',     'isCaption'),
                ('description', 'isDescription'),
                ('kol',         'isKol'),
                ('campaign',    'isCampaign'),
                ('report',      'isReport'),
            ]
            for msg_type, field in new_types:
                if msg_type not in existing_types:
                    rules.append({
                        'conditions': { 'options': { 'caseSensitive': True, 'leftValue': '', 'typeValidation': 'strict' },
                                        'combinator': 'and',
                                        'conditions': [{ 'id': f'cond-{msg_type}', 'leftValue': f'={{{{ $json.msg_type }}}}', 'rightValue': msg_type, 'operator': { 'type': 'string', 'operation': 'equals' } }] },
                        'renameOutput': True,
                        'outputKey': msg_type,
                    })
                    print(f'  + Switch case: {msg_type}')
            break

    # 3. Add HTTP + Reply nodes for each feature
    new_nodes = [
        # A1 Caption
        make_http_node('Call Caption API', 'n-caption-api', 2200, -200, 'POST', '/api/job/caption',
            [{'name':'brief','value':'={{ $json.commandArgs }}'},
             {'name':'brand','value':'={{ $json.commandMeta.brand }}'},
             {'name':'chat_id','value':'={{ $json.chat_id }}'}]),
        make_telegram_node('Send Caption Draft', 'n-caption-reply', 2500, -200,
            "=📝 *TikTok Caption Draft #{{ $json.draft_id }}*\n\n*Hook:* {{ $json.draft.hook }}\n\n{{ $json.draft.caption }}\n\n{{ $json.draft.hashtags.join(' ') }}\n\n*CTA:* {{ $json.draft.cta }}\n\n✅ พอใจพิมพ์ APPROVE | ❌ แก้บอกมา"),

        # A2 Description
        make_http_node('Call Desc API', 'n-desc-api', 2200, 0, 'POST', '/api/job/description',
            [{'name':'product_name','value':'={{ $json.commandArgs.split(\"|\")[0].trim() }}'},
             {'name':'key_points','value':'={{ $json.commandArgs.split(\"|\")[1] || \"\" }}'},
             {'name':'brand','value':'={{ $json.commandMeta.brand }}'},
             {'name':'chat_id','value':'={{ $json.chat_id }}'}]),
        make_telegram_node('Send Desc Draft', 'n-desc-reply', 2500, 0,
            "=📦 *Product Description Draft #{{ $json.draft_id }}*\n\n*ชื่อ:* {{ $json.draft.title }}\n\n*จุดเด่น:*\n{{ $json.draft.bullet_points.join('\\n') }}\n\n*Description:*\n{{ $json.draft.description }}\n\n✅ APPROVE | ❌ แก้บอกมา"),

        # B1 KOL
        make_http_node('Call KOL API', 'n-kol-api', 2200, 200, 'GET', '/api/job/kol',
            [{'name':'q','value':'={{ $json.commandArgs }}'},
             {'name':'brand_id','value':'={{ $json.commandMeta.brand === \"scrub_daddy\" ? 2 : 1 }}'}]),
        make_telegram_node('Send KOL Result', 'n-kol-reply', 2500, 200,
            "=🎯 *KOL Lookup: {{ $json.summary.total }} คน*\n\nMega: {{ $json.summary.by_tier.mega || 0 }} | Macro: {{ $json.summary.by_tier.macro || 0 }} | Mid: {{ $json.summary.by_tier.mid || 0 }} | Micro: {{ $json.summary.by_tier.micro || 0 }}\n\n{{ $json.kols.slice(0,5).map(k => `• ${k.kol_name} (${k.tier}, ${k.followers_tiktok?.toLocaleString() || '?'} followers, ฿${k.cost_thb || 'N/A'})`).join('\\n') }}\n\n💰 Budget รวม: ฿{{ $json.summary.total_cost_thb.toLocaleString() }}"),

        # B2 Campaign
        make_http_node('Call Campaign API', 'n-campaign-api', 2200, 400, 'POST', '/api/job/campaign',
            [{'name':'brief','value':'={{ $json.commandArgs }}'},
             {'name':'brand','value':'={{ $json.commandMeta.brand }}'},
             {'name':'budget_thb','value':'={{ $json.commandMeta.budget_thb }}'},
             {'name':'chat_id','value':'={{ $json.chat_id }}'}]),
        make_telegram_node('Send Campaign Plan', 'n-campaign-reply', 2500, 400,
            "=📊 *Campaign Plan #{{ $json.campaign_id }}*\n\n{{ $json.plan.strategy_summary }}\n\n*KOL Shortlist ({{ $json.plan.shortlist?.length || 0 }} คน):*\n{{ $json.plan.shortlist?.slice(0,5).map(k => `• ${k.kol_name} (${k.tier}) ฿${k.cost_thb?.toLocaleString() || 'N/A'} — ${k.recommend_reason}`).join('\\n') }}\n\n💰 Budget ใช้: ฿{{ $json.plan.total_budget_used?.toLocaleString() }}\n📣 Reach: {{ $json.plan.expected_reach }}\n\n✅ APPROVE | ❌ แก้บอกมา"),

        # C1 Report
        make_http_node('Call Report API', 'n-report-api', 2200, 600, 'POST', '/api/job/report',
            [{'name':'chat_id','value':'={{ $json.chat_id }}'}]),
        make_telegram_node('Send Report Confirm', 'n-report-reply', 2500, 600,
            "=✅ Report ส่งแล้ว"),
    ]

    nodes.extend(new_nodes)

    # 4. Wire connections: Switch output → API → Reply
    pairs = [
        ('caption',     'n-caption-api',  'n-caption-reply'),
        ('description', 'n-desc-api',     'n-desc-reply'),
        ('kol',         'n-kol-api',       'n-kol-reply'),
        ('campaign',    'n-campaign-api',  'n-campaign-reply'),
        ('report',      'n-report-api',    'n-report-reply'),
    ]

    # Find switch node name
    switch_name = next((n['name'] for n in nodes if n.get('name') in ('Route by Type', 'Switch')), 'Route by Type')

    for msg_type, api_id, reply_id in pairs:
        api_name   = next(n['name'] for n in nodes if n['id'] == api_id)
        reply_name = next(n['name'] for n in nodes if n['id'] == reply_id)

        # Switch → API (find output index matching msg_type)
        if switch_name not in connections:
            connections[switch_name] = {'main': []}
        connections[switch_name]['main'].append([{'node': api_name, 'type': 'main', 'index': 0}])

        # API → Reply
        connections[api_name] = {'main': [[{'node': reply_name, 'type': 'main', 'index': 0}]]}

    wf['nodes'] = nodes
    wf['connections'] = connections

    # 5. Deploy
    print('Deploying updated WF01...')
    new_id = save_wf(wf)
    print(f'\n✅ Done. New WF01 ID: {new_id}')
    print('Update infra/scripts/post_restart.sh WF01_ID if changed.')

if __name__ == '__main__':
    main()
