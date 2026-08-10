# Phase 2 — RAG from Library + Course Files

**Status:** Planned (not implemented)  
**Scope:** Extend AI Mode answers to include **course / chapter attachments** in addition to **Library** files.  
**Constraint:** Phase 1 (current MVP) stays **library-only**. Do **not** change Library upload, list, delete, or ingest rules until this phase is scheduled.

**Related docs:**

- [AI-MVP-SHARED-CONTRACT.md](./AI-MVP-SHARED-CONTRACT.md) — Phase 1 contract (library + chat)
- [AI-ARCHITECTURE.md](../service_architecture/AI-ARCHITECTURE.md) — architecture + data ownership
- [LEARNING_ARCHITECTURE.md](../service_architecture/LEARNING_ARCHITECTURE.md) — current Logic course/file model
- [IAM-ARCHITECTURE.md](../service_architecture/IAM-ARCHITECTURE.md) — JWT / org / app identity
- [FRONTEND-MVP.md](../FRONTEND-MVP.md) — Phase 1 FE checklist

---

## 1. Goal

When a user asks AI Mode a question, the answer corpus should be:

1. **Library files** they are allowed to see (existing Phase 1 visibility rules), **plus**
2. **Course attachment files** for courses they can access:
   - courses **owned by their organization**, and/or
   - courses they are **subscribed to / enrolled in / otherwise granted access** (product rule — see §4)

Same idea for organization admins: org library documents **and** materials from courses the org owns (and optionally all courses the org can access).

Chat attachments remain out of scope: knowledge still comes from ingested files, not from files attached to a single chat message.

---

## 2. Current state (Phase 1 — do not break)

### 2.1 Two file kinds, one `files` table

| Kind | How linked | `library_files` | Ingested for RAG today? |
| ---- | ---------- | --------------- | ----------------------- |
| **Library** | `POST /file/upload` with `library_files=true` / `bucket_name=library` | `true` | **Yes** |
| **Course media** | `course_files` / `chapter_files` junctions | `false` (default) | **No** |

Verified model (Phase 1):

- `files` has **no** `parent_id` / `parent_type`
- Course media links **only** via:
  - `chapter_files (chapter_id, file_id, …)`
  - `course_files (course_id, file_id)`
- RAG eligibility today: `library_files = true` **AND** `status = 'ready'` **AND** matching `app_id`

Docs explicitly mark junctions as **“course media — not used by RAG ingest.”**

### 2.2 Phase 1 happy path (unchanged)

```text
FE Library → Logic POST /file/upload (library)
  → R2 + files row (library_files=true, status pending/processing)
  → Logic → Shared AI POST /ingest (app_id + callback_url)
  → AI chunks/embeds → POST Logic /file/ingest-status → status ready|failed
  → FE polls GET /file/library (never calls ingest-status)

FE AI Mode → Logic POST /chat
  → Logic → Shared AI POST /ask (app_id + org + user + role)
  → Retrieve only ready library chunks for that app/org/visibility
  → Answer + citations → FE
```

### 2.3 Course upload path today (content only, no AI)

```text
FE Course upload → POST /file/upload (e.g. bucket_name=course)
  → Logic stores file + links via chapter_files / course_files
  → No /ingest in Phase 1
  → Course GET APIs return URLs for playback/download only
```

### 2.4 Access model gap (important for Phase 2)

Per current Logic backend notes:

- There is **no dedicated enrolment / “subscribed courses” entity**
- Learning access is implied by:
  1. Org roster (`user_roles`)
  2. Teacher–student pairing (`teacher_students`)
  3. Course `access` (`public` | `private`)
  4. Soft feed filters on list endpoints (not hard enforcement on every `GET /course/:id`)

Phase 2 **must** define a concrete “allowed courses” rule before expanding RAG. Prefer a real enrolment/subscription source of truth if “subscribe” is a product requirement.

---

## 3. Target behavior (Phase 2)

### 3.1 End-to-end flow

