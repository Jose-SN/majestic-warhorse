# PetaxAI Learning – Enterprise AI Knowledge Platform

## Technical Architecture & Implementation Handover Document

**Prepared for:** Technical Architect  
**Prepared by:** Jose Sasi Nirmala  
**Project:** PetaxAI Learning  
**Date:** August 2026

**Service architectures:** [`LEARNING_ARCHITECTURE.md`](./LEARNING_ARCHITECTURE.md) · [`IAM-ARCHITECTURE.md`](./IAM-ARCHITECTURE.md)  
**Frontend MVP checklist:** [`FRONTEND-MVP.md`](../FRONTEND-MVP.md)  
**Shared contract:** [`AI-MVP-SHARED-CONTRACT.md`](../ai-architecture/AI-MVP-SHARED-CONTRACT.md)

---

# 1. Executive Summary

This document summarizes the current implementation status of the PetaxAI Learning platform, the proposed enterprise-grade AI knowledge architecture, pending work, and the implementation roadmap for the next four weeks.

The objective is to build a **secure, scalable, multi-tenant AI learning platform** where organizations, teachers, and students can upload educational content and receive AI-generated answers strictly from their authorized documents.

The platform is designed to evolve into a broader **GenAI ecosystem** including tutoring, quiz generation, analytics, lesson planning, and intelligent educational agents.

---

# 2. Current Technology Stack (Completed)

## Frontend

* **React**
* TypeScript
* React Router
* React Query

## Backend Services

### Logic Service

* **Node.js**
* Express / Fastify (existing service)
* Handles business logic, library APIs, and application workflows.

### IAM Service (Shared Across Applications)

* **Node.js**
* Shared authentication and authorization service used by PetaxAI Learning and other future applications.
* Issues JWT tokens and manages users, roles, and organizations.

## Databases

### Logic Database

* **Supabase PostgreSQL**
* Stores application data (library, files, conversations, analytics, etc.)

### IAM Database

* **Supabase PostgreSQL**
* Separate shared identity database for users, roles, organizations, permissions, and authentication.

## File Storage

* **Cloudflare R2**
* Files are uploaded through the **Node.js Logic Service API** and stored in R2.

---

# 3. Current Work Completed

* Multi-role architecture defined (Organization, Teacher, Student).
* Library / Drive management PRD completed.
* File upload flow designed through Node.js API to R2.
* Storage analytics requirements defined.
* Role-based visibility rules defined.
* AI and RAG architecture research completed.
* Multi-tenant isolation strategy defined.
* Database separation strategy (Logic DB + IAM DB) finalized.
* Future GenAI capability roadmap identified.

---

# 4. Planned Architecture (Target State)

```text
Frontend (App A / App B …)
        |
        v
API Gateway / Load Balancer
        |
        +-------------------+--------------------+
        |                   |                    |
        v                   v                    v
 Logic Service A      Logic Service B     Shared IAM Service
 (e.g. Majestic)      (future app)              |
        |                   |                    +---- IAM Database
        |                   |
        +---- App DB (+ optional chunks)   +---- App DB
        +---- Object storage (R2/S3)
        |
        +---- HTTP (app_id) ──────────────────► Shared PetaxAI Service (FastAPI)
                                                      |
                                                      ├─ Embeddings / RAG / LLMs
                                                      ├─ Chunks partitioned by app_id
                                                      └─ callback_url → that Logic /file/ingest-status
```

**Shared services (cross-app):** IAM + **PetaxAI AI Service**.  
**Per-app:** Frontend + Logic Service + app database + object storage.

---

# 5. Service Responsibilities

## React Frontend

* Library UI
* File upload UI
* AI chat UI
* Analytics dashboards
* Conversation history

## Node.js Logic Service (per application)

* File upload API + library metadata (`files` table)
* Storage quota management
* Library APIs (list/upload/delete — **no chunk APIs**)
* Conversation / message APIs
* Calls **Shared AI Service** for ingest + chat (`app_id`, `callback_url`)
* Owns app DB schema (including `document_chunks` DDL for MVP)
* Updates `files.status` via ingest callback on **this** Logic instance

## Node.js IAM Service (shared across applications)

* Authentication
* JWT issuance
* Role management
* Organization management
* Shared identity across applications

## Shared PetaxAI AI Service (FastAPI — shared across applications)

* Document ingestion (`/ingest`)
* Text extraction, chunking, embeddings
* **Writes/reads `document_chunks` scoped by `app_id`** (MVP: in each Logic DB or shared vector DB)
* Vector retrieval (pgvector)
* RAG orchestration (`/ask`)
* Citation generation
* Future AI agents (quiz, tutoring, etc. for any app)
* Calls back the **request’s `callback_url`** (not a single hardcoded Logic URL)

