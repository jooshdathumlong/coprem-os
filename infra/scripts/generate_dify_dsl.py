#!/usr/bin/env python3
"""
generate_dify_dsl.py — Generate Dify DSL YAML files for all 9 COPREM agents
Output: services/job/dify-dsl/*.yml
Run: python3 infra/scripts/generate_dify_dsl.py
"""

import os, yaml, re
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
PROMPTS_FILE = ROOT / 'services/job/agents/prompts.md'
OUTPUT_DIR = ROOT / 'services/job/dify-dsl'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Agent definitions: (filename, name_in_prompts_md, app_name, description)
AGENTS = [
    ('jeff.yml',      'Jeff — Core OS Agent',              'Jeff',      'Orchestrator / JOB ops — COPREM OS Executive Partner'),
    ('eilinaire.yml', 'Eilinaire Agent',                   'Eilinaire', 'PERSONAL pillar — Brand strategy, trading, wealth management'),
    ('krit.yml',      'Krit — IT Developer Agent',         'Krit',      'DEV pillar — Autonomous IT developer, bug fixes, architecture'),
    ('nova.yml',      'Nova — Business Developer Agent',   'Nova',      'BIZDEV pillar — Brand strategy Eilinaire + Peadbuntid'),
    ('scout.yml',     'Scout — Research & Intelligence',   'Scout',     'RESEARCH pillar — Daily market intel, tech updates, competitor watch'),
    ('vera.yml',      'Vera — HR & Resource Manager',      'Vera',      'HR pillar — Agent workload, capacity planning, performance'),
    ('rex.yml',       'Rex — CFO / Finance Controller',    'Rex',       'FINANCE pillar — P&L, API cost monitoring, budget control'),
    ('quinn.yml',     'Quinn — QA / Quality Assurance',    'Quinn',     'QA pillar — Code review, content gate, PASS/BLOCK verdicts'),
    ('lex.yml',       'Lex — Legal & Compliance',          'Lex',       'LEGAL pillar — Thailand FDA compliance, PDPA, advertising law'),
]

def extract_prompt(content: str, section_header: str) -> str:
    """Extract system prompt from prompts.md between ``` fences under section_header."""
    # Find the section
    idx = content.find(f'## {section_header}')
    if idx == -1:
        return f'You are the {section_header} agent for COPREM OS.'

    section = content[idx:]
    # Find first ``` block
    start = section.find('```\n')
    if start == -1:
        return f'You are the {section_header} agent for COPREM OS.'
    start += 4  # skip ```\n
    end = section.find('\n```', start)
    if end == -1:
        return section[start:start+2000]
    return section[start:end].strip()

def make_dsl(app_name: str, description: str, system_prompt: str) -> dict:
    return {
        'app': {
            'description': description,
            'icon': '🤖',
            'icon_background': '#FFEAD5',
            'mode': 'agent-chat',
            'name': app_name,
        },
        'kind': 'app',
        'version': '0.1.3',
        'model_config': {
            'agent_mode': {
                'enabled': True,
                'max_iteration': 5,
                'strategy': 'function_call',
                'tools': [],
            },
            'model': {
                'completion_params': {'temperature': 0.3, 'max_tokens': 2000},
                'mode': 'chat',
                'name': 'claude-sonnet-4-6',
                'provider': 'anthropic',
            },
            'pre_prompt': system_prompt,
            'prompt_type': 'simple',
            'opening_statement': f'Hi, I am {app_name}. How can I help?',
            'suggested_questions': [],
            'suggested_questions_after_answer': {'enabled': False},
            'speech_to_text': {'enabled': False},
            'retriever_resource': {'enabled': True},
            'sensitive_word_avoidance': {'enabled': False},
            'more_like_this': {'enabled': False},
        }
    }

def run():
    with open(PROMPTS_FILE) as f:
        content = f.read()

    for filename, section_header, app_name, description in AGENTS:
        prompt = extract_prompt(content, section_header)
        dsl = make_dsl(app_name, description, prompt)

        out_path = OUTPUT_DIR / filename
        with open(out_path, 'w') as f:
            yaml.dump(dsl, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

        print(f'✅ {filename} — {app_name} ({len(prompt)} chars)')

    print(f'\nDone. {len(AGENTS)} DSL files → {OUTPUT_DIR}')
    print('\nTo deploy: Dify → Studio → Create App → Import DSL File')

if __name__ == '__main__':
    run()
