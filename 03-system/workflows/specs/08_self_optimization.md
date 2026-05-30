# Workflow 08 — Self-Optimization Loop

**Trigger:** Cron  
**Schedule:** Sunday 22:00  
**Output:** New prompt candidate → Prompt Shadow Test

## Flow
1. Pull tasks where improvement_flag = true (last 7 days)
2. Send to Claude Sonnet: analyze failure patterns + generate improved prompt
3. Write new prompt to Prompt_Library (status = SHADOW)
4. Begin 48h shadow test on 10% of traffic
5. If shadow feedback_avg > current + 0.3 → promote to ACTIVE
6. Else → discard, keep current prompt
7. Log result to Prompt_Library