### Data ownership (locked)

| Data | Database | Written by | Read by | Exposed to frontend? |
| ---- | -------- | ---------- | ------- | -------------------- |
| `files`, library metadata | **Per-app** Logic Postgres | Logic | Logic + AI | Yes (`/file/library`, upload) |
| `conversations`, `messages` | Per-app Logic Postgres | Logic | Logic | Yes (`/chat/...`) |
| `document_chunks` + embeddings | Per-app Logic DB **or** shared AI vector DB; always **`app_id`** | **Shared AI** | **Shared AI** | **No** |
| Object bytes | R2 / S3 / compatible | Logic | AI via `download_url` / `storage_key` | Via CDN URL only |

**Rule:** Chunk/vector data is always filtered by **`app_id` + `organization_id`** (and visibility). The frontend never calls chunk APIs or Shared AI directly.

---

# 6. Security & Tenant Isolation

Every AI-related record must contain:

* `organization_id`
* `created_by`

## Mandatory Retrieval Filter

```sql
WHERE organization_id = :org_id
  AND created_by = :user_id
```

### Organization Admin

Can retrieve all organization documents (`visibility` does not restrict admins).

### Teacher

Can retrieve:
* own documents (`created_by = teacher`)
* assigned student documents
* library files with `visibility` in (`organization`, `teacher`)

### Student

Can retrieve:
* own documents
* library files with `visibility` in (`organization`, `student`)

### Private

`visibility = 'private'` is always limited to the owner (plus organization admin).

**Important:** `organization_id` and `created_by` must always be resolved from the JWT token through the IAM service and never accepted from the frontend request body.

---

# 7. Database Design (Logic Database)

> **Verified live (Aug 2026):** `files` has **no** `parent_id` / `parent_type`.  
> Course media uses `chapter_files` / `course_files` only.  
> `document_chunks` + pgvector + **`app_id`** (multi-app Shared AI) are applied.  
> Full column list: [AI-MVP-SHARED-CONTRACT.md](../ai-architecture/AI-MVP-SHARED-CONTRACT.md) §10.

## files (extend existing table)

Reuse the existing `files` table. Course/chapter attachments are linked via
**junction tables only** — `files` has **no** `parent_id` / `parent_type` (confirmed in production schema).

**Columns (live):**

```sql
id                  uuid primary key,
description         text not null default '',
file_url            varchar(1000) not null,   -- object path or URL
file_name           varchar(255) not null,
created_by          uuid not null,
creation_date       timestamp,
modification_date   timestamp,
library_files       boolean not null default false,  -- true = Library / RAG
organization_id     uuid,                            -- required when library_files = true
uploaded_by         uuid,
mime_type           text,
size_bytes          bigint,
storage_key         text,                            -- prefer for object download (R2/S3)
visibility          text not null
  check (visibility in ('organization', 'teacher', 'student', 'private')),
status              text                             -- pending | processing | ready | failed
  default 'pending'
```

**Not present on `files`:** `parent_id`, `parent_type`, `role`, `r2_key`.

Uploader **role is not stored on `files`**. Access filtering uses the caller's JWT role.

### Junction tables (course media — not used by RAG ingest)

```sql
-- chapter ↔ file (live also has id, created_at)
chapter_files (
  id uuid,
  chapter_id uuid references chapters(id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  created_at timestamptz,
  primary key / unique (chapter_id, file_id)
)

-- course ↔ file
course_files (
  course_id uuid references courses(id) on delete cascade,
  file_id uuid references files(id) on delete cascade,
  primary key (course_id, file_id)
)
```

### `visibility` (NOT NULL)

| Value | Meaning |
| ----- | ------- |
| `organization` | Visible to everyone in the organization |
| `teacher` | Visible to teachers (and organization admins) |
| `student` | Visible to students (and organization admins) |
| `private` | Visible only to the owner (`created_by` / `uploaded_by`) |

Library uploads must set `library_files = true` and a non-null `visibility`.
Course/chapter media keep `library_files = false` and default `visibility` to
`private` unless product rules say otherwise.

> **Unrelated:** table `statuses` still uses `parent_id` / `parent_type` for course progress — not part of the files/RAG model.

## document_chunks

**Location (MVP):** this app’s Logic Postgres (same DB as `files`).  
**Location (future):** may move to a Shared AI vector DB; still keyed by **`app_id`**.  
**Owner of rows:** Shared PetaxAI Service.  
**Schema owner:** Logic migrations for MVP (`scripts/create_document_chunks_table.sql`).  
**Frontend:** never reads or writes this table.

```sql
id uuid primary key,
app_id text not null,                 -- IAM applications.id (multi-app partition)
organization_id uuid not null,
created_by uuid not null,
file_id uuid not null references files(id) on delete cascade,
chunk_index int,
content text,
token_count int,
metadata jsonb,
embedding vector(1536),
created_at timestamptz
```

