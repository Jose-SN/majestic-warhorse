# PetaxAI Shared Contract — Frontend + Logic apps + Shared AI Service

**Use this one file** for Angular/React frontends, each app’s **Logic Service** (Node), and the **shared FastAPI AI Service**.  
Architecture detail: [`AI-ARCHITECTURE.md`](../service_architecture/AI-ARCHITECTURE.md)

| Audience | What to implement from this doc |
| -------- | -------------------------------- |
| **Frontend** | §§1–6 (HTTP APIs on *its* Logic service only). Never call ingest-status or chunk APIs. |
| **Logic Service (per app)** | §§1–7 (library/chat APIs + ingest callback you accept). Own app DB (`files`, chat); may host or share `document_chunks`. |
| **Shared AI Service (FastAPI)** | §§7–8 + §11. Multi-app: every request carries `app_id`. Write/read chunks scoped by `app_id` + org. |

**Pattern (same idea as Shared IAM):** one AI service, many Logic apps (Majestic Warhorse today; other PetaxAI products later).

| Concept | Value for this repo |
| ------- | ------------------- |
| Logic base URL | e.g. `http://localhost:8081` |
| Shared AI base URL | `AI_SERVICE_URL` e.g. `http://localhost:8083` |
| This app’s id | **`IAM_APP_ID`** = IAM `applications.id` (UUID). Also accepted from JWT `app_id`. |

**Auth (browser → Logic):** `Authorization: Bearer <JWT>`  
JWT must include **user id**, **`organization_id`**, and preferably **`role`**.  
Never send `organization_id` / `created_by` / uploader `role` in library/chat bodies — Logic resolves them from the JWT.

---

## 0. System flow (multi-app)

```text
Frontend (App A) ──JWT──► Logic A ──HTTP + app_id──► Shared AI Service (FastAPI)
Frontend (App B) ──JWT──► Logic B ──HTTP + app_id──►        │
                                                            ├─ chunks filtered by app_id + org
                                                            └─ callback_url → that Logic’s /file/ingest-status

Each Logic:
  ├─ owns files, conversations, messages (app DB)
  └─ object storage via storage_key / download_url
```

### Data ownership

| Data | Where | Written by | Read by | Frontend? |
| ---- | ----- | ---------- | ------- | --------- |
| Library `files` | **That app’s** Logic Postgres | Logic | Logic + AI (metadata) | Yes |
| `conversations` / `messages` | Logic Postgres | Logic | Logic | Yes |
| `document_chunks` + embeddings | Logic Postgres **or** AI vector DB (partitioned by `app_id`) | **Shared AI** | **Shared AI** | **No** |
| File bytes | Object storage | Logic upload | AI via `download_url` / `storage_key` | CDN `url` only |

**MVP for Majestic Warhorse:** chunks live in this Logic DB with `app_id`, FK to `files`, `ON DELETE CASCADE`.  
**Future:** AI may host a dedicated vector store; still keyed by `app_id` + `organization_id`.

---

## 1. File model (breaking for FE + Logic)

**Verified in Logic Postgres:** `files` has **no** `parent_id` / `parent_type` (and no file `role` / `r2_key`).

Course / chapter media link via junction tables only:
- `chapter_files (chapter_id, file_id, …)`
- `course_files (course_id, file_id)`

Object path field: **`storageKey`** (DB `storage_key`).

Do **not** send `parentId` / `parentType` / file `role` / `r2Key` on library or file APIs.

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
  "role": "teacher",
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

> **Note:** Progress/`statuses` still uses `parent_id` / `parent_type` for Course|Chapter|File completion — not used by AI.

---

## 2. Library HTTP APIs (Frontend ↔ Logic)

### Upload

`POST /file/upload` — `multipart/form-data` — **JWT required** when library.

| Field | Notes |
| ----- | ----- |
| `file` | binary (required) |
| `bucket_name` | `library` **or** |
| `library_files` | `true` |
| `role` | **required** — session login type: `organization` \| `teacher` \| `student` |
| `visibility` | default `private` |
| `description` | optional |

Do **not** send `createdBy` / `uploadedBy` / `organizationId` — Logic derives them from JWT + `role`:

| `role` | `createdBy` / `uploadedBy` | `organizationId` |
| ------ | -------------------------- | ---------------- |
| `organization` | org id (JWT) | org id (JWT) |
| `teacher` | user id (JWT) | null |
| `student` | user id (JWT) | null |

