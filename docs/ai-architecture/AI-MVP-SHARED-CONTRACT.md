# PetaxAI MVP — Shared contract (Frontend + Backend)

**Use this one file** for Angular/React frontend, Node.js Logic Service, and FastAPI AI Service.  
Architecture detail: [`../ai-architecture.md`](../ai-architecture.md)

| Audience | What to implement from this doc |
| -------- | -------------------------------- |
| **Frontend** | Sections 1–6 (HTTP APIs only). Never call ingest-status or chunk APIs. |
| **Logic Service (Node)** | Sections 1–7 (APIs you expose + ingest callback you accept). Own `files` / chat tables; schema for `document_chunks`. |
| **AI Service (FastAPI)** | Sections 7–8 (ingest + ask contracts). Write/read `document_chunks` in Logic Postgres. |

**Logic base URL:** e.g. `http://localhost:8081`  
**Auth (browser → Logic):** `Authorization: Bearer <JWT>`  
JWT must include **user id** (`id` / `sub` / `user_id`), **`organization_id`** (or `organizationId` / `org_id`), and preferably **`role`** (`organization` \| `teacher` \| `student`).  
Never send `organization_id` / `created_by` / file uploader `role` in request bodies for library/chat — Logic resolves them from the JWT.

---

## 0. System flow (all teams)

```text
Frontend ──JWT──► Logic Service ──HTTP──► AI Service (FastAPI)
                      │                      │
                      │                      ├─ write document_chunks (Logic DB)
                      │                      └─ callback POST /file/ingest-status
                      │
                      ├─ files, conversations, messages (Logic DB)
                      └─ object storage (R2/S3) via storage_key
```

### Data ownership

| Data | DB | Written by | Read by | Frontend API? |
| ---- | -- | ---------- | ------- | ------------- |
| Library `files` metadata | Logic Postgres | Logic | Logic + AI | Yes |
| `conversations` / `messages` | Logic Postgres | Logic | Logic | Yes |
| `document_chunks` + embeddings | **Logic Postgres** | **AI Service** | **AI Service** | **No** |
| File bytes | Object storage | Logic upload | AI via `storage_key` | CDN `url` only |

---

## 1. File model (breaking for FE + Logic)

Removed from files: `parentId` / `parentType`, file `role`, `r2Key`.  
Course media: `chapter_files` / `course_files` junctions only.  
Object path field: **`storageKey`** (DB `storage_key`) — works for R2, S3, or any object store.

### Library file object

```json
{
  "id": "uuid",
  "description": "",
  "fileURL": "https://cdn.../library/....pdf",
  "fileName": "notes.pdf",
  "createdBy": "uuid",
  "libraryFiles": true,
  "organizationId": "uuid",
  "uploadedBy": "uuid",
  "mimeType": "application/pdf",
  "sizeBytes": 123456,
  "storageKey": "library/....pdf",
  "visibility": "private",
  "status": "processing",
  "creation_date": "...",
  "modification_date": "...",
  "key": "library/....pdf",
  "url": "https://cdn.../library/....pdf"
}
```

### `visibility`

| Value | Who can see it |
| ----- | -------------- |
| `organization` | Everyone in the org |
| `teacher` | Teachers (+ org admin) |
| `student` | Students (+ org admin) |
| `private` | Owner only (+ org admin) |

### `status` (ingest)

`pending` → `processing` → `ready` \| `failed`  
RAG uses only `library_files = true` and `status = ready`.

---

## 2. Library HTTP APIs (Frontend ↔ Logic)

### Upload

`POST /file/upload` — `multipart/form-data` — **JWT required** when library.

| Field | Notes |
| ----- | ----- |
| `file` | binary (required) |
| `bucket_name` | `library` **or** |
| `library_files` | `true` |
| `visibility` | default `private` |
| `description` | optional |

**Success:**

```json
{
  "message": "Library file uploaded successfully",
  "key": "library/....",
  "url": "https://...",
  "data": { /* library file object */ }
}
```

Logic then calls AI `POST {AI_SERVICE_URL}/ingest` and may set `status` to `failed` if ingest fails.

### List

`GET /file/library` — JWT  
`{ "success": true, "data": [ /* filtered library files */ ] }`

### Delete

`DELETE /file/library/:fileId` — JWT  
Deletes DB row + storage object. Prefer cascading chunk delete (`ON DELETE CASCADE` on `document_chunks.file_id`).

Prefer **`GET /file/library`** over raw `GET /file/get?bucket_name=library` for the Library UI.

---

## 3. Chat HTTP APIs (Frontend ↔ Logic)

All `/chat/*` require JWT. Logic proxies ask to FastAPI and persists messages.