Only files with `library_files = true` and `status = 'ready'` are eligible for chunking/retrieval.  
Retrieval **must** filter `app_id` to the calling Logic app.

When a library file is deleted in Logic, related chunks are removed via **`ON DELETE CASCADE`**.

## conversations

```sql
id uuid primary key,
organization_id uuid not null,
created_by uuid not null,
title text,
created_at timestamptz,
updated_at timestamptz
```

## messages

```sql
id uuid primary key,
conversation_id uuid not null references conversations(id) on delete cascade,
role text check (role in ('user', 'assistant', 'system')),
content text not null default '',
citations jsonb,
created_at timestamptz
```

---

# 8. AI / RAG Technology Stack (Planned)

| Layer               | Technology                       |
| ------------------- | -------------------------------- |
| AI API              | FastAPI                          |
| RAG Framework       | LangChain                        |
| Vector Store        | pgvector                         |
| Embeddings          | OpenAI text-embedding-3-small    |
| LLM                 | GPT-4.1 / Claude Sonnet / Gemini |
| Reranking (Phase 2) | Cohere Rerank                    |
| OCR                 | PaddleOCR                        |
| Audio/Video         | Whisper                          |
| Observability       | Langfuse + Sentry                |

---

# 9. File Ingestion Pipeline

## MVP (HTTP callback only — no message queue)

```text
User Uploads Library File (library_files = true)
        |
Node.js Logic Service
        |
Cloudflare R2
        |
Create / update files row
  (status = pending → processing)
        |
HTTP POST → FastAPI /ingest (file_id, storage_key, org, created_by, …)
        |
FastAPI Worker (same service process for MVP)
        |
Text Extraction → Cleaning → Chunking → Embeddings
        |
Store Chunks + Vectors in Logic PostgreSQL
  (document_chunks — written by FastAPI)
        |
HTTP callback → Node.js Logic Service
  POST /file/ingest-status
  { file_id, status: ready|failed, error? }
        |
Update files.status
```

**Phase 2+:** replace the fire-and-forget HTTP ingest call with a durable
message queue / background workers if volume or reliability requires it.

---

# 10. Chunking Strategy

* Chunk size: **500–800 tokens**
* Overlap: **100–150 tokens**
* Split by headings and paragraphs.
* Preserve metadata such as page number, section, subject, teacher, and student.

---

# 11. Retrieval Strategy

## Hybrid Retrieval

### Dense Search

Semantic similarity using pgvector.

### Keyword Search

PostgreSQL full-text search.

### Rank Fusion

Combine semantic and keyword results.

### Reranking

Phase 2 semantic reranking for higher accuracy.

---

# 12. AI Response Generation

System prompt:

```text
You are PetaxAI Learning Assistant.
Answer only from the provided organization documents.
If the answer is not present, say:
"I could not find this information in your organization library."
Always include source citations.
```

Response example:

```json
{
  "answer": "Newton second law states that force equals mass multiplied by acceleration.",
  "citations": [
    {
      "file": "Physics_Grade10.pdf",
      "page": 12
    }
  ]
}
```

---

# 13. API Flow

Routes follow the existing Logic Service style (no `/api` prefix), e.g. `/course`, `/file`.

## Ask Question

**Frontend → Node.js Logic Service**

```http
POST /chat
```

Optional conversation helpers (same style):

```http
GET    /chat/conversations
GET    /chat/conversations/:id
DELETE /chat/conversations/:id
```

Node.js forwards the ask request to FastAPI with authenticated tenant context
(`organization_id`, `created_by`, JWT role for scope, visibility scope).

FastAPI returns answer + citations.

Node.js stores conversation/messages and returns the response to the frontend.

## Library file ingest callback (FastAPI → Logic Service)

```http
POST /file/ingest-status
```

Body example:

```json
{
  "file_id": "uuid",
  "status": "ready",
  "error": null
}
```

---

# 14. Planned React AI Module

```text
src/modules/ai/
  ChatPage.tsx
  ChatWindow.tsx
  MessageBubble.tsx
  CitationPanel.tsx
  SuggestedQuestions.tsx
```

Features:

* Streaming answers
* Citation preview
* Follow-up questions
* Conversation history

---

# 15. Pending Work (TODO)

## Infrastructure

* Enable pgvector.
* Create vector indexes.
* Configure AI service deployment.

## Backend

* Extend `files` with `library_files`, `visibility`, org/R2 metadata columns.
* Implement MVP HTTP ingest call + `/file/ingest-status` callback (queue later).
* Implement FastAPI service.
* Implement retrieval APIs.
* Implement streaming responses.
* Implement Logic Service `/chat` + conversation APIs (current route style).

