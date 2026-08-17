# RAG streaming — Logic + Frontend changes

**Status:** Shared AI implements `POST /ask/stream` (SSE). `POST /ask` JSON is unchanged.  
**Browser rule:** Frontend still talks **only to Logic**. Never call Shared AI from the client.

Related docs: [`REASONING_FE_LOGIC_CHANGES.md`](./REASONING_FE_LOGIC_CHANGES.md) (persist `reasoning`) · [`AI-MVP-SHARED-CONTRACT.md`](./AI-MVP-SHARED-CONTRACT.md) §7.

---

## Why this design

| Choice | Why |
|--------|-----|
| **SSE over WebSocket** | One-shot Q&A, same auth as `/ask`, easy HTTP proxy, no extra connection protocol |
| **New path `/ask/stream`** | Old Logic clients keep `POST /ask`; no JSON contract break |
| **Events: `status`, `reasoning`, `token`, `done`, `error`** | Retrieval “thinking” is **free** (no extra LLM call). Tokens are **answer text only** |
| **Same generation as `/ask`** | One model call; parser strips `REASONING:` / `ANSWER:` so the student sees the answer incrementally |
| **Fallback only if no token yet** | Switching providers mid-sentence would duplicate or scramble text |

Cost: streaming does **not** add LLM calls. Gemini “thinking tokens” or a second reason-then-answer call would cost more; we do not do that.

---

## 1. Shared AI contract (Logic → AI)

Same body and headers as `POST /ask`:

- JSON `AskRequest` (`app_id`, `question`, `organization_id`, `created_by`, `role`, optional `conversation_id`, optional `skill`)
- `X-App-Id` (and optional service secret, same as `/ask`)
- Auth: Logic service caller only

```http
POST /ask/stream
Content-Type: application/json
X-App-Id: <IAM applications.id>
```

Response:

- `200` `Content-Type: text/event-stream`
- Headers AI already sets: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`

Each SSE frame:

```text
event: <name>
data: <json>

```

### Event catalog

| Event | When | `data` |
|-------|------|--------|
| `status` | Pipeline phase | `{ "phase": "retrieving" \| "generating" }` |
| `reasoning` | **(1)** After retrieval **(2)** During generation | **(1)** `{ "phase": "retrieval", summary, steps, retrieval, citations? }` **(2)** `{ "phase": "model", "text": "…" }` — append model `text` for live “thinking”; never show `REASONING:` / `ANSWER:` labels |
| `token` | Answer deltas (after model `ANSWER:`) | `{ "text": "…" }` — concatenate in order |
| `done` | Success | Full `AskResponse`: `answer`, `citations`, `reasoning` |
| `error` | LLM down after stream started | `{ "code": "LLM_UNAVAILABLE", "message": "…" }` |

No-context path still streams: `reasoning` (empty retrieval) → one `token` with the stock message → `done`. No LLM call.

If the stream fails **before** any bytes (validation / auth), you get a normal HTTP 4xx/422, not SSE.

Keep `POST /ask` as fallback for timeouts, old clients, or if the SSE proxy is not ready.

---

## 2. Logic Service (Node) changes

### 2.1 New public route (suggested)

| FE → Logic | Logic → AI |
|------------|------------|
| `POST /chat` | `POST {AI_SERVICE_URL}/ask` (keep) |
| `POST /chat/stream` | `POST {AI_SERVICE_URL}/ask/stream` |

Same JWT rules as `/chat`: resolve `organization_id`, `created_by`, `role` from IAM; set `app_id` / `X-App-Id` from `IAM_APP_ID`. Never trust those fields from the browser body.

Suggested timeout: **120s** (or disable request timeout on this route). Streaming can run longer than JSON `/ask`.

### 2.2 Proxy rules (required)

1. **Do not** `await` the full AI body then send JSON to FE. Pipe the SSE stream.
2. Forward `Content-Type: text/event-stream` and disable buffering:
   - Node: `res.setHeader('Content-Type', 'text/event-stream')`, `res.setHeader('Cache-Control', 'no-cache')`, `res.setHeader('X-Accel-Buffering', 'no')`, `res.flushHeaders()`.
   - Nginx in front of Logic: `proxy_buffering off;` for this location.
3. Use `fetch` / `http.request` / undici with **streaming body**. Do not `JSON.parse` the whole response.
4. On `event: done`, persist the assistant message the same way as `/chat` (`content` = `answer`, store `citations` + `reasoning`).
5. On `event: error` or connection drop: mark the message failed (or delete the placeholder); do not persist a partial answer as final unless product wants a “interrupted” state.
6. Optional: persist a placeholder user+assistant row when the request starts; update on `done`.

### 2.3 Node sketch (Logic → AI)

```ts
const aiRes = await fetch(`${AI_SERVICE_URL}/ask/stream`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-App-Id": IAM_APP_ID,
    // AI_SERVICE_SECRET if configured
  },
  body: JSON.stringify(askPayloadFromJwt),
});