```text
Course / chapter attachment upload (or backfill)
  → Logic: R2 + files + course_files / chapter_files
  → Logic: POST Shared AI /ingest (same pipeline as library)
  → AI: extract → chunk → embed → store document_chunks
       (include source_type + course_id / chapter_id in metadata)
  → AI → Logic POST /file/ingest-status → files.status = ready|failed

User asks AI Mode
  → FE → Logic POST /chat (question + conversation_id only; JWT Bearer)
  → Logic resolves from JWT:
       • org, user, role
       • library visibility scope (Phase 1)
       • allowed_course_ids (Phase 2 — see §4)
  → Logic → Shared AI POST /ask (+ allowed course scope)
  → AI retrieves:
       library ready chunks (visibility rules)
       ∪ course-linked ready chunks for allowed courses
  → Answer + citations (distinguish Library vs Course when possible)
  → Logic persists assistant message → FE renders
```

### 3.2 Actors (unchanged topology)

| Piece | Role in Phase 2 |
| ----- | --------------- |
| **Angular FE** | Still talks **only** to Logic. Never calls Shared AI or `/file/ingest-status`. |
| **Shared IAM** | JWT with user id, `organization_id`, preferably `role` (+ optional `app_id`). |
| **Logic** | Library (unchanged) + **ingest course attachments** + compute **allowed courses** for `/ask`. |
| **Shared AI** | Ingest course files; retrieve library ∪ allowed course chunks; filter by `app_id`. |
| **R2 / CDN** | File bytes; AI prefers `download_url` else `storage_key`. |

```text
Browser ──JWT──► Logic ──app_id──► Shared AI
                   │                  │
                   │                  └── callback_url → /file/ingest-status
                   ├── files (library + course-linked)
                   ├── course_files / chapter_files
                   ├── conversations / messages
                   └── document_chunks (MVP: Logic DB; AI writes/reads)
```

---

## 4. Access rules (decide before coding)

### 4.1 Proposed default matrix

| Actor | Library (Phase 1) | Course files in RAG (Phase 2) |
| ----- | ----------------- | ----------------------------- |
| **Org admin** | All org library (visibility does not restrict admins) | Files linked to courses where `courses.organization_id = caller org` |
| **Teacher** | Own + visibility in (`organization`, `teacher`) (+ assigned student docs if product requires) | Files for courses they **created**, plus org **public** courses (and optionally courses tied to their assigned students) |
| **Student** | Own + visibility in (`organization`, `student`) | Files for courses in their **accessible set** (see §4.2) |
| **Private library** | Owner (+ org admin) only | N/A for course media unless product marks course files with visibility |

### 4.2 Student / user “accessible set” (choose one or combine)

Pick and document the product rule:

1. **Org public catalog** — `courses.access = public` AND `organization_id = caller org`
2. **Assigned teachers** — courses whose `created_by` ∈ teachers linked via `teacher_students` for this student
3. **Real enrolment / subscription** — rows in a dedicated table (recommended if billing or “subscribe” is real), e.g. `course_enrollments (user_id, course_id, organization_id, status)`
4. **IAM billing subscriptions** — if course packs are sold in IAM, Logic must sync or query which course IDs the org/user paid for

**Recommendation:** implement (1)+(2) as an interim rule only if enrolment is still missing; move to (3) before calling the feature production-safe.

### 4.3 Security rules

- Never trust `allowed_course_ids` from the browser. Logic (or AI reading Logic DB with the same rules) must derive them from JWT + DB.
- Direct `GET /course/:id` today may not enforce enrolment — RAG must not inherit that hole. Allowed-course computation for `/ask` must be authoritative.
- Cross-org leakage forbidden: always filter `app_id` + `organization_id` (and course org where applicable).

---

## 5. Data model changes

### 5.1 Keep Phase 1 `files` shape

Do **not** reintroduce `parent_id` / `parent_type` / file `role` / `r2_key` for AI.

Course linkage stays on junctions:

```text
files ←── course_files ──→ courses
files ←── chapter_files ──→ chapters ──→ courses (via course_chapters / chapter.course_id)
```

### 5.2 Course file row conventions

| Field | Phase 2 expectation |
| ----- | ------------------- |
| `library_files` | Remain `false` for course media (Library stays `true`) |
| `organization_id` | Set from course org (or JWT) so retrieval can scope |
| `status` | Same ingest lifecycle: `pending` → `processing` → `ready` \| `failed` |
| `storage_key` / download URL | Required for AI ingest |
| `visibility` | Optional for course media; primary gate is **course access**, not library visibility |

Optional later: add `source_type` column on `files` (`library` \| `course`) for clearer queries. Not required if junctions + `library_files` are enough.

### 5.3 `document_chunks` metadata (required for retrieval)