## Security

* Enable Row Level Security.
* Add audit logging.
* Add rate limiting.

## AI

* Embeddings pipeline.
* Hybrid retrieval.
* Citation generation.
* Conversation memory.

---

# 16. Four-Week Implementation Plan

## Week 1 – Foundation

* Create FastAPI AI service repository.
* Enable pgvector.
* Create vector schema.
* Configure database connections.
* Configure R2 access in AI service.

## Week 2 – Ingestion Pipeline

* PDF extraction.
* DOCX extraction.
* Chunking service.
* Embedding generation.
* HTTP ingest trigger from Logic Service + status callback (MVP).
* Background queue/worker (optional stretch / Phase 2).

## Week 3 – RAG & Chat

* Retrieval service.
* Hybrid search.
* AI chat endpoint.
* Citation support.
* Streaming responses.
* React chat integration.

## Week 4 – Production Hardening

* Row Level Security.
* Audit logs.
* Sentry integration.
* Langfuse tracing.
* Load testing.
* Security testing.
* Admin AI analytics dashboard.

---

# 17. Success Criteria

* AI answers come only from authorized organization documents.
* All retrieval queries enforce `organization_id` and `created_by`.
* Uploaded documents become searchable within minutes.
* Responses include citations.
* Organization, teacher, and student isolation works correctly.
* AI service is independently deployable.
* Monitoring and audit logging are operational.

---

# 18. Future Enterprise Roadmap

## Phase 2

* OCR for scanned PDFs
* Audio/video transcription
* Automatic summaries
* Quiz generation
* Flashcards

## Phase 3

* Teacher AI assistant
* Student study coach
* Personalized learning paths
* Assignment evaluation

## Phase 4

* Multi-agent orchestration
* Voice tutor
* Knowledge graph
* Federated campus search
* On-premise LLM deployment

---

# 19. Risks and Mitigations

| Risk                          | Mitigation                         |
| ----------------------------- | ---------------------------------- |
| Cross-tenant data leakage     | organization_id + created_by + RLS |
| Large file processing latency | Asynchronous workers               |
| Embedding cost growth         | Embedding cache                    |
| LLM hallucination             | Strict prompt + citations          |
| Storage growth                | R2 lifecycle policies              |

---

# 20. Final Recommendation

Proceed with the following target architecture:

* **Frontend** (Angular now; React module optional later)
* **Node.js Logic Service**
* **Node.js Shared IAM Service**
* **Shared PetaxAI FastAPI AI Service** (multi-app via `app_id` — same pattern as IAM)
* **Supabase PostgreSQL (per-app Logic DB + shared IAM DB)**
* **Cloudflare R2**
* **LangChain orchestration**
* **pgvector vector search** (partitioned by `app_id`)
* **Hybrid retrieval**
* **Extend `files` with `library_files` + `visibility`; no `parent_id`/`parent_type`/`role`** — **verified live**
* **`document_chunks` + `app_id`; Shared AI owns chunk I/O; frontend never sees chunks**
* **MVP ingest via HTTP + per-app `callback_url` (queue later)**
* **Logic routes (`/chat`, `/file/...`) — no `/api` prefix**
* **organization_id + created_by + app_id isolation**
* **Langfuse + Sentry observability**

**Shared contract for FE + Logic apps + Shared AI:** [AI-MVP-SHARED-CONTRACT.md](../ai-architecture/AI-MVP-SHARED-CONTRACT.md)

This architecture supports immediate MVP delivery while providing a scalable foundation for a future enterprise-grade educational AI platform and broader PetaxAI GenAI ecosystem.

---

# 21. Locked Implementation Decisions (Aug 2026)

| Decision | Choice |
| -------- | ------ |
| **A. Files schema** | Extend existing `files`; add boolean `library_files`; add `visibility text not null` with values `organization \| teacher \| student \| private`; **no `role` column** (JWT role only) |
| **A2. Parent columns** | **`files` has no `parent_id` / `parent_type`** (verified); link course media via `chapter_files` / `course_files` only |
| **A3. Storage key** | Column `storage_key` / API `storageKey` (provider-neutral; not `r2_key`) |
| **A4. Chunks** | `document_chunks` with **`app_id`**; Shared AI writes/reads; not exposed to frontend |
| **A5. Shared AI** | One FastAPI for many Logic apps; every call sends `app_id` = IAM `applications.id` (`IAM_APP_ID` / JWT `app_id`); ingest uses per-app `callback_url` + optional `download_url` |
| **B. Ingest jobs (MVP)** | HTTP callback only — Logic Service calls FastAPI ingest; FastAPI calls back `POST /file/ingest-status` |
| **C. Route style** | Match current Logic Service paths (`/chat`, `/file`, …), not `/api/chat` |
