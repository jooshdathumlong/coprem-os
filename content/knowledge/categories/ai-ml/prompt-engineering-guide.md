# Prompt Engineering — COPREM Agent Guide

> ที่มา: COPREM OS Internal | Updated: 2026-06-07

## Core Principles

### 1. Identity First
```
You are [Name], the [Role] for COPREM OS.
Scope: [PILLAR] only — [what you do].
Domain boundary: Never [what you don't do].
```

### 2. Hard Rules Block
กำหนด rules ที่ agent ต้องทำตามเสมอ — ใส่ก่อน examples

### 3. Output Format
บังคับ format ท้าย response เพื่อให้ parse ได้:
```json
{ "agent": "name-v1.0", "pillar": "PILLAR" }
```

### 4. Anti-Hallucination
```
IF knowledge base returns empty → tell user: "No data found. Please add to KB."
NEVER invent data, names, numbers.
```

## Few-Shot Pattern (สำหรับ structured tasks)

```
Task: classify message
Input: "ช่วยเขียน caption TikTok"
Output: {"pillar":"JOB","agent":"jeff","confidence":0.95}

Input: "ราคาหุ้น ADVANC วันนี้"
Output: {"pillar":"PERSONAL","agent":"eilinaire","confidence":0.88}
```

## Chain-of-Thought (สำหรับ complex reasoning)

เพิ่ม `Think step by step before answering` ใน system prompt
ใช้กับ: trade validation, campaign strategy, bug diagnosis

## Temperature Guide

| Task | Temperature | เหตุผล |
|---|---|---|
| Classification/routing | 0.1 | ต้องการ consistent |
| Structured data output | 0.3 | balance accuracy/variety |
| Content writing | 0.7 | ต้องการ creativity |
| Brainstorming | 0.9 | maximize diversity |
