# The Church Manager — API Documentation

Complete reference for every HTTP endpoint exposed by the `thechurchmanager_backend` FastAPI service.

- **Base URL (local):** `http://localhost:8000`
- **Base URL (production):** `https://thechurchmanagerbackend-production.up.railway.app`
- **Interactive docs:** `/docs` (Swagger UI), `/redoc` (ReDoc), `/openapi.json` (raw schema)
- **Content type:** `application/json` for all request bodies and responses.

---

## Table of contents

- [Authentication & IAM](#authentication--iam)
- [Response envelopes](#response-envelopes)
- [Health](#health)
- [User](#user)
- [Organization](#organization)
- [Team](#team)
- [Role](#role)
- [User Role](#user-role)
- [Permission](#permission)
- [Module](#module)
- [Plan](#plan)
- [Teacher](#teacher)
- [Student](#student)
- [Class](#class)
- [Inventory](#inventory)
- [Account](#account)
- [Expense](#expense)
- [Song](#song)
- [File](#file)
- [Mail Template](#mail-template)
- [Checklist](#checklist)
- [Service Rota](#service-rota)
- [Rota Song](#rota-song)
- [Root](#root)

---

## Authentication & IAM

Identity and Access Management (IAM) is handled by a **separate service**. Local JWT enforcement is controlled by the `IAM_AUTH_ENABLED` environment variable.

| `IAM_AUTH_ENABLED` | Behavior |
| --- | --- |
| `false` (default) | JWT validation is **skipped**. Org-scoped modules (Checklist, Service Rota) require an `organization_id` (query param or `X-Organization-Id` header) only — the same pattern as `/team/get`. |
| `true` | Requests must include an `Authorization: Bearer <token>` header. The token may be a Supabase session JWT, an app HS256 JWT (signed with `JWT_SECRET`), or the legacy token `thechurchmanager`. Organization scope is resolved from the token claims, query param, header, or a DB lookup. |

**Auth inputs (org-scoped modules):**

| Source | Example |
| --- | --- |
| Query param | `?organization_id=<uuid>` |
| Header | `X-Organization-Id: <uuid>` |
| Bearer token | `Authorization: Bearer <jwt>` (required only when `IAM_AUTH_ENABLED=true`) |

> **Legacy modules** (User, Team, Organization, Role, etc.) do **not** enforce authentication in this backend today. They accept `organization_id` as a filter/body field but do not gate access. Protect them at the gateway/IAM layer for production.

---

## Response envelopes

Two envelope styles exist across the codebase:

**Legacy / Service Rota style**

```json
{ "success": true, "data": ... , "count": 0 }
```

```json
{ "success": false, "error": { "message": "..." } }
```

**Checklist style**

```json
{ "data": ... }
```

```json
{ "error": "..." }
```

Standard HTTP status codes apply: `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `422` Validation Error, `500` Server Error.

---

## Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe. Returns `{ "status": "ok", "db": "connected\|connecting", "time": <iso> }`. Used by Railway health checks. |
| GET | `/health-check/` | Alternate health endpoint. |

No auth required.

---

## User

Tag: `User` · Base prefix: `/user` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/user/get` | Query: `id`, `organization_id` | List users, optionally filtered by id or organization. |
| POST | `/user/save` | Body: user object | Create a user. |
| POST | `/user/login` | Body: `{ email, password }` | Authenticate a user. |
| POST | `/user/bulk-save` | Body: array of user objects | Create multiple users. |
| PUT | `/user/update` | Body: user object with `id` | Update a user. |
| DELETE | `/user/delete/{user_id}` | Path: `user_id` | Delete a user. |

---

## Organization

Tag: `Organization` · Base prefixes: `/organization` **and** `/auth/api/organization` (identical routes mounted twice) · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/organization/get` | Query: `id`, `organization_id` | List organizations. |
| POST | `/organization/save` | Body: organization object | Create an organization. |
| POST | `/organization/sync` | Body: organization object | Upsert/sync an organization (e.g. from the auth service). |
| POST | `/organization/login` | Body: `{ email, password }` | Organization login. |
| POST | `/organization/bulk-save` | Body: array | Create multiple organizations. |
| PUT | `/organization/update` | Body: organization object with `id` | Update an organization. |
| DELETE | `/organization/delete/{organization_id}` | Path: `organization_id` | Delete an organization. |

> The same seven routes are also available under `/auth/api/organization/...`.

---

## Team

Tag: `Team` · Base prefix: `/team` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/team/get` | Query: `id`, `organization_id` | List teams. |
| POST | `/team/save` | Body: team object | Create a team. |
| POST | `/team/bulk-save` | Body: array | Create multiple teams. |
| PUT | `/team/update` | Body: team object with `id` | Update a team. |
| DELETE | `/team/delete/{team_id}` | Path: `team_id` | Delete a team. |

---

## Role

Tag: `Role` · Base prefix: `/role` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/role/get` | Query filters | List roles. |
| POST | `/role/save` | Body: role object | Create a role. |
| POST | `/role/bulk-save` | Body: array | Create multiple roles. |
| PUT | `/role/update` | Body: role object with `id` | Update a role. |
| DELETE | `/role/delete/{role_id}` | Path: `role_id` | Delete a role. |

---

## User Role

Tag: `UserRole` · Base prefix: `/user-role` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/user-role/get` | Query filters | List user-role assignments. |
| GET | `/user-role/get-overview` | Query filters | Aggregated overview of user roles. |
| POST | `/user-role/save` | Body: user-role object | Assign a role to a user. |
| POST | `/user-role/bulk-save` | Body: array | Bulk assign. |
| POST | `/user-role/update-roles` | Body: roles payload | Update the set of roles for a user. |
| PUT | `/user-role/update` | Body: user-role object with `id` | Update an assignment. |
| DELETE | `/user-role/delete/{user_role_id}` | Path: `user_role_id` | Remove an assignment. |

---

## Permission

Tag: `Permission` · Base prefix: `/permission` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/permission/get` | Query filters | List permissions. |
| POST | `/permission/save` | Body: permission object | Create a permission. |
| POST | `/permission/bulk-save` | Body: array | Create multiple permissions. |
| PUT | `/permission/update` | Body: permission object with `id` | Update a permission. |
| DELETE | `/permission/delete/{permission_id}` | Path: `permission_id` | Delete a permission. |

---

## Module

Tag: `Module` · Base prefix: `/module` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/module/get` | Query filters | List modules. |
| POST | `/module/save` | Body: module object | Create a module. |
| POST | `/module/bulk-save` | Body: array | Create multiple modules. |
| PUT | `/module/update` | Body: module object with `id` | Update a module. |
| DELETE | `/module/delete/{module_id}` | Path: `module_id` | Delete a module. |

---

## Plan

Tag: `Plan` · Base prefix: `/plan` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/plan/get` | Query filters | List plans. |
| POST | `/plan/save` | Body: plan object | Create a plan. |
| POST | `/plan/bulk-save` | Body: array | Create multiple plans. |
| PUT | `/plan/update` | Body: plan object with `id` | Update a plan. |
| DELETE | `/plan/delete/{plan_id}` | Path: `plan_id` | Delete a plan. |

---

## Teacher

Tag: `Teacher` · Base prefix: `/teacher` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/teacher/get` | Query filters | List teachers. |
| GET | `/teacher/get/{teacher_id}` | Path: `teacher_id` | Get a teacher by id. |
| POST | `/teacher/save` | Body: teacher object | Create a teacher. |
| POST | `/teacher/bulk-save` | Body: array | Create multiple teachers. |
| PUT | `/teacher/update/{teacher_id}` | Path: `teacher_id`, Body | Update a teacher. |
| DELETE | `/teacher/delete/{teacher_id}` | Path: `teacher_id` | Delete a teacher. |

---

## Student

Tag: `Student` · Base prefix: `/student` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/student/get` | Query filters | List students. |
| GET | `/student/get/{student_id}` | Path: `student_id` | Get a student by id. |
| POST | `/student/save` | Body: student object | Create a student. |
| PUT | `/student/update/{student_id}` | Path: `student_id`, Body | Update a student. |
| DELETE | `/student/delete/{student_id}` | Path: `student_id` | Delete a student. |

---

## Class

Tag: `Class` · Base prefix: `/class` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/class/get` | Query filters | List classes. |
| GET | `/class/get/{class_id}` | Path: `class_id` | Get a class by id. |
| POST | `/class/save` | Body: class object | Create a class. |
| PUT | `/class/update/{class_id}` | Path: `class_id`, Body | Update a class. |
| DELETE | `/class/delete/{class_id}` | Path: `class_id` | Delete a class. |

---

## Inventory

Tag: `Inventory` · Base prefix: `/inventory` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/inventory/get` | Query filters | List inventory items. |
| GET | `/inventory/get/{inventory_id}` | Path: `inventory_id` | Get an inventory item by id. |
| POST | `/inventory/save` | Body: inventory object | Create an inventory item. |
| PUT | `/inventory/update/{inventory_id}` | Path: `inventory_id`, Body | Update an inventory item. |
| DELETE | `/inventory/delete/{inventory_id}` | Path: `inventory_id` | Delete an inventory item. |

---

## Account

Tag: `Account` · Base prefix: `/account` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/account/get` | Query filters | List accounts. |
| POST | `/account/save` | Body: account object | Create an account. |
| PUT | `/account/update/{account_id}` | Path: `account_id`, Body | Update an account. |
| DELETE | `/account/delete/{account_id}` | Path: `account_id` | Delete an account. |

---

## Expense

Tag: `Expense` · Base prefix: `/expense` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/expense/get` | Query filters | List expenses. |
| GET | `/expense/{expense_id}` | Path: `expense_id` | Get an expense by id. |
| POST | `/expense/save` | Body: expense object | Create an expense. |
| POST | `/expense/bulk-save` | Body: array | Create multiple expenses. |
| PUT | `/expense/update/{expense_id}` | Path: `expense_id`, Body | Update an expense. |
| DELETE | `/expense/delete/{expense_id}` | Path: `expense_id` | Delete an expense. |

---

## Song

Tag: `Song` · Base prefix: `/song` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/song/get` | Query filters | List songs. |
| GET | `/song/{song_id}` | Path: `song_id` | Get a song by id. |
| POST | `/song/save` | Body: song object | Create a song. |
| PUT | `/song/update/{song_id}` | Path: `song_id`, Body | Update a song. |
| DELETE | `/song/delete/{song_id}` | Path: `song_id` | Delete a song. |

---

## File

Tag: `File` · Base prefix: `/file` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/file/get` | Query filters | List files. |
| POST | `/file/save` | Body: file object | Create a file record. |
| POST | `/file/bulk-save` | Body: array | Create multiple file records. |
| PUT | `/file/update` | Body: file object with `id` | Update a file record. |
| DELETE | `/file/delete/{file_id}` | Path: `file_id` | Delete a file record. |

---

## Mail Template

Tag: `MailTemplate` · Base prefix: `/mail` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/mail/get-templates` | Query filters | List mail templates. |
| POST | `/mail/save-template` | Body: template object | Create a mail template. |
| POST | `/mail/send-gmail` | Body: `{ to, subject, body, ... }` | Send an email via Gmail SMTP. |
| PUT | `/mail/update-template` | Body: template object with `id` | Update a mail template. |
| DELETE | `/mail/delete-template/{template_id}` | Path: `template_id` | Delete a mail template. |

---

## Checklist

Tag: `Checklist` · Base prefix: `/checklist` · Envelope: **checklist style** (`{ "data": ... }`)

**Auth:** org-scoped. Provide `organization_id` (query) or `X-Organization-Id` (header). When `IAM_AUTH_ENABLED=true`, also send `Authorization: Bearer <token>`.

### Templates

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/checklist/templates` | Query: `organization_id`*, `team_id` | List templates for the org (optionally by team). |
| POST | `/checklist/templates` | Query: `organization_id`*, Body: `ChecklistTemplateCreate` | Create a template with items. Returns `201`. |
| PUT | `/checklist/templates/{template_id}` | Path: `template_id`, Body: `ChecklistTemplateUpdate` | Update a template and its items. |
| DELETE | `/checklist/templates/{template_id}` | Path: `template_id` | Delete a template. |

**`ChecklistTemplateCreate` body:**

```json
{
  "team_id": "uuid",
  "name": "Sunday Setup",
  "description": "optional",
  "is_active": true,
  "items": [
    { "title": "Mixer powered on", "description": "audio", "order": 0, "is_required": true },
    { "title": "Slides ready", "order": 1, "is_required": false }
  ]
}
```

> `items[].order` is optional. When omitted, items are ordered by their array position (`0, 1, 2, …`).

**`ChecklistTemplateUpdate` body:** same fields as create, all optional. Supplying `items` replaces the template's item set (matching items by `id`).

### Records (Live Checklist runs)

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/checklist/records` | Query: `organization_id`*, `date`, `team_id`, `template_id`, `completed_by`, `start_date`, `end_date`, `page` (≥1), `limit` (1–200) | List records (paginated). Returns `{ data, total, page, limit }`. |
| GET | `/checklist/records/{record_id}` | Path: `record_id` | Get a single record with item statuses. |
| POST | `/checklist/records` | Body: `ChecklistRecordCreate` | Start a new run. Returns `201`. `409` if a record already exists for the same org/template/team/date. |
| PUT | `/checklist/records/{record_id}` | Path: `record_id`, Body: `ChecklistRecordUpdate` | Update completion / item statuses. |
| DELETE | `/checklist/records/{record_id}` | Path: `record_id` | Delete a run. Related item statuses are removed via cascade. Returns `{ "data": { "deleted": true, "id": "..." } }`. |

**`ChecklistRecordCreate` body:**

```json
{
  "template_id": "uuid",
  "team_id": "uuid",
  "date": "2026-07-06",
  "completed_by": "optional-name",
  "notes": "optional",
  "item_statuses": [
    { "checklist_item_id": "uuid", "is_checked": true, "issue_reported": null }
  ]
}
```

---

## Service Rota

Tag: `Service Rota` · Base prefix: `/rota` · Envelope: **legacy style** (`{ "success": true, "data": ... }`)

**Auth:** org-scoped, same rules as Checklist. All JSON fields are `snake_case`. This module replaces the deprecated Mongo rota.

### Services

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota/get` | Query: `organization_id`*, `status`, `start_date`, `end_date`, `search`, `sort`, `order`, `page`, `limit` | List services (paginated). |
| POST | `/rota/save` | Body: `RotaServiceCreate` | Create a service. Returns `201`. |
| PUT | `/rota/update/{service_id}` | Path: `service_id`, Body: `RotaServiceUpdate` | Update a service. |
| DELETE | `/rota/delete/{service_id}` | Path: `service_id`, Query: `organization_id`* | Delete a service. |
| POST | `/rota/{status_value}/{service_id}` | Path: `status_value` (`draft`\|`published`\|`completed`\|`cancelled`), `service_id`, Query: `organization_id`* | Set a service's status. |

### Availability

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota/availability` | Query: `organization_id`*, `service_id` | List availability records. |
| POST | `/rota/availability` | Body: `AvailabilityCreate` | Upsert one volunteer's availability. Recomputes `volunteer_count`. |
| POST | `/rota/availability/bulk` | Body: `AvailabilityBulkCreate` | Upsert availability for many volunteers. |

### Assignments

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota/assignments` | Query: `organization_id`*, `service_id`* | List assignments for a service. |
| POST | `/rota/assignments` | Body: `AssignmentCreate` | Create an assignment. Returns `201`. |
| PUT | `/rota/assignments/{assignment_id}` | Path: `assignment_id`, Body: `AssignmentUpdate` | Update an assignment. |

### Attendance

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota/attendance` | Query: `organization_id`*, `service_id`* | List attendance for a service. |
| PATCH | `/rota/attendance/{record_id}` | Path: `record_id`, Body: `AttendancePatch` | Update an attendance record. |
| POST | `/rota/attendance/sync/{service_id}` | Path: `service_id`, Query: `organization_id`* | Generate `pending` attendance rows from assignments. |

### Dashboard & reports

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| GET | `/rota/dashboard` | `organization_id`* | Aggregated service/volunteer stats. |
| GET | `/rota/reports` | `organization_id`* | Availability breakdown by team. |
| GET | `/rota/history` | `organization_id`*, `limit` (1–500) | Audit log entries. |

### Grid & timesheets

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| GET | `/rota/grid` | `organization_id`*, `week_start`*, `team_ids`, `user_ids`, `group_by` (`team`\|`user`) | Weekly rota grid. |
| GET | `/rota/timesheets` | `organization_id`*, `week_start`*, `team_id` | Weekly timesheet view. |

### Volunteer portal

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| GET | `/rota/my/schedule` | `organization_id`*, `start_date`*, `end_date`* | Current volunteer's own upcoming shifts. |
| GET | `/rota/my/rota` | `organization_id`*, `date`* | Own shifts for a single date. |
| GET | `/rota/my/shifts/{shift_date}` | Path: `shift_date`, Query: `organization_id`* | Own shifts for a date (path variant). |

### Clock in / out

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota/clock/sessions` | Query: `organization_id`*, `date`, `status` | List the current user's clock sessions. |
| GET | `/rota/clock/active` | Query: `organization_id`* | Get the current active (clocked-in) session, if any. |
| POST | `/rota/clock/in` | Body: `ClockInCreate` | Clock in. Requires an assignment. Sets attendance `present`/`late` (late = >5 min after scheduled time). Returns `201`. |
| POST | `/rota/clock/out` | Body: `ClockOutCreate` | Clock out of the active/specified session. |

**`RotaServiceCreate` body (key fields):**

```json
{
  "organization_id": "uuid",
  "name": "Sunday Service",
  "date": "2026-07-12",
  "time": "10:00",
  "location": "Main Sanctuary",
  "description": "",
  "languages": ["English"],
  "availability_options": ["available", "available_all_day", "unavailable", "not_sure"],
  "max_volunteers": null,
  "notes": "",
  "status": "draft",
  "team_id": "uuid-or-null"
}
```

---

## Rota Song

Tag: `RotaSong` · Base prefix: `/rota-song` · Envelope: legacy

| Method | Path | Query / Body | Description |
| --- | --- | --- | --- |
| GET | `/rota-song/get` | Query: `id`, `rota_id`, `song_id` | List rota-song links. |
| GET | `/rota-song/{rota_song_id}` | Path: `rota_song_id` | Get a link by id. |
| POST | `/rota-song/save` | Body: rota-song object | Create a link. |
| PUT | `/rota-song/update/{rota_song_id}` | Path: `rota_song_id`, Body | Update a link. |
| DELETE | `/rota-song/delete/{rota_song_id}` | Path: `rota_song_id` | Delete a link. |

---

## Root

Tag: `Root`

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Returns a simple HTML landing page (`THE CHURCH MANAGER`). |
| GET | `/{full_path:path}` | Catch-all; redirects unknown paths to `/`. |

---

## Deprecated / disabled routes

These exist in the codebase but are **not** currently mounted:

- Legacy Mongo rota — superseded by [Service Rota](#service-rota) (`/rota/...`).
- Granular checklist routers (`/checklist-template`, `/checklist-item`, `/checklist-record`, `/checklist-item-status`) — superseded by the [Checklist](#checklist) module (`/checklist/...`).

---

*Generated from the live FastAPI route table. Regenerate the endpoint list any time with:*

```bash
py -3 -c "from main import app; [print(sorted(m for m in r.methods if m not in ('HEAD','OPTIONS')), r.path) for r in app.routes if hasattr(r,'methods')]"
```