Missing/invalid `role` → `400` `{ "error": "Library upload requires role", "details": "…" }`.

**Success:**

```json
{
  "message": "Library file uploaded successfully",
  "key": "library/....",
  "url": "https://...",
  "data": { /* library file object */ }
}
```

Logic then calls Shared AI `POST {AI_SERVICE_URL}/ingest` with `app_id` + `callback_url`. If AI is disabled, status stays `pending`. On HTTP failure → `failed`.

### List

`GET /file/library?role=organization|teacher|student` — JWT  
`{ "success": true, "data": [ /* filtered library files */ ] }`

`role` is the same session login type used on upload. Response objects include `role`, `status`, `storageKey` / URL.

### Delete

`DELETE /file/library/:fileId` — JWT  
Deletes DB row + storage object. Chunks cascade when `document_chunks.file_id` has `ON DELETE CASCADE`.

Prefer **`GET /file/library`** over raw `GET /file/get?bucket_name=library` for the Library UI.

---

## 3. Chat HTTP APIs (Frontend ↔ Logic)

All `/chat/*` require JWT. Logic proxies ask to Shared AI and persists messages.

### Ask

`POST /chat`

```json
{
  "question": "What is Newton second law?",
  "conversation_id": "optional-uuid",
  "role": "teacher"
}
```

(`message` alias for `question`.)

**`role` required** — session login type: `organization` \| `teacher` \| `student` (same as library).  
Do **not** send `organization_id` / `created_by` — Logic derives them from JWT + `role`.

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

1. Library: `GET/DELETE /file/library` (list with `?role=`), upload with JWT + `library_files`/`bucket_name=library` + session **`role`** + `visibility`; show `status` / `storageKey`.
2. AI Mode: `/chat` + conversations CRUD; send Bearer + session **`role`**; render `citations`.
3. Do not send `parentId` / `parentType` / file `r2Key` / body `createdBy` / `uploadedBy` / `organizationId`. **Do** send session `role` on library upload/list and chat ask.
4. Do **not** call Shared AI or `/file/ingest-status` directly.
---

## 6. Quick route map (Logic Service — browser facing)

| Method | Path | Auth | Who calls |
| ------ | ---- | ---- | --------- |
| POST | `/file/upload` | JWT if library | Frontend |
| GET | `/file/library` | JWT | Frontend |
| DELETE | `/file/library/:fileId` | JWT | Frontend |
| POST | `/file/ingest-status` | Optional shared secret | **Shared AI only** |
| POST | `/chat` | JWT | Frontend |
| GET | `/chat/conversations` | JWT | Frontend |
| GET | `/chat/conversations/:id` | JWT | Frontend |
| DELETE | `/chat/conversations/:id` | JWT | Frontend |

Swagger: Logic Service `/api-docs`.

---

## 7. Logic ↔ Shared AI contracts

Env (**this** Logic app):

| Env | Purpose |
| --- | ------- |
| `AI_SERVICE_URL` | Shared AI base URL |
| `AI_ENABLED` | `true` to call `/ingest` and `/ask` |
| `AI_TIMEOUT_MS` | HTTP timeout |
| **`IAM_APP_ID`** | **IAM `applications.id` — used as Shared AI `app_id` (required when AI enabled)** |
| `AI_CALLBACK_BASE_URL` | Public Logic base for callbacks (e.g. `http://localhost:8081`) |
| `AI_INGEST_CALLBACK_SECRET` | Shared secret; AI sends `X-AI-Callback-Secret` |

Every Logic → AI call includes **`app_id`** = `IAM_APP_ID` (or JWT `app_id` when present) via body + `X-App-Id` header.

### Logic → AI: ingest

`POST {AI_SERVICE_URL}/ingest`  
Header: `X-App-Id: <IAM_APP_ID>`

```json
{
  "app_id": "<IAM applications.id uuid>",
  "file_id": "uuid",
  "storage_key": "library/....pdf",
  "download_url": "https://cdn.../library/....pdf",
  "organization_id": "uuid",
  "created_by": "uuid",
  "filename": "notes.pdf",
  "mime_type": "application/pdf",
  "visibility": "private",
  "callback_url": "http://localhost:8081/file/ingest-status"
}
```

AI: prefer `download_url` (else resolve `storage_key` via app config) → extract → chunk → embed → insert chunks with **`app_id`** → `POST callback_url`.

