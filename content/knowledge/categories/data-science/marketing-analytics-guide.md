# Marketing Analytics Guide — COPREM

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Key Metrics by Platform

### TikTok Analytics
| Metric | ดูที่ไหน | Target |
|---|---|---|
| Views | TikTok Studio | > 10K/video |
| Watch time % | TikTok Studio | > 50% |
| Shares | TikTok Studio | > 1% of views |
| Profile visits | TikTok Studio | > 5% of views |
| Follower conversion | TikTok Studio | > 0.5% |

### Shopee Analytics
| Metric | ดูที่ไหน | Target |
|---|---|---|
| GMV | Seller Center | Track MoM |
| Conversion rate | Seller Center | > 2% |
| CTR | Ads Manager | > 1% |
| ROAS | Ads Manager | > 3x |
| Review score | Seller Center | > 4.8 |

## Campaign ROI Formula

```
ROI = (Revenue - Cost) / Cost × 100%

Revenue = Shopee GMV + Direct sales
Cost = Ad spend + KOL cost + Production cost

Target: ROI > 150%
```

## A/B Testing Framework

1. **Hypothesis:** เปลี่ยน [element] จาก [A] เป็น [B] จะทำให้ [metric] ดีขึ้น
2. **Sample size:** อย่างน้อย 1,000 impressions ต่อ variant
3. **Duration:** 7-14 วัน (อย่าหยุดเร็วเกินไป)
4. **Winner criteria:** p-value < 0.05 หรือ lift > 10%

## Data Sources in COPREM

| ข้อมูล | ที่อยู่ | Agent ที่ดู |
|---|---|---|
| Agent activity | `agent_workload_log` | Vera |
| API costs | `finance_daily_costs` | Rex |
| Research findings | `research_feeds` | Scout/Analyst |
| Content performance | Shopee/TikTok APIs | Nova |
| QA metrics | `qa_audit_log` | Quinn/Analyst |
