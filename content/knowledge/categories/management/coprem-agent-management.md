# COPREM Agent Management — Vera's Playbook

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Agent Roster (10 Agents)

| Agent | Pillar | Reports To | Weekly Schedule |
|---|---|---|---|
| Jeff | JOB | Prem | On-demand |
| Eilinaire | PERSONAL | Prem | On-demand |
| Krit | DEV | Jeff | On-demand + proposals |
| Nova | BIZDEV | Jeff | Weekly brief Mon |
| Scout | RESEARCH | Jeff | Daily 07:00 auto |
| Vera | HR | Jeff | Mon 08:00 weekly report |
| Rex | FINANCE | Jeff/Prem | Nightly 23:00 auto |
| Quinn | QA | Jeff | On deploy/publish |
| Lex | LEGAL | Jeff | On publish/contract |
| Analyst | ANALYST | Jeff/Prem | Sun 22:00 auto |

## Workload Management

**Overload threshold:** queue > 5 tasks → Vera alerts Jeff
**Idle threshold:** no task > 48hr → Vera assigns improvement task

## HITL Gate Summary

| Action | ต้องถาม Prem ไหม |
|---|---|
| File write, git commit, script run | ❌ ไม่ต้อง |
| DB schema change, force push | ✅ ต้องถาม |
| Content publish | ✅ ต้องถาม |
| Credential change | ✅ ต้องถาม + run credential_map.sh ก่อน |
| Budget > 5,000 THB | ✅ ต้องถาม |
| Legal HIGH risk | ✅ ต้องถาม + written acknowledgment |

## Performance Metrics

**Weekly review (Vera รายงาน):**
- Tasks completed per agent
- Error rate per agent
- Response time average
- Idle time

**Monthly review (Analyst รายงาน):**
- Improvement proposals implemented
- Cost savings achieved
- Quality gate pass rate
- System uptime
