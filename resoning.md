# RAG reasoning — Logic + Frontend changes

**Status:** Shared AI already returns optional `reasoning` on `POST /ask`.  
**Streaming:** still **not** implemented; this doc is for reasoning UI + persistence only.

Related AI response shape (additive; old clients can ignore `reasoning`):

```json
{
  "answer": "Force equals mass times acceleration.",
  "citations": [
    { "file": "Physics_Grade10.pdf", "page": 12, "file_id": "uuid" }
  ],
  "reasoning": {
    "summary": "Cited Physics.pdf page 12",
    "steps": [
      "Retrieved 8 chunk(s) scoped by app_id, organization, and visibility",
      "Selected 1 unique source citation(s)",
      "Generated answer from retrieved context only when present",
      "Model: Cited Physics.pdf page 12"
    ],
    "retrieval": [
      {
        "file": "Physics_Grade10.pdf",
        "page": 12,
        "file_id": "uuid",
        "score": 0.91,
        "snippet": "F = m a is Newton's second law…"
      }
    ]
  }
}
```

`reasoning` may be `null` only on older AI builds; treat missing as “no explainability UI”.

---

## 1. Logic Service (Node) changes

### 1.1 Types / DTOs

Extend the AI ask client response type:

```ts
type ReasoningHit = {
  file: string;
  page?: number | null;
  file_id?: string | null;
  score?: number | null;
  snippet?: string | null;
};

type AskReasoning = {
  summary: string;
  steps: string[];
  retrieval: ReasoningHit[];
};

type AskResponse = {
  answer: string;
  citations: Array<{ file: string; page?: number | null; file_id?: string | null }>;
  reasoning?: AskReasoning | null;
};
```

### 1.2 Persist assistant message

When handling `POST /chat` after Shared AI `/ask`:

- Keep storing `answer` + `citations` as today (required for FE).
- Also store `reasoning` on the assistant message (JSONB column or `metadata.reasoning`).

Suggested `messages` addition (Learning owns DDL):

```sql
-- optional migration in Learning
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reasoning jsonb;
```

Or without DDL: `metadata = jsonb_set(metadata, '{reasoning}', $reasoning::jsonb)`.

### 1.3 API responses to frontend

Ensure conversation GET endpoints return reasoning on assistant messages, e.g.:

```json
{
  "id": "…",
  "role": "assistant",
  "content": "Force equals…",
  "citations": […],
  "reasoning": { "summary": "…", "steps": […], "retrieval": […] }
}
```

Do **not** expose Shared AI URLs or API keys to the browser.

### 1.4 Checklist

- [x] Parse `reasoning` from AI `/ask` response (ignore if absent)
- [x] Save with assistant message
- [x] Return on conversation history / chat response
- [x] No change to ingest flow
- [x] Still never call Shared AI from the browser

---

## 2. Frontend changes

### 2.1 Chat message model

```ts
type ChatReasoning = {
  summary: string;
  steps: string[];
  retrieval: Array<{
    file: string;
    page?: number | null;
    score?: number | null;
    snippet?: string | null;
  }>;
};

type ChatMessage = {
  // existing fields…
  content: string;
  citations?: Citation[];
  reasoning?: ChatReasoning | null;
};
```

### 2.2 UX (recommended)

Under each **assistant** bubble:

1. Keep **answer** as the primary text.
2. Keep **citations** as chips/links (existing).
3. Add a collapsed section: **“Why this answer”** / **“Reasoning”**
   - Show `reasoning.summary` as one line when collapsed.
   - Expanded: `steps` as a short bullet list.
   - Optional “Sources used”: list `retrieval` with file, page, score; snippet in a tooltip or secondary text.
4. Hide the section entirely when `reasoning` is null/undefined.
5. Do **not** dump raw model chain-of-thought; only show what Logic returns.

### 2.3 Accessibility / copy

- Collapsible `<details>` or button + region is fine.
- Label for learners: “How this was found” rather than “Chain of thought”.

### 2.4 Checklist

- [x] Types include optional `reasoning`
- [x] Render collapsible explainability under assistant messages
- [x] Works for new messages and loaded conversation history
- [x] Graceful when older messages have no reasoning
- [x] Still only call Logic `/chat` (never Shared AI)

---

## 3. Out of scope (this pass)

- Token streaming / SSE
- Showing internal Gemini “thought_signature” blobs
- Changing ingest or `document_chunks` DDL

---

## 4. Smoke test

1. Upload + ingest a library file until `ready`.
2. Ask a question that should hit that file.
3. AI `/ask` JSON includes `reasoning.retrieval` with scores.
4. Logic chat response includes the same reasoning.
5. FE shows answer + citations + expandable “Why this answer”.

---

*AI implementation: `AskResponse.reasoning` in Shared AI `POST /ask`. Contract note: [`AI-MVP-SHARED-CONTRACT.md`](./AI-MVP-SHARED-CONTRACT.md) §7 ask response.*
