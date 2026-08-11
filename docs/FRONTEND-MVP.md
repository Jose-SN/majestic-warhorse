# Frontend MVP — PetaxAI Logic Service

Short **FE checklist** for Library + AI Mode.  
Do not duplicate API payloads or service internals here — use the links below.

**Index:** [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md)

| Need | Document |
|------|----------|
| Normative Library/Chat contract | [ai-architecture/AI-MVP-SHARED-CONTRACT.md](./ai-architecture/AI-MVP-SHARED-CONTRACT.md) §§1–6 |
| All FE-used endpoints + AI MVP diffs | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) ([usage map](./API_DOCUMENTATION.md#frontend-api-usage-map), [changes](./API_DOCUMENTATION.md#ai-mvp-api-changes)) |
| Shared AI / Logic / IAM architecture | [service_architecture/](./service_architecture/) |
| Angular wiring | [frontend_architecture/FRONTEND-ARCHITECTURE.md](./frontend_architecture/FRONTEND-ARCHITECTURE.md) |
| Phase 2 course-file RAG (later) | [ai-architecture/PHASE-2-COURSE-RAG.md](./ai-architecture/PHASE-2-COURSE-RAG.md) |

---

## FE checklist (Majestic Warhorse)

| Checklist item | Status |
| -------------- | ------ |
| Library `GET/DELETE /file/library`, upload with `library_files` / `bucket_name=library` + session `role` + `visibility` | Done |
| Show `status` + `storageKey`; poll list while `pending`/`processing` (never `/file/ingest-status`) | Done |
| AI Mode `/chat` + conversations CRUD; Bearer + session `role`; render `citations` | Done |
| Do not send `parentId` / `parentType` / file `role` / `r2Key` / `createdBy` / `uploadedBy` / `organizationId` | Done |
| Chat attachments not sent to `/chat` — use Library for RAG | Done |
| Talk only to Logic — never Shared AI or `/file/ingest-status` | Done |
| List with `GET /file/library?role=` from login type (`organization` \| `teacher` \| `student`) | Done |
