# Workflow 07 — Cybernetic Feedback Collector

**Trigger:** Webhook (⭐ rating in #coprem-feedback)  
**Output:** Task_Board feedback_score + improvement_flag

## Flow
1. Receive score 1–5 from Prem
2. Update Task_Board: feedback_score = score
3. If score < 3 → set improvement_flag = true on task
4. Aggregate weekly avg → write to monitoring dashboard
