# IAM API Documentation

Identity & Access Management service for PetaxAI. This document describes every HTTP API exposed by the service.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication & Headers](#authentication--headers)
- [Standard Response Format](#standard-response-format)
- [Health Check](#health-check)
- [User APIs](#user-apis)
- [Organization APIs](#organization-apis)
- [Application APIs](#application-apis)
- [Role APIs](#role-apis)
- [Module APIs](#module-apis)
- [Permission APIs](#permission-apis)
- [OTP APIs](#otp-apis)
- [Mail Template APIs](#mail-template-apis)
- [File APIs](#file-apis)
- [Billing & Subscription APIs](#billing--subscription-apis)
- [Endpoint Summary](#endpoint-summary)

---

## Overview

- **Framework:** Express (TypeScript), served via `serverless-http`.
- **Database:** PostgreSQL (Supabase) accessed through the `pg` connection pool.
- **Auth:** JWT (Bearer) for protected endpoints; application scoping via the `x-app-id` header.
- **WebSocket:** A WebSocket server is initialized alongside the HTTP server.

## Base URL

All routes are mounted under the `/auth/api` prefix.

```
{HOST}/auth/api
```

For local development the default port is `5000` (`8080` in Docker):

```
http://localhost:5000/auth/api
```

## Authentication & Headers

| Header | Description | Applies to |
|---|---|---|
| `Content-Type: application/json` | Required for JSON request bodies | POST/PUT endpoints (except file upload) |
| `x-app-id: <application-id>` | Application scoping. Validated against the `applications` table. Returns `400` if missing or invalid. | Endpoints using the `appId` middleware |
| `Authorization: Bearer <jwt>` | JWT issued by login / password confirmation / sync flows. Returns `401` if missing/expired/invalid. | Endpoints using the `auth` middleware |

**JWT (`auth`) middleware behavior:**
- Missing token → `401 { "msg": "No token, authorization denied" }`
- Expired token → `401 { "msg": "Token expired" }`
- Invalid token → `401 { "msg": "Token is not valid" }`

**App ID (`appId`) middleware behavior:**
- Missing/empty `x-app-id` → `400 { "success": false, "message": "x-app-id header is required" }`
- Unknown application → `400 { "success": false, "message": "Invalid application" }`

## Standard Response Format

Most endpoints return a consistent envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Human-readable failure message",
  "error": "Detailed error string"
}
```

> Note: Some endpoints (e.g. `POST /user/save`, `POST /user/login`) return the raw service payload directly and may respond with HTTP `200` even for logical failures, carrying `success: false` inside the body. Individual endpoints below note these cases.

---

## Health Check

### Check service health

```
GET /auth/api/health-check
```

Accepts any HTTP method (`all`). No auth required.

**Response `200`:**
```json
{
  "timeZone": "2026-07-06T09:56:00.000Z",
  "code": 200,
  "message": "success"
}
```

---

## User APIs

Base path: `/auth/api/user`

### User object

```jsonc
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "profile_image": "https://...",
  "about": "string",
  "is_imported": false,
  "is_password_hashed": false,
  "organization_id": "org-uuid",
  "app_id": "app-uuid",
  "role": "member",              // admin | member | volunteer | guest | teacher | student | inventory-manager
  "teams": ["team-id"],
  "social": { "facebook": "", "instagram": "", "youtube": "" },
  "contact": { "email": "john@example.com", "phone": "", "website": "", "address": "" },
  "status": "active",            // active | pending | suspended | deleted | rejected
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Get users

```
GET /auth/api/user/get
```

**Middleware:** `appId`

**Query parameters (all optional):** `id`, `organization_id`, `status`, `email`, `first_name`, `last_name`, `team`

**Response `200`:**
```json
{ "success": true, "message": "Success", "data": [ /* User[] */ ] }
```

### Create user

```
POST /auth/api/user/save
```

**Middleware:** `appId`, schema validation

**Body:** User object fields (see above). At minimum a `contact.email` is expected for de-duplication.

**Response:** Returns the service payload directly. If a matching imported user without a password exists, the response carries `success: false` with the existing user data for password setup.

### Sync user (idempotent find-or-create)

```
POST /auth/api/user/sync
```

**Middleware:** `appId`, schema validation

Finds a user by `contact.email` + `app_id`. If found, patches profile fields; otherwise creates a new user with safe defaults (`status` defaults to `pending`).

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "profile_image": "https://...",
  "contact": { "email": "john@example.com", "phone": "+44..." },
  "organization_id": "org-uuid",
  "role": "member"
}
```

**Response `200`:**
```json
{ "success": true, "message": "User synced successfully", "data": { /* User */ }, "error": null }
```

**Errors:** `400` on sync failure; `200` with `success: false` when `email` is missing.

### Bulk create users

```
POST /auth/api/user/save-bulk
```

**Middleware:** `appId`, schema validation

**Body:**
```json
{
  "users": [ { "contact": { "email": "a@x.com" }, "first_name": "A" } ],
  "extra_variables": { }
}
```
(A bare array is also accepted in place of `{ "users": [...] }`.)

**Response:** `200` when all saved; may return `207`-style mixed result inside the body with `saved` and `errors` arrays. `400` when the array is empty.

### User login

```
POST /auth/api/user/login
```

**Middleware:** `appId`, login schema, schema validation

**Body:**
```json
{ "email": "john@example.com", "password": "min-8-chars" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": { "id": "uuid", "first_name": "John", "contact": { "email": "..." }, "jwt": "eyJ..." }
}
```

### Update user

```
PUT /auth/api/user/update
```

**Middleware:** `appId`, schema validation

**Body:** User object with `id` and the fields to update.

**Response `200`:**
```json
{ "success": true, "message": "Successfully updated", "data": { /* User */ } }
```

### Approve teachers (bulk status update)

```
PUT /auth/api/user/approve-teachers
```

**Middleware:** schema validation

Bulk-updates teacher user status.

### Forgot password

```
POST /auth/api/user/forgot-password
```

**Middleware:** forgot schema, schema validation

**Body:**
```json
{ "email": "john@example.com" }
```

Generates an OTP and (optionally) emails it. Returns the userId and OTP metadata.

### Confirm password (reset via OTP)

```
POST /auth/api/user/confirm-password
```

**Middleware:** schema validation

**Body:**
```json
{ "email": "john@example.com", "otp": 12345, "password": "new-min-8-chars" }
```

**Response `200`:**
```json
{ "success": true, "message": "Password updated successfully", "data": { /* validated user with jwt */ } }
```

Failure cases return `success: false` with messages like `Invalid OTP. Please try again.` or `OTP has expired`.

### Delete user

```
DELETE /auth/api/user/delete/:userid
```

**Middleware:** `auth`, remove schema, schema validation

**Path params:** `userid` (required)

**Response `200`:**
```json
{ "success": true, "message": "Successfully deleted" }
```

---

## Organization APIs

Base path: `/auth/api/organization`

### Organization object

```jsonc
{
  "id": "uuid",
  "name": "Acme Church",
  "contact": { "email": "info@acme.org", "phone": "", "website": "", "address": "", "officeHours": "" },
  "additional_information": { },
  "about": "string",
  "leadership": [ { "role": "Pastor", "name": "Jane" } ],
  "profile_image": "https://...",
  "cover_image": "https://...",
  "social": { "facebook": "", "instagram": "", "youtube": "", "twitter": "" },
  "title": "string",
  "volunteers": ["user-id"],
  "plan": 1,
  "app_id": "app-uuid",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Get organizations

```
GET /auth/api/organization/get
```

**Middleware:** `appId`

**Query parameters (optional):** `id`, `email`, `name`

**Response `200`:** `{ "success": true, "message": "Success", "data": [ /* Organization[] */ ] }`

### Get organizations for users (public list)

```
GET /auth/api/organization/get-for-users
```

No auth required. Returns a simplified organization list for user-facing selection.

### Get organization by ID

```
GET /auth/api/organization/get/:id
```

**Path params:** `id`

**Response `200`:** `{ "success": true, "message": "Success", "data": { /* Organization */ } }`

### Get organization users

```
GET /auth/api/organization/users
```

**Middleware:** `auth`

Returns the users belonging to an organization.

### List organizations for current user

```
GET /auth/api/organization/list
```

**Middleware:** `auth`, `appId`

Returns organizations that the authenticated user belongs to, with membership role.

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    { "organization": { /* Organization */ }, "membership": { "user_id": "uuid", "role": "owner" } }
  ]
}
```

`401` if the JWT has no user id.

### Create organization

```
POST /auth/api/organization/save
```

**Middleware:** `appId`, schema validation. If a JWT is provided, the caller is linked as `owner`.

**Body:**
```json
{
  "name": "Acme Church",
  "contact": { "email": "info@acme.org", "phone": "+44...", "website": "https://acme.org" },
  "about": "About us"
}
```

**Response:** service payload. If the organization already exists and requires password setup, the error response carries the existing organization under `organization`.

### Sync organization (idempotent find-or-create)

```
POST /auth/api/organization/sync
```

**Middleware:** `appId`, schema validation. Optional JWT to attach caller as owner.

Finds an organization by `contact.email` + `app_id`. If found, returns it (and ensures owner link); otherwise creates it.

**Body:**
```json
{
  "name": "Acme Church",
  "contact": { "email": "info@acme.org" },
  "additional_information": { "supabase_url": "...", "supabase_key": "..." }
}
```

**Response `200`:**
```json
{ "success": true, "message": "Organization synced successfully", "data": { /* Organization */ }, "error": null }
```

### Update organization

```
PUT /auth/api/organization/update
```

**Middleware:** `auth`, organization update schema, schema validation

**Body:** Organization object with `id` plus fields to update.

**Response `200`:** `{ "success": true, "message": "Successfully updated", "data": { /* Organization */ } }`

### Organization login

```
POST /auth/api/organization/login
```

**Middleware:** `appId`, organization login schema

**Body:**
```json
{ "email": "info@acme.org", "password": "min-8-chars" }
```

**Response `200`:** `{ "success": true, "message": "Organization logged in successfully", "data": { /* org with jwt */ } }`

### Organization forgot password

```
POST /auth/api/organization/forgot-password
```

**Middleware:** organization forgot schema, schema validation

**Body:** `{ "email": "info@acme.org" }`

### Organization confirm password

```
POST /auth/api/organization/confirm-password
```

**Middleware:** schema validation

**Body:**
```json
{ "organizationId": "uuid", "otp": 12345, "password": "new-min-8-chars" }
```

### Delete organization

```
DELETE /auth/api/organization/delete/:organizationid
```

**Middleware:** `auth`, remove schema, schema validation

**Path params:** `organizationid` (required)

---

## Application APIs

Base path: `/auth/api/application`

### Get applications

```
GET /auth/api/application/get
```

No auth required. Returns all applications.

### Get application by ID

```
GET /auth/api/application/get/:id
```

**Path params:** `id`

---

## Role APIs

Base path: `/auth/api/role`. All endpoints require `auth`.

### Role object

```jsonc
{
  "id": "uuid",
  "name": "Admin",
  "description": "string",
  "team_id": "team-uuid",
  "organization_id": "org-uuid",
  "type": "string",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Get all roles

```
GET /auth/api/role/get
```

### Get roles with filters

```
GET /auth/api/role/filter
```

**Query parameters:** `organization_id`, `team_id`, `type`, `id`, `name`

### Get role by ID

```
GET /auth/api/role/get/:roleId
```

Returns `404` if not found.

### Create role

```
POST /auth/api/role/save
```

**Middleware:** `auth`, schema validation

**Body:** `{ "name": "Admin", "description": "", "organization_id": "org-uuid", "team_id": "team-uuid", "type": "" }`

### Bulk create roles

```
POST /auth/api/role/save-bulk
```

### Update role

```
PUT /auth/api/role/update/:roleId
```

### Delete role

```
DELETE /auth/api/role/delete/:roleId
```

---

## Module APIs

Base path: `/auth/api/module`. All endpoints require `auth`.

### Module object

```jsonc
{
  "id": "uuid",
  "name": "Attendance",
  "key": "attendance",
  "description": "string",
  "organization_id": "org-uuid",
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Get all modules

```
GET /auth/api/module/get
```

### Get module by ID

```
GET /auth/api/module/get/:moduleId
```

Returns `404` if not found.

### Create module

```
POST /auth/api/module/save
```

**Body:** `{ "name": "Attendance", "key": "attendance", "description": "", "organization_id": "org-uuid" }`

### Bulk create modules

```
POST /auth/api/module/save-bulk
```

**Body:** `{ "modules": [ { "name": "...", "key": "..." } ] }`

### Update module

```
PUT /auth/api/module/update/:moduleId
```

### Delete module

```
DELETE /auth/api/module/delete/:moduleId
```

---

## Permission APIs

Base path: `/auth/api/permission`. All endpoints require `auth`.

### Permission object

```jsonc
{
  "id": "uuid",
  "organization_id": "org-uuid",
  "role_id": "role-uuid",
  "module_id": "module-uuid",
  "team_id": "team-uuid",
  "permissions": { "View": true, "Create": false, "Edit": false, "Delete": false },
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Get all permissions

```
GET /auth/api/permission/get
```

**Query parameters (optional):** `organization_id`

### Get permissions with filters

```
GET /auth/api/permission/filter
```

**Query parameters:** `organization_id`, `role_id`, `module_id`, `team_id`, `id`

### Get permission by ID

```
GET /auth/api/permission/get/:permissionId
```

### Get permissions by role

```
GET /auth/api/permission/role/:roleId
```

### Get permissions by module

```
GET /auth/api/permission/module/:moduleId
```

### Get permissions by team

```
GET /auth/api/permission/team/:teamId
```

### Create permission

```
POST /auth/api/permission/save
```

**Body:** Permission object (without `id`).

### Bulk create/update permissions

```
POST /auth/api/permission/save-bulk
```

### Update permission

```
PUT /auth/api/permission/update/:permissionId
```

### Delete permission

```
DELETE /auth/api/permission/delete/:permissionId
```

---

## OTP APIs

Base path: `/auth/api/otp`. No auth middleware on these routes.

### Save OTP

```
POST /auth/api/otp/save
```

**Body:**
```json
{ "email": "john@example.com", "sendEmail": true }
```

`email` is required (`400` otherwise). `sendEmail` defaults to `true`.

**Response `200`:** `{ "success": true, "message": "OTP saved successfully", "data": { } }`

### Get OTP by user

```
GET /auth/api/otp/get/:userId
```

**Path params:** `userId`
**Query parameters (optional):** `otp` (numeric)

Returns `404` if not found or expired.

### Update OTP

```
PUT /auth/api/otp/update
```

**Body:** `{ "userId": "uuid", "otp": 12345 }` (both required)

### Delete OTP

```
DELETE /auth/api/otp/delete/:otpId
```

**Path params:** `otpId`

### Delete expired OTPs (cleanup)

```
DELETE /auth/api/otp/delete-expired
```

**Response `200`:** `{ "success": true, "message": "Expired OTPs deleted successfully", "data": { "deletedCount": 3 } }`

### Verify OTP

```
POST /auth/api/otp/verify-otp
```

**Body:**
```json
{ "email": "john@example.com", "otp": 12345, "type": "user" }
```

`email` and `otp` are required. `otp` must be numeric.

**Response `200`:** `{ "success": true, "message": "...", "data": { } }`
**Response `400`:** invalid/expired OTP.

---

## Mail Template APIs

Base path: `/auth/api/mail-template`

### Get mail templates

```
GET /auth/api/mail-template/get
```

No auth required.

### Create mail template

```
POST /auth/api/mail-template/save
```

**Middleware:** `auth`, schema validation

### Update mail template

```
PUT /auth/api/mail-template/update
```

**Middleware:** `auth`, schema validation

### Delete mail template

```
DELETE /auth/api/mail-template/delete/:mailTemplateid
```

**Middleware:** `auth`, schema validation
**Path params:** `mailTemplateid`

---

## File APIs

Base path: `/auth/api/file`. Files are stored in AWS S3.

### List files

```
GET /auth/api/file/get
```

Returns S3 objects under the `betrack-uploads/` prefix.

**Response `200`:** `[ { "key": "...", "lastModified": "...", "size": 1234 } ]`

### Get / stream file by ID

```
GET /auth/api/file/get/:fileId
```

Streams the file. Video content types are streamed inline; others are sent as attachments. Returns `404` if not found.

### Get blob by URL (proxy)

```
POST /auth/api/file/get-blob
```

**Body:** `{ "fileUrl": "https://..." }`

Streams the remote file back to the client. `400` if `fileUrl` is missing.

### Save file metadata

```
POST /auth/api/file/save
```

**Body:** File metadata object.

**Response `200`:** `{ "success": true, "message": "Successfully added", "data": { } }`

### Upload file (multipart)

```
POST /auth/api/file/upload
```

**Content-Type:** `multipart/form-data`
**Form field:** `file` (single file). Max size governed by `FILEUPLOADLIMIT` (GB).

**Response `200`:** `{ "message": "File uploaded successfully", "url": "https://<bucket>.s3.<region>.amazonaws.com/..." }`

### Update file (multipart)

```
PUT /auth/api/file/update/:fileId
```

**Content-Type:** `multipart/form-data`, form field `file`.
**Path params:** `fileId`

### Delete file

```
DELETE /auth/api/file/delete/:fileId
```

**Path params:** `fileId`

---

## Billing & Subscription APIs

Mounted at the root of `/auth/api` (no additional sub-prefix).

### Plans

#### Create plan

```
POST /auth/api/plans
```

**Middleware:** create plan schema, schema validation

**Body:**
```json
{
  "name": "Pro",
  "code": "pro",
  "price_monthly": 29.99,
  "currency": "USD"
}
```
`name` and `code` are required. `currency` must be 3 characters. The `app_id` is taken from the `x-app-id` header when present.

**Response `201`:** `{ "success": true, "data": { }, "message": "Plan saved" }`

#### Get plans

```
GET /auth/api/plans
GET /auth/api/plans/get
```

**Query parameters (optional):** `app_id` (used when `x-app-id` header is absent)

**Response `200`:** `{ "success": true, "data": [ /* plans */ ], "message": "Success" }`

#### Save plans (bulk)

```
POST /auth/api/plans/save
```

**Middleware:** `appId`

**Body:** array/collection of plan definitions.

#### Upsert plan features

```
POST /auth/api/plans/:id/features
```

**Middleware:** plan features schema, schema validation
**Path params:** `id` (plan id)

**Body:**
```json
{
  "features": [
    { "feature_key": "max_users", "is_enabled": true, "feature_limit": 100, "feature_value": { } }
  ]
}
```

### Subscriptions

#### Create subscription

```
POST /auth/api/subscriptions
```

**Middleware:** `appId`, create subscription schema, schema validation

**Body:**
```json
{
  "organization_id": "org-uuid",
  "plan_id": "plan-uuid",
  "plan": "pro",
  "trial_months": 1
}
```
`organization_id` is required and must match the authenticated organization (`403` otherwise). `trial_months` is an integer between 1 and 24.

**Response `201`:** `{ "success": true, "data": { }, "message": "Subscription created" }`

#### Start subscription (trial)

```
POST /auth/api/subscriptions/start
```

**Middleware:** `appId`, create subscription schema, schema validation

**Body:** same shape as create; `organization_id` required.

**Response `200`:** `{ "success": true, "data": { }, "message": "Trial started" }`

#### Checkout subscription

```
POST /auth/api/subscriptions/checkout
```

**Middleware:** `appId`

**Body:** `{ "organization_id": "org-uuid", ... }`. Must match authenticated organization (`403` otherwise).

**Response `200`:** `{ "success": true, "data": { }, "message": "Checkout successful" }`

#### Get current subscription

```
GET /auth/api/subscriptions/current
```

**Middleware:** `appId`

**Query parameters:** `organization_id` (required if the JWT carries no organization).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "plan_name": "Pro",
    "status": "trialing",
    "billing_cycle": "trial",
    "started_at": "2026-01-01T00:00:00.000Z",
    "trial_ends_at": "2026-02-01T00:00:00.000Z",
    "current_period_end": "2026-02-01T00:00:00.000Z"
  }
}
```
Returns `data: null` when there is no active subscription.

#### Get subscriptions for organization

```
GET /auth/api/subscriptions/:orgId
```

**Middleware:** `appId`
**Path params:** `orgId`

### Applications (billing view)

```
GET /auth/api/applications
```

**Middleware:** `appId`

**Response `200`:**
```json
{
  "success": true,
  "data": [ { "id": "...", "app_id": "...", "name": "...", "client_id": "...", "status": "active", "description": "" } ]
}
```

### Access Control

#### Get access / entitlements

```
GET /auth/api/access/:organizationId/:applicationId
```

**Middleware:** `appId`
**Path params:** `organizationId`, `applicationId`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "plan": "pro",
    "status": "active",
    "trial_ends_at": "2026-02-01T00:00:00.000Z",
    "access_status": "granted",
    "features": { }
  }
}
```

#### Guarded access example

```
GET /auth/api/access-guard/:organizationId/:applicationId
```

**Middleware:** `appId`, `requireAccess()`

Demonstrates the reusable `requireAccess` guard. Returns `403` with plan/trial context when access is not granted; otherwise returns entitlements and access context.

**Response `200`:**
```json
{
  "success": true,
  "message": "Access granted",
  "data": { "entitlements": { }, "access_context": { } }
}
```

**Response `403`:**
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Trial expired and no paid subscription is active",
  "data": {
    "current_plan": "pro",
    "trial_status": "ended",
    "trial_expiry": "2026-02-01T00:00:00.000Z",
    "subscription_status": null
  }
}
```

---

## Endpoint Summary

| Method | Path | Auth | App ID | Description |
|---|---|---|---|---|
| ALL | `/health-check` | — | — | Service health |
| GET | `/user/get` | — | ✓ | List users (filterable) |
| POST | `/user/save` | — | ✓ | Create user |
| POST | `/user/sync` | — | ✓ | Idempotent find-or-create user |
| POST | `/user/save-bulk` | — | ✓ | Bulk create users |
| POST | `/user/login` | — | ✓ | User login (returns JWT) |
| PUT | `/user/update` | — | ✓ | Update user |
| PUT | `/user/approve-teachers` | — | — | Bulk teacher approval |
| POST | `/user/forgot-password` | — | — | Request password reset OTP |
| POST | `/user/confirm-password` | — | — | Reset password via OTP |
| DELETE | `/user/delete/:userid` | ✓ | — | Delete user |
| GET | `/organization/get` | — | ✓ | List organizations |
| GET | `/organization/get-for-users` | — | — | Public organization list |
| GET | `/organization/get/:id` | — | — | Get organization by ID |
| GET | `/organization/users` | ✓ | — | List organization users |
| GET | `/organization/list` | ✓ | ✓ | Orgs for current user |
| POST | `/organization/save` | — | ✓ | Create organization |
| POST | `/organization/sync` | — | ✓ | Idempotent find-or-create org |
| PUT | `/organization/update` | ✓ | ✓ | Update organization |
| POST | `/organization/login` | — | ✓ | Organization login |
| POST | `/organization/forgot-password` | — | — | Request org reset OTP |
| POST | `/organization/confirm-password` | — | — | Reset org password |
| DELETE | `/organization/delete/:organizationid` | ✓ | — | Delete organization |
| GET | `/application/get` | — | — | List applications |
| GET | `/application/get/:id` | — | — | Get application by ID |
| GET | `/role/get` | ✓ | — | List roles |
| GET | `/role/filter` | ✓ | — | Filter roles |
| GET | `/role/get/:roleId` | ✓ | — | Get role by ID |
| POST | `/role/save` | ✓ | — | Create role |
| POST | `/role/save-bulk` | ✓ | — | Bulk create roles |
| PUT | `/role/update/:roleId` | ✓ | — | Update role |
| DELETE | `/role/delete/:roleId` | ✓ | — | Delete role |
| GET | `/module/get` | ✓ | — | List modules |
| GET | `/module/get/:moduleId` | ✓ | — | Get module by ID |
| POST | `/module/save` | ✓ | — | Create module |
| POST | `/module/save-bulk` | ✓ | — | Bulk create modules |
| PUT | `/module/update/:moduleId` | ✓ | — | Update module |
| DELETE | `/module/delete/:moduleId` | ✓ | — | Delete module |
| GET | `/permission/get` | ✓ | — | List permissions |
| GET | `/permission/filter` | ✓ | — | Filter permissions |
| GET | `/permission/get/:permissionId` | ✓ | — | Get permission by ID |
| GET | `/permission/role/:roleId` | ✓ | — | Permissions by role |
| GET | `/permission/module/:moduleId` | ✓ | — | Permissions by module |
| GET | `/permission/team/:teamId` | ✓ | — | Permissions by team |
| POST | `/permission/save` | ✓ | — | Create permission |
| POST | `/permission/save-bulk` | ✓ | — | Bulk create permissions |
| PUT | `/permission/update/:permissionId` | ✓ | — | Update permission |
| DELETE | `/permission/delete/:permissionId` | ✓ | — | Delete permission |
| POST | `/otp/save` | — | — | Save OTP |
| GET | `/otp/get/:userId` | — | — | Get OTP by user |
| PUT | `/otp/update` | — | — | Update OTP |
| DELETE | `/otp/delete/:otpId` | — | — | Delete OTP |
| DELETE | `/otp/delete-expired` | — | — | Delete expired OTPs |
| POST | `/otp/verify-otp` | — | — | Verify OTP |
| GET | `/mail-template/get` | — | — | List mail templates |
| POST | `/mail-template/save` | ✓ | — | Create mail template |
| PUT | `/mail-template/update` | ✓ | — | Update mail template |
| DELETE | `/mail-template/delete/:mailTemplateid` | ✓ | — | Delete mail template |
| GET | `/file/get` | — | — | List files |
| GET | `/file/get/:fileId` | — | — | Stream file by ID |
| POST | `/file/get-blob` | — | — | Proxy remote file |
| POST | `/file/save` | — | — | Save file metadata |
| POST | `/file/upload` | — | — | Upload file (multipart) |
| PUT | `/file/update/:fileId` | — | — | Replace file (multipart) |
| DELETE | `/file/delete/:fileId` | — | — | Delete file |
| POST | `/plans` | — | ✓* | Create plan |
| GET | `/plans` | — | ✓* | List plans |
| GET | `/plans/get` | — | ✓* | List plans |
| POST | `/plans/save` | — | ✓ | Bulk save plans |
| POST | `/plans/:id/features` | — | — | Upsert plan features |
| POST | `/subscriptions` | — | ✓ | Create subscription |
| POST | `/subscriptions/start` | — | ✓ | Start trial |
| POST | `/subscriptions/checkout` | — | ✓ | Checkout subscription |
| GET | `/subscriptions/current` | — | ✓ | Current subscription |
| GET | `/subscriptions/:orgId` | — | ✓ | Subscriptions for org |
| GET | `/applications` | — | ✓ | Applications (billing view) |
| GET | `/access/:organizationId/:applicationId` | — | ✓ | Access / entitlements |
| GET | `/access-guard/:organizationId/:applicationId` | — | ✓ | Guarded access example |

> `✓*` = `app_id` accepted via `x-app-id` header or `app_id` query parameter.

---

_All paths are relative to the base URL `{HOST}/auth/api`._