Phase 1 chunks already have `app_id`, `organization_id`, `created_by`, `file_id`, `metadata jsonb`, embeddings.

Phase 2 should store on each chunk (columns **or** `metadata` JSON):

| Field | Purpose |
| ----- | ------- |
| `source_type` | `library` \| `course` |
| `course_id` | For course-linked files |
| `chapter_id` | When linked via `chapter_files` |
| `file_name` / titles | Better citations |

Eligibility becomes:

```text
status = ready
AND app_id matches
AND (
  (library_files = true AND visibility/role/owner rules)
  OR
  (file linked via course_files/chapter_files AND course_id ∈ allowed_course_ids
   OR org-admin rule on course.organization_id)
)
```

### 5.4 Enrolment table (recommended)

If product language is “subscribe”:

```sql
-- illustrative only
course_enrollments (
  id uuid primary key,
  organization_id uuid not null,
  user_id uuid not null,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null, -- active | canceled | …
  created_at timestamptz,
  unique (user_id, course_id)
);
```

Wire org/user “subscribe” flows to this table (or sync from IAM billing).

---

## 6. Logic Service changes

### 6.1 Ingest course attachments

Trigger Shared AI `POST /ingest` when:

1. A file is uploaded/saved and linked through `course_files` or `chapter_files`
2. Optionally when an existing link is created later
3. **Backfill job** for historical course/chapter files (one-off)

Use the same callback: `POST /file/ingest-status` with shared secret.

If `AI_ENABLED=false`, leave `status = pending` (same as library). On ingest HTTP failure → `failed`.

**Do not** change Library ingest behavior.

### 6.2 Enrich ingest payload

Extend Logic → AI `/ingest` body (additive fields):

```json
{
  "app_id": "<IAM applications.id>",
  "file_id": "uuid",
  "storage_key": "course/....pdf",
  "download_url": "https://cdn.../...",
  "organization_id": "uuid",
  "created_by": "uuid",
  "filename": "lesson-notes.pdf",
  "mime_type": "application/pdf",
  "visibility": "private",
  "callback_url": "https://logic.../file/ingest-status",
  "source_type": "course",
  "course_id": "uuid",
  "chapter_id": "uuid"
}
```

Library ingest continues to send `source_type: "library"` (or omit and default to library).

### 6.3 Expand `/chat` → `/ask` authorization context

Before calling Shared AI `/ask`, Logic should compute:

- existing JWT context: `organization_id`, `created_by`, `role`
- **`allowed_course_ids: string[]`** from §4 rules

Example ask body (additive):

```json
{
  "app_id": "<IAM applications.id>",
  "conversation_id": "uuid",
  "question": "…",
  "organization_id": "uuid",
  "created_by": "uuid",
  "role": "student",
  "allowed_course_ids": ["uuid-1", "uuid-2"]
}
```

Alternative: AI queries Logic DB and applies the same SQL Logic uses for “courses I can see.” Prefer one source of truth; avoid diverging FE/Logic/AI rules.

### 6.4 Delete / cascade

- Deleting a library file: unchanged (chunks cascade on `file_id`)
- Deleting a course file / unlinking: ensure chunks for that `file_id` are removed (cascade or explicit AI cleanup)
- Deleting a course: decide whether files are deleted or orphaned; chunks must follow file deletion

### 6.5 Logic checklist (Phase 2)

- [ ] Ingest on course/chapter file save + link
- [ ] Backfill script for existing course attachments
- [ ] Pass `source_type` / `course_id` / `chapter_id` on ingest
- [ ] Compute `allowed_course_ids` (or equivalent) for `/chat`
- [ ] Enrolment/subscription table or documented interim rule
- [ ] Library path unchanged and regression-tested
- [ ] Still never expose chunk CRUD to the browser

---

## 7. Shared AI Service changes

### 7.1 Ingest

- Accept course files the same as library (prefer `download_url`)
- Do **not** require `library_files = true` to write chunks
- Persist `source_type` / `course_id` / `chapter_id` on chunks
- Callback Logic with `ready` / `failed` as today

### 7.2 Ask / retrieval

Replace “only ready library files” with library ∪ allowed courses:

```text
chunks WHERE app_id = :app_id
  AND organization_id = :org_id   -- plus org-admin nuances if needed
  AND file.status = 'ready'
  AND (
    (source_type = 'library' AND visibility allows role/owner)
    OR
    (source_type = 'course' AND course_id = ANY(:allowed_course_ids))
  )
```