if (!aiRes.ok || !aiRes.body) {
  // 4xx/503 before stream — map to existing chat errors
  throw new Error("ask stream failed");
}

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("X-Accel-Buffering", "no");
res.flushHeaders();

const reader = aiRes.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let finalPayload: AskResponse | null = null;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;
  res.write(chunk); // pass-through to FE (or re-encode if you parse)

  for (const frame of splitSse(buffer)) {
    if (frame.event === "done") {
      finalPayload = JSON.parse(frame.data);
    }
  }
}

if (finalPayload) {
  await saveAssistantMessage(conversationId, finalPayload);
}
res.end();
```

Parse SSE yourself if you need `done` without forwarding raw frames: split on `\n\n`, read `event:` and `data:` lines.

### 2.4 Env / ops

- Reuse `AI_SERVICE_URL`, `IAM_APP_ID`, callback secret (unchanged).
- Railway / reverse proxies: disable response buffering for `/chat/stream`.
- CORS: Logic already serves FE; no new AI CORS for browsers.

### 2.5 Logic checklist

- [ ] `POST /chat/stream` (name may differ) with JWT
- [ ] Proxy SSE to FE; no full-body buffer
- [ ] Persist on `done` (`answer`, `citations`, `reasoning`)
- [ ] Handle `error` + disconnect
- [ ] Keep `POST /chat` → `/ask` for non-streaming clients
- [ ] `nginx` / platform: `proxy_buffering off` for the stream route

---

## 3. Frontend changes

### 3.1 Call Logic, not AI

```http
POST /chat/stream
Authorization: Bearer <IAM access token>
Content-Type: application/json
```

Body stays the FE chat shape (question + conversation id). Logic fills tenant fields.

Do **not** use browser `EventSource` for this: `EventSource` is GET-only. Use `fetch` + `ReadableStream`.

### 3.2 UI mapping

| SSE event | UI |
|-----------|-----|
| `status.phase = retrieving` | “Searching your library…” |
| `reasoning` + `phase: retrieval` | Sources panel (hits, scores, snippets) |
| `status.phase = generating` | “Thinking…” |
| `reasoning` + `phase: model` | Live thinking panel — append `data.text`; collapse when first `token` arrives |
| `token` | Append `data.text` to the assistant answer bubble |
| `done` | Finalize with `answer`, `citations`, full `reasoning` |
| `error` | Error state; offer retry via JSON `/chat` if you want |

Do not render raw `REASONING:` / `ANSWER:` — AI already strips those from `token` / `done.answer`.

### 3.3 Fetch sketch (FE)

```ts
const res = await fetch("/chat/stream", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ conversationId, question }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buf = "";
let answer = "";
let modelThinking = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const parts = buf.split("\n\n");
  buf = parts.pop() ?? "";
  for (const block of parts) {
    const event = /(?:^|\n)event: (\w+)/.exec(block)?.[1];
    const dataLine = block
      .split("\n")
      .find((l) => l.startsWith("data: "));
    if (!event || !dataLine) continue;
    const data = JSON.parse(dataLine.slice(6));
    if (event === "reasoning" && data.phase === "model") {
      modelThinking += data.text;
      setThinking(modelThinking);
    }
    if (event === "reasoning" && data.phase === "retrieval") {
      setRetrievalReasoning(data);
    }
    if (event === "token") {
      setThinkingOpen(false);
      answer += data.text;
      setDraft(answer);
    }
    if (event === "done") {
      setDraft(data.answer);
      setCitations(data.citations);
      setReasoning(data.reasoning);
    }
    if (event === "error") setError(data.message);
  }
}
```

Abort with `AbortController` on navigate-away; Logic should cancel the upstream fetch when the client disconnects if possible.

### 3.4 Fallback

If `/chat/stream` is missing or returns 404/501: call existing `POST /chat` and render the full answer at once (including `reasoning` from [`REASONING_FE_LOGIC_CHANGES.md`](./REASONING_FE_LOGIC_CHANGES.md)).

### 3.5 Frontend checklist

- [ ] Stream via Logic only (`fetch`, not `EventSource`)
- [ ] Append `reasoning` events with `phase: model` into a thinking panel; append `token.text` into the answer
- [ ] Citations from `done` only (or from the early `reasoning.citations` if you show sources before the answer finishes)
- [ ] Abort + error UI
- [ ] Keep JSON chat as fallback

---

## 4. Sequence

```text
Student  →  FE POST /chat/stream
FE       →  Logic (JWT)
Logic    →  AI POST /ask/stream (service auth + X-App-Id)
AI       →  retrieve chunks
AI       →  SSE reasoning + status generating
AI       →  SSE token*  (answer only)
AI       →  SSE done (full AskResponse)
Logic    →  persist message
FE       →  final bubble + citations
```

---

## 5. Out of scope

- Browser → Shared AI
- WebSockets / Socket.IO for this MVP
- Extra LLM “thinking” tokens or a second generation call
- Changing `POST /ask` JSON

---

*Last updated: 2026-08-13.*
