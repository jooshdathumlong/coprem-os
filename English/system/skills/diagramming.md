# Playbook: Visual Diagramming (Mermaid)

**Target Departments:** Ops, Business
**Required Connectors:** None (Native Markdown)

## Trigger
A complex system, workflow, or architecture needs to be explained visually to the CEO (Prem).

## Workflow Execution
1. **Structural Analysis:** Break down the complex system into discrete nodes and relationships.
2. **Code Generation:** Write Mermaid.js syntax to represent the structure.
   - Use `graph TD` for top-down flowcharts.
   - Use `sequenceDiagram` for process flows.
3. **Artifact Creation:** Embed the Mermaid code inside a Markdown artifact for easy rendering in the UI Dashboard.

## Validation
- Ensure all node names are properly escaped to prevent syntax errors.
- Keep the diagram logically grouped for readability.