### AI → Logic: ingest status

`POST {callback_url}` (per-app; for this repo `/file/ingest-status`)  
Header (if configured): `X-AI-Callback-Secret: <secret>`  
Optional: `X-App-Id` / body `app_id`.

```json
{
  "app_id": "<IAM applications.id uuid>",
  "file_id": "uuid",
  "status": "ready",
  "error": null
}
```

`status`: `pending` \| `processing` \| `ready` \| `failed`.

### Logic → AI: ask

`POST {AI_SERVICE_URL}/ask`  
Header: `X-App-Id: <IAM_APP_ID>`

```json
{
  "app_id": "<IAM applications.id uuid>",
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

AI retrieves only from chunks where **`app_id` matches** and org/visibility rules apply. Logic stores the assistant message + citations.

---

## 8. Shared AI Service checklist

1. Treat AI as **multi-tenant / multi-app**: require `app_id` on `/ingest` and `/ask`.
2. Implement `/ingest` and `/ask` as above; use `callback_url` from the request (do not hardcode one Logic URL).
3. Own all writes to `document_chunks` (or AI-owned vector DB), always scoped by `app_id`.
4. Prefer `download_url` for file bytes; keep per-app storage config as fallback.
5. Never expose chunk CRUD to browsers.
6. Register each Logic app in IAM (`applications` row) and set that UUID as `IAM_APP_ID`; configure callback secret / storage on Shared AI.

---

## 9. Logic Service checklist (per app)

1. Set `IAM_APP_ID` (IAM `applications.id`), `AI_CALLBACK_BASE_URL`, `AI_SERVICE_URL`, callback secret.
2. Migrations: `files` (no parents), junctions, chat, `document_chunks` + `app_id` + pgvector.
3. Expose library + chat; accept ingest-status callback.
4. Do not embed/retrieve in Node for MVP — call Shared AI.
5. Forward tenant context from JWT; never trust body org/user ids.

---

## 10. Verified Logic Postgres schema (this app)

**Confirmed live columns (Aug 2026).** Shared AI should filter chunks by `app_id = <IAM_APP_ID>` for this product.

### `files` — **no `parent_id` / `parent_type`**

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `description` | text | |
| `file_url` | varchar | |
| `file_name` | varchar | |
| `created_by` | uuid | |
| `creation_date` | timestamp | |
| `modification_date` | timestamp | |
| `library_files` | boolean not null | `true` = RAG library |
| `organization_id` | uuid | |
| `uploaded_by` | uuid | |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `storage_key` | text | |
| `visibility` | text not null | |
| `status` | text | pending \| processing \| ready \| failed |

### Junctions (course media — AI usually ignores)

- `chapter_files`: `id`, `chapter_id`, `file_id`, `created_at`
- `course_files`: `course_id`, `file_id`

### `document_chunks` (AI writes/reads)

| Column | Type |
| ------ | ---- |
| `id` | uuid PK |
| **`app_id`** | **text not null** — IAM `applications.id` (multi-app partition) |
| `organization_id` | uuid not null |
| `created_by` | uuid not null |
| `file_id` | uuid → `files(id)` **ON DELETE CASCADE** |
| `chunk_index` | int |
| `content` | text |
| `token_count` | int |
| `metadata` | jsonb |
| `embedding` | vector(1536) |
| `created_at` | timestamptz |

Eligible for RAG: `library_files = true` AND `status = 'ready'` AND matching `app_id`.

### Chat (Logic only)

- `conversations`: `id`, `organization_id`, `created_by`, `title`, `created_at`, `updated_at`
- `messages`: `id`, `conversation_id` → CASCADE, `role`, `content`, `citations`, `created_at`

---

## 11. Onboarding a new Logic app to Shared AI

1. Create/register an IAM `applications` row; copy its **id** into Logic `IAM_APP_ID`.
2. Deploy Logic with library/chat + `/file/ingest-status`.
3. Set `AI_SERVICE_URL`, `AI_CALLBACK_BASE_URL`, `AI_INGEST_CALLBACK_SECRET` (same secret configured on AI for that app).
4. Ensure chunks store **`app_id` = that IAM application UUID**.
5. FE talks only to that Logic — never to Shared AI.

---

*Source of truth alongside [`AI-ARCHITECTURE.md`](../service_architecture/AI-ARCHITECTURE.md).*
