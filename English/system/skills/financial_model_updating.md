# Playbook: Financial Model Updating post-earnings

**Target Department:** Wealth & Trading
**Required Connectors:** S&P Global, FactSet, Claude for Excel

## Trigger
A target company releases its quarterly earnings report.

## Workflow Execution
1. **Data Ingestion (Read):** Sage uses S&P Global / FactSet connectors to pull the latest 10-Q/10-K filings and earnings call transcripts.
2. **Extraction (Transform):** Extract key metrics: Revenue, EPS, Margins, Forward Guidance, and Capital Expenditures.
3. **Model Update (Write):** Send the extracted metrics via the Claude for Excel connector to update the target company's DCF model.
4. **Risk Review:** Nick reviews the updated valuation and adjusts the risk profile and stop-loss levels accordingly.

## Validation
- Ensure the updated intrinsic value is cross-checked against historical averages.