### Ask

`POST /chat`

```json
{ "question": "What is Newton second law?", "conversation_id": "optional-uuid" }
```

(`message` alias for `question`.)

```json
{
  "success": true,
  "data": {
    "conversation_id": "uuid",
    "answer": "…",
    "citations": [{ "file": "Physics_Grade10.pdf", "page": 12 }],
    "message": {
      "id": "uuid",
      "conversation_id": "uuid",
      "role": "assistant",
      "content": "…",
      "citations": [],
      "created_at": "…"
    }
  }
}
```

### History

- `GET /chat/conversations`
- `GET /chat/conversations/:id` → `{ conversation, messages[] }`
- `DELETE /chat/conversations/:id`

Message `role` is `user` \| `assistant` \| `system` (not the app role).

---

## 4. HTTP errors

| Status | When |
| ------ | ---- |
| `401` | Missing/invalid JWT or missing org/user claims |
| `403` | Library delete not allowed |
| `404` | Conversation / library file not found |

---

## 5. Frontend checklist

1. Library: `GET/DELETE /file/library`, upload with JWT + `library_files`/`bucket_name=library` + `visibility`; show `status` / `storageKey`.
2. AI Mode: `/chat` + conversations CRUD; send Bearer; render `citations`.
3. Do not send `parentId` / `parentType` / file `role` / `r2Key`.
4. Do **not** call `/file/ingest-status` or any chunk endpoint.

---

## 6. Quick route map (Logic Service — browser facing)

| Method | Path | Auth | Who calls |
| ------ | ---- | ---- | --------- |
| POST | `/file/upload` | JWT if library | Frontend |
| GET | `/file/library` | JWT | Frontend |
| DELETE | `/file/library/:fileId` | JWT | Frontend |
| POST | `/file/ingest-status` | Optional shared secret | **AI Service only** |
| POST | `/chat` | JWT | Frontend |
| GET | `/chat/conversations` | JWT | Frontend |
| GET | `/chat/conversations/:id` | JWT | Frontend |
| DELETE | `/chat/conversations/:id` | JWT | Frontend |

Swagger: Logic Service `/api-docs`.

---

## 7. Logic ↔ AI contracts (Backend)

Env (Logic): `AI_SERVICE_URL`, `AI_ENABLED`, `AI_TIMEOUT_MS`, `AI_INGEST_CALLBACK_SECRET`.

### Logic → AI: ingest (after library upload)

`POST {AI_SERVICE_URL}/ingest`

```json
{
  "file_id": "uuid",
  "storage_key": "library/....pdf",
  "organization_id": "uuid",
  "created_by": "uuid",
  "filename": "notes.pdf",
  "mime_type": "application/pdf",
  "visibility": "private"
}
```

AI: download via `storage_key`, extract → chunk → embed → **insert `document_chunks`** in Logic Postgres → callback.

### AI → Logic: ingest status

`POST /file/ingest-status`  
Header (if configured): `X-AI-Callback-Secret: <AI_INGEST_CALLBACK_SECRET>`

```json
{
  "file_id": "uuid",
  "status": "ready",
  "error": null
}
```

`status`: `pending` \| `processing` \| `ready` \| `failed`.

### Logic → AI: ask (from `POST /chat`)

`POST {AI_SERVICE_URL}/ask`

```json
{
  "conversation_id": "uuid",
  "question": "…",
  "organization_id": "uuid",
  "created_by": "uuid",
  "role": "teacher"
}
```

Expected AI response:

```json
{
  "answer": "…",
  "citations": [{ "file": "Physics_Grade10.pdf", "page": 12, "file_id": "uuid" }]
}
```

AI retrieves only from `document_chunks` scoped by org + visibility rules (same as architecture §6). Logic stores the assistant message + citations.

---

## 8. AI Service checklist

1. Connect to **Logic Postgres** (same DB); enable **pgvector** when implementing chunks.
2. Implement `/ingest` and `/ask` as above.
3. Own all writes to `document_chunks`; do not invent a separate chunk DB for MVP.
4. Callback Logic `/file/ingest-status` on success/failure.
5. On file delete (cascade or listen): remove chunks for `file_id`.
6. Never expose chunk CRUD to the frontend.

---

## 9. Logic Service checklist

1. Migrations: `files` (`library_files`, `visibility`, `storage_key`, …), `conversations`, `messages`; later `document_chunks` + pgvector.
2. Expose library + chat routes; accept ingest-status callback.
3. Do not implement embedding/retrieval in Node for MVP.
4. Forward tenant context from JWT to AI; never trust body org/user ids.

---

*Source of truth for API shapes alongside [`ai-architecture.md`](../ai-architecture.md).*