Join path if metadata incomplete:

```text
document_chunks
  → files
  → (chapter_files | course_files)
  → chapters / courses
```

### 7.3 Citations

Prefer richer citations for course sources, e.g.:

```json
{
  "file": "lesson-notes.pdf",
  "page": 3,
  "file_id": "uuid",
  "source_type": "course",
  "course_id": "uuid",
  "course_title": "Physics Grade 10",
  "chapter_title": "Newton’s laws"
}
```

### 7.4 AI checklist (Phase 2)

- [ ] Ingest without `library_files` gate
- [ ] Store course metadata on chunks
- [ ] Retrieval respects `allowed_course_ids` + library visibility
- [ ] Citations distinguish Library vs Course
- [ ] Multi-app isolation via `app_id` unchanged

---

## 8. Frontend changes (minimal)

Phase 2 should **not** require the browser to send course IDs or file IDs for RAG.

| Area | Change |
| ---- | ------ |
| AI Mode `/chat` | Keep `{ question, conversation_id? }` + Bearer |
| Attach panel | Still points users to Library for uploads; optionally mention course materials are included when ready |
| Citations UI | Render optional course/chapter labels when API returns them |
| Course upload UI | Usually **no change** if Logic ingests on existing upload/link; optional: show ingest `status` on attachments |
| Library UI | **No required change** |

FE must still:

- Never call Shared AI or `/file/ingest-status`
- Never send `parentId` / `parentType` / file `role` / `r2Key` / body `organization_id` / `created_by`

---

## 9. IAM

Mostly unchanged:

- JWT must include user id + `organization_id` (+ role)
- `IAM_APP_ID` / JWT `app_id` still partitions Shared AI

Only if subscriptions live in IAM billing: define how Logic learns which course IDs an org/user paid for (sync job or IAM API).

---

## 10. What stays out of Phase 2 (unless explicitly added)

- Sending arbitrary chat attachments into `/chat` as RAG context
- Frontend calling Shared AI directly
- Reintroducing `parent_id` / `parent_type` on `files` for AI
- Changing Phase 1 Library visibility semantics
- Using non-ready files (`pending` / `processing` / `failed`) in retrieval

---

## 11. Suggested implementation order

1. **Lock access rules** (§4) with product — especially “subscribe.”
2. **Logic: ingest course attachments** + status callback (no ask change yet).
3. **Backfill** existing course/chapter files.
4. **AI: store course metadata** on chunks.
5. **Logic: compute `allowed_course_ids`** for `/chat`.
6. **AI: expand `/ask` retrieval** to library ∪ allowed courses.
7. **Citations + FE polish.**
8. **Harden enrolment** if interim rules were used.
9. Regression: Library-only orgs/users still behave correctly.

---

## 12. Verification checklist (when implementing)

Open Logic + AI codebases and confirm, then update this doc with file/function pointers:

1. Does upload only call `/ingest` when `library_files` / bucket `library` today?
2. Does `/ask` hardcode `library_files = true`?
3. Do course uploads create `files` rows with `status`?
4. Is there an enrolment table, or only `access` + `teacher_students`?
5. Can AI join `chapter_files` / `course_files`, or only see `files` / chunk metadata?

### Acceptance criteria

- [ ] New course/chapter document attachments become `ready` and answerable in AI Mode for authorized users
- [ ] Users **without** access to a course do **not** get answers from that course’s files
- [ ] Library-only answers still work when no course files match
- [ ] Org admin can answer from org library + org course materials (per §4)
- [ ] Deleting a course file removes its chunks from future answers
- [ ] FE still only talks to Logic

---

## 13. Open decisions (fill before build)

| # | Decision | Options / notes | Owner |
| - | -------- | --------------- | ----- |
| 1 | Student accessible courses | public org / assigned teachers / enrolments / IAM billing | |
| 2 | Teacher course scope | own only vs own + public vs all org | |
| 3 | Store course ids | `metadata` JSON vs dedicated columns | |
| 4 | `allowed_course_ids` | Logic sends list vs AI queries DB | |
| 5 | Backfill | all historical files vs last N months / MIME whitelist | |
| 6 | Non-text course media | skip video/audio for RAG? OCR images? | |
| 7 | Enrolment table | add now vs interim rules | |

---

*Phase 1 remains library-only. This document is the Phase 2 implementation brief for course-file RAG.*
