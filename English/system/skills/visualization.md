# Playbook: Data Visualization from CSVs

**Target Departments:** Ops, Wealth, Marketing
**Required Connectors:** Data Pipelines Plugin

## Trigger
A raw CSV dataset (e.g., ad performance, stock historicals) is uploaded or retrieved.

## Workflow Execution
1. **Data Ingestion (Read):** Parse the CSV file using internal data pipeline capabilities.
2. **Cleaning (Transform):** Remove null values, normalize dates, and format currency.
3. **Analysis:** Calculate key metrics (e.g., averages, MoM growth, moving averages).
4. **Visualization:** Generate an ASCII table or a structured markdown summary highlighting the most critical trends.
5. **Insights:** Append a "Key Takeaways" section that explains *why* the data looks the way it does.

## Validation
- Double-check calculations (Perfect Iteration).
- Ensure the final output is scannable and executive-ready.
