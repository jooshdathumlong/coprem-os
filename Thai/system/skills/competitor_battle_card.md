# คู่มือการปฏิบัติงาน (Playbook): Competitor Battle Card Generation

**Target แผนก:** Business & Marketing
**ตัวเชื่อมโยงระบบที่จำเป็น (Required Connectors):** Semrush, Playwright/Firecrawl

## เงื่อนไขการทำงาน (Trigger)
A new competitor enters the market or an existing competitor launches a major campaign.

## ขั้นตอนการดำเนินงาน (Workflow Execution)
1. **Data Scraping (Read):** Use Playwright/Firecrawl to scrape the competitor's landing pages, pricing pages, and feature lists.
2. **SEO Analysis (Read):** Use Semrush to identify their top-performing keywords and traffic sources.
3. **Synthesis (Transform):** Compile the data into a standard "Battle Card" format:
   - Strengths & Weaknesses
   - Pricing Comparison
   - Target Audience Overlap
   - Our Strategic Advantage
4. **Distribution:** Save the Battle Card to `knowledge/job/` or `knowledge/personal/` (depending on the pillar) and notify the relevant Marketing Director.

## การตรวจสอบความถูกต้อง (Validation)
- Ensure the "Strategic Advantage" section provides actionable steps to counter the competitor.
