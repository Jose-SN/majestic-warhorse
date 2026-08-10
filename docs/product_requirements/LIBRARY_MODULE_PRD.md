# Product Requirements Document (PRD)

## Product

**PetaxAI Learning – Library / Drive Management Module**

## Platform note (adapted)

This repository is an **Angular 18 SPA** (`majestic-warhorse`), not React.  
Implementation lives under `src/app/pages/library-page/` and follows:

- Existing app routing / sidenav patterns
- [design.xml](../design.xml) brand tokens
- [docs/design_v1/](./design_v1/) (cards, tables, buttons, upload, drawers, tabs)

The original React / TanStack Query layout in earlier drafts is **superseded** by this Angular structure.

---

## Goal

Build a file library module that allows Organizations, Teachers, and Students to upload, browse, preview, search, and manage learning files, with storage analytics and role-based visibility.

---

## 1. Business Context

Roles: Organization · Teacher · Student

Centralized cloud drive for PDFs, documents, presentations, images, videos, audio, and other learning materials.

---

## 2. Scope (Phase 1)

**In scope**

- Library dashboard with storage analytics cards
- Upload (drag/drop + browse), list, preview, download, delete
- Role-specific tabs and visibility
- Search / type filter
- Pagination
- Responsive UI
- Service layer with **mock adapter** until backend exists

**Out of scope**

- Collaborative editing, versioning, OCR, AI summarization
- Video transcoding, nested folder hierarchy (categories/tabs only in phase 1)

---

## 3. Permissions

| Feature | Organization | Teacher | Student |
| --- | --- | --- | --- |
| View org files | Yes | No | No |
| View teacher files | Yes | Own (+ assigned students) | No |
| View student files | Yes | Assigned students only | Own only |
| Upload | Yes | Yes | Yes |
| Delete any org file | Yes | No | No |
| Delete own files | Yes | Yes | Yes |
| Storage analytics | Full | Own + students | Own only |

---

## 4. Navigation

- Route: `/library`
- Sidenav: **Library**
- Breadcrumb meta: Home / Library

---

## 5–11. UI / rules

Unchanged from product intent:

- Top analytics cards (used / remaining / videos / documents / images / others)
- Role tabs + file table (preview / download / delete)
- Upload validation (500 MB; docs/media/images allow-lists)
- Preview: PDF embed, image, video, audio; Office → download fallback
- Storage formulas per role (see §11 in product brief)

---

## 12. API (frontend expectations)

Base: `{majesticWarhorseApi}api/library/...`  
Until backend ships, `LibraryService` uses mock data (`useMock: true`).

| Method | Path |
| --- | --- |
| GET | `/api/library/stats` |
| GET | `/api/library/files` |
| POST | `/api/library/upload` |
| DELETE | `/api/library/files/:id` |
| GET | `/api/library/files/:id/preview` |

---

## 13. Angular structure (this repo)

```
src/app/pages/library-page/
  library-page.component.ts
  library-page.component.html
  library-page.component.scss
  library.service.ts
  models/library.models.ts
  data/library.mock.ts
```

Route registration: `app-routing.module.ts` → `path: 'library'`  
Nav: `DASHBOARD_NAV_ROUTES.library` + sidenav item.

---

## 14–23. UX / a11y / acceptance

Follow design_v1:

- Dark surfaces, brand gradient CTAs, 16px cards, 48px buttons, pill radius
- Tables: sticky header, row hover; mobile → stacked cards
- Empty / loading / error via skeletons + toaster
- Hide unauthorized actions in UI; backend remains source of truth

Acceptance criteria match the product brief (org / teacher / student views).

---

## Deliverables

1. Angular Library page + service + types + mock adapter  
2. design_v1 / design.xml-aligned styling  
3. Route + sidenav wiring  
4. This PRD (Angular-adapted)

End of PRD.
