---
name: feedback-n8n-rules
description: Safe rules for editing n8n workflows in COPREM — connection integrity, dedup, API pattern
metadata:
  type: feedback
---

**Rule:** After ANY PUT to update a workflow via n8n API, ALWAYS restart n8n or call `/activate` + restart to re-register webhooks.

**Why:** n8n's PUT workflow API does not automatically re-register webhook nodes. The webhook becomes "unknown" silently — no error shown, execution logs show `success` but 0 nodes ran. Only restart or explicit reactivation fixes this.

**How to apply:** After every `curl -X PUT .../workflows/{id}`, immediately run:
```bash
docker restart $(docker ps --filter name=n8n -q | head -1) && sleep 15
```
Or at minimum: `curl -X POST .../workflows/{id}/activate` and verify n8n logs show "Activated workflow WF01".

---

**Rule:** Before adding any connection to a node that already uses `$('NodeName')` reference internally, check if a direct connection to that same source already exists. Double-connection = double execution.

**Why:** n8n runs a node once per input batch. If NodeA and NodeB both connect to NodeC, NodeC runs twice — even if NodeC references NodeA via `$('NodeA')` internally.

**How to apply:** Always grep the Code node's jsCode for `$('...')` patterns before adding a new direct connection to that node. If a `$('X')` reference exists, NodeX does NOT need a direct connection.

---

**Rule:** Dedup guard in L2.5 Normalize Output must use INPUT message hash as key, not reply content.

**Why:** If key = reply content, similar replies (e.g., multiple Batiste persona lists) get incorrectly deduped even for different questions.

**How to apply:** Key = `chatId + inputMsg.substring(0,100)`. This deduplicates only when the SAME question is sent twice within 30s.

---

**Rule:** n8n API PUT /workflows requires only: `{name, nodes, connections, settings, staticData}`. Adding extra top-level fields causes `400: must NOT have additional properties`.

**How to apply:** Always strip the full GET response to just those 5 keys before PUT.
