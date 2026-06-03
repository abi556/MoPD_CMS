# MoPD CMS API Reference

Source of truth: implemented NestJS controllers and DTOs in `apps/api/src`.

## 1) Overview

- **Base URL:** `/api/v1`
- **Swagger UI:** `/api/docs`
- **API style:** JSON REST with envelope responses (`{ data: ... }`, and optional `meta`)
- **Auth model:**
  - Bearer JWT for protected endpoints (`Authorization: Bearer <token>`)
  - Refresh token cookie (`refresh_token`) for auth rotation
- **Error envelope:**
  - `error.code` (machine-readable)
  - `error.message` (human-readable)
  - `error.correlationId`

## 2) Common conventions

- **Pagination envelope (where applicable):**
  - `data: []`
  - `meta: { page, pageSize, total, totalPages }` or cursor meta for audit
- **Validation:** global `ValidationPipe` with whitelist/forbidNonWhitelisted
- **Rate limiting:** per-route `@Throttle` decorators
- **Permissions:** enforced by `JwtAuthGuard + PermissionsGuard` and `@Permissions(...)`

---

## 3) Health

### GET `/health`
- **Auth:** Public
- **Response:** `{ data: { status: "ok", service: "mopd-cms-api" } }`

### GET `/health/redis`
- **Auth:** Public
- **Response:** `{ data: { status: "ok" | "degraded" | "down", latencyMs, error? } }`
- **Status code:** `503` when Redis is not healthy

### GET `/health/ready`
- **Auth:** Public
- **Response:** `{ data: { status: "ready" | "not_ready", dependencies: { redis } } }`
- **Status code:** `503` when not ready

---

## 4) Authentication

### POST `/auth/login`
- **Auth:** Public
- **Body:** `{ email, password }`
  - `email` must be valid email
  - `password` min length `8`
- **Response:** `{ data: { user, accessToken, tokenType: "Bearer", expiresIn } }`
  - `user: { id, email, roles[], permissions[] }`
- **Errors:** `401`
- **Side effect:** sets `refresh_token` cookie

### POST `/auth/refresh`
- **Auth:** Cookie (`refresh_token`)
- **Body:** none
- **Response:** `{ data: { accessToken, tokenType: "Bearer", expiresIn } }`
- **Errors:** `401`, `403` (origin/CSRF checks if enforced)
- **Side effect:** rotates `refresh_token` cookie

### POST `/auth/logout`
- **Auth:** Bearer + cookie
- **Body:** none
- **Response:** `{ data: { message: "Logged out successfully" } }`
- **Errors:** `401`
- **Side effect:** clears `refresh_token` cookie

### POST `/auth/forgot-password`
- **Auth:** Public
- **Body:** `{ email }`
- **Response:** generic success message
- **Errors:** validation `422`

### POST `/auth/reset-password`
- **Auth:** Public
- **Body:** `{ token, newPassword }`
  - `newPassword` min length `8`
- **Response:** success message
- **Errors:** validation/domain failures (`422`)

### GET `/auth/mfa/status`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { enrolled, provider: "totp", policy: "optional" | "required" } }`

### GET `/auth/me`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { id, email, roles[], permissions[] } }`
- **Errors:** `401`

---

## 5) Users, roles, permissions

### Users

#### GET `/users`
- **Permission:** `user:manage`
- **Query:** `page`, `pageSize`, `email`, `isActive`
- **Response:** `{ data: UserItemDto[], meta }`
- **UserItemDto:** `{ id, email, roles[], isActive }`

#### GET `/users/:id`
- **Permission:** `user:manage`
- **Response:** `{ data: UserItemDto }`

#### POST `/users`
- **Permission:** `user:manage`
- **Body:** `{ email, password, roleIds[] }`
- **Response:** `{ data: UserItemDto }`

#### PATCH `/users/:id`
- **Permission:** `user:manage`
- **Body:** `{ email?, roleIds? }`
- **Response:** `{ data: UserItemDto }`

#### POST `/users/:id/deactivate`
- **Permission:** `user:manage`
- **Body:** none
- **Response:** `{ data: UserItemDto }`

#### GET `/users/me`
- **Auth:** Bearer
- **Response:** `{ data: UserItemDto }`

#### PATCH `/users/me`
- **Auth:** Bearer
- **Body:** `{ email }`
- **Response:** `{ data: UserItemDto }`

### Roles and permissions

#### GET `/roles`
- **Permission:** `role:manage`
- **Response:** `{ data: RoleItemDto[] }`
- **RoleItemDto:** `{ id, name, permissionCodes[] }`

#### POST `/roles`
- **Permission:** `role:manage`
- **Body:** `{ id, name, permissionIds[] }`
- **Response:** `{ data: RoleItemDto }`

#### PATCH `/roles/:id`
- **Permission:** `role:manage`
- **Body:** `{ name?, permissionIds? }`
- **Response:** `{ data: RoleItemDto }`

#### DELETE `/roles/:id`
- **Permission:** `role:manage`
- **Response:** `204 No Content`

#### GET `/permissions`
- **Permission:** `role:manage`
- **Response:** `{ data: PermissionItemDto[] }`
- **PermissionItemDto:** `{ id, code, description? }`

---

## 6) Complaints

### GET `/complaints/form-options`
- **Auth:** Public
- **Response:** `{ data: { categories: FormOptionItem[], orgUnits: FormOptionItem[] } }`
  - `FormOptionItem`: `{ id, code, nameEn, nameAm }` (active records only)
- **Purpose:** Populate category and responsible-office dropdowns on the public submission form

### POST `/complaints`
- **Auth:** Public
- **Body (CreateComplaintDto):**
  - `subject` (5..160)
  - `description` (20..4000)
  - `channel` (`WEB|ASSISTED|EMAIL|SMS|USSD`)
  - `complainantName?` (<=120)
  - `complainantEmail?` (email)
  - `complainantPhone?` (E.164)
  - `categoryId?`
  - `orgUnitId?`
  - `consentGiven` (must be `true`)
  - `locale` (`en|am`)
  - `requestUploadSession?` (`boolean`) - when `true`, response includes short-lived upload session for optional evidence
- **Response:** `{ data: { id, referenceNo, status, channel, subject, submittedAt, locale, consentGiven, categoryId?, orgUnitId?, uploadSession? } }`
  - `uploadSession`: `{ token, expiresAt, complaintId, maxFiles, maxBytesPerFile }`
- **Errors:** `422`

### GET `/complaints/track/:referenceNo`
- **Auth:** Public
- **Response:** `{ data: { referenceNo, status, subject, submittedAt } }`
- **Errors:** `404`

### GET `/complaints`
- **Permission:** `complaint:read` (RBAC aliases also supported server-side)
- **Query:** `page`, `pageSize`, `status`, `channel`, `locale`, `submittedFrom`, `submittedTo`
- **Response:** `{ data: ComplaintListItemDto[], meta }`

### GET `/complaints/:id`
- **Permission:** `complaint:read`
- **Response:** `{ data: ComplaintDetailDataDto }`
  - Includes assignment and latest transition metadata (`assignedToUserId`, `lastTransitionAt`, etc.)
- **Errors:** `404`

### GET `/complaints/:id/history`
- **Permission:** `complaint:read`
- **Response:** `{ data: ComplaintHistoryItemDto[] }`
  - `action`: `ASSIGNED | TRANSITIONED`
  - `fromStatus`, `toStatus`, `actorUserId`, `reason`, `createdAt`

### POST `/complaints/:id/assign`
- **Permission:** `workflow:transition`
- **Body:** `{ assigneeUserId, reason? }`
- **Response:** `{ data: ComplaintDetailDataDto }`
- **Errors:** `404`, `422`

### POST `/complaints/:id/transition`
- **Permission:** `workflow:transition`
- **Body:** `{ toStatus, reason }`
- **Response:** `{ data: ComplaintDetailDataDto }`
- **Errors:** `404`, `422` (includes workflow policy violations)

### POST `/complaints/:id/appeal`
- **Permission:** `complaint:escalate`
- **Body:** `{ reason }` (10..2000)
- **Response:** `{ data: ComplaintDetailDataDto }`

### POST `/complaints/:id/evidence`
- **Auth:** Public (token-based)
- **Content-Type:** `multipart/form-data`
- **Body fields:** `file` (binary), `uploadToken` (issued from `POST /complaints` when `requestUploadSession=true`)
- **Response:** `{ data: DocumentDto }`
- **Status:** `201`
- **Errors:** `403` (invalid/expired token), `404` (unknown complaint), `422`

### PATCH `/complaints/:id`
- **Permission:** `complaint:update`
- **Body:** `{ categoryId?, orgUnitId?, priority? }`
  - `priority`: `LOW|NORMAL|HIGH|URGENT`
- **Response:** `{ data: ComplaintDetailDataDto }`

---

## 7) Case collaboration

### GET `/complaints/:id/notes`
- **Permission:** `case:read`
- **Response:** `{ data: CaseNoteDto[] }`

### POST `/complaints/:id/notes`
- **Permission:** `case:write`
- **Body:** `{ body, visibility? }`
  - `body` max `10000`
  - `visibility` defaults to `INTERNAL`
- **Response:** `{ data: CaseNoteDto }`
- **Status:** `201` (+ `Location` header)

### GET `/complaints/:id/tasks`
- **Permission:** `case:read`
- **Response:** `{ data: CaseTaskDto[] }`

### POST `/complaints/:id/tasks`
- **Permission:** `case:write`
- **Body:** `{ title, assigneeUserId, dueAt? }`
- **Response:** `{ data: CaseTaskDto }`
- **Status:** `201` (+ `Location` header)

### PATCH `/complaints/:id/tasks/:taskId`
- **Permission:** `case:write`
- **Body:** `{ status?, title?, assigneeUserId?, dueAt? }`
- **Response:** `{ data: CaseTaskDto }`

---

## 8) Documents

All document routes require Bearer auth and permissions guard.

### POST `/documents/upload`
- **Permissions:** `document:upload` + `complaint:read`
- **Content-Type:** `multipart/form-data`
- **Body fields:** `file` (binary), `complaintId`
- **Response:** `{ data: DocumentDto }`
- **Status:** `201` (+ `Location` header)

### GET `/documents/:id`
- **Permissions:** `document:read` + `complaint:read`
- **Response:** `{ data: DocumentDto }`

### GET `/documents/:id/download`
- **Permissions:** `document:read` + `complaint:read`
- **Response:** `{ data: { url, expiresAt } }`

### DELETE `/documents/:id`
- **Permission:** `document:delete`
- **Response:** `204 No Content`

---

## 9) SLA

### GET `/complaints/:id/sla`
- **Permission:** `complaint:read`
- **Response:** `SlaStatusResponseDto`
  - `complaintId`, `slaConfigName`, `status`, `startedAt`, `targetAt`, `warningAt`
  - `warnedAt?`, `breachedAt?`, `completedAt?`
  - `remainingMs`, `isWarned`, `isBreached`

### POST `/complaints/:id/escalate`
- **Permission:** `complaint:escalate`
- **Body:** `{ reason }`
- **Response:** `204 No Content`

### GET `/admin/sla-configs`
- **Permission:** `sla:configure`
- **Response:** `SlaConfigResponseDto[]`

### POST `/admin/sla-configs`
- **Permission:** `sla:configure`
- **Body:** `{ name, priority, categoryId?, targetHours, warningThresholdPct?, escalationRoleId?, isActive? }`
- **Response:** `SlaConfigResponseDto`

### PATCH `/admin/sla-configs/:id`
- **Permission:** `sla:configure`
- **Body:** `{ name?, targetHours?, warningThresholdPct?, escalationRoleId?, isActive? }`
- **Response:** `SlaConfigResponseDto`

---

## 10) Reference data (admin)

All routes under `/admin/*` below require Bearer auth + `config:manage`.

### Complaint categories

#### GET `/admin/complaint-categories`
- **Query:** `activeOnly` (`true|false`)
- **Response:** `CategoryResponseDto[]`

#### POST `/admin/complaint-categories`
- **Body:** `{ code, nameEn, nameAm?, parentId?, sortOrder? }`
- **Response:** `CategoryResponseDto`

#### PATCH `/admin/complaint-categories/:id`
- **Body:** `{ code?, nameEn?, nameAm?, parentId?, sortOrder?, isActive? }`
- **Response:** `CategoryResponseDto`

### Org units

#### GET `/admin/org-units`
- **Query:** `activeOnly` (`true|false`)
- **Response:** `OrgUnitResponseDto[]`

#### POST `/admin/org-units`
- **Body:** `{ code, nameEn, nameAm?, parentId?, sortOrder? }`
- **Response:** `OrgUnitResponseDto`

#### PATCH `/admin/org-units/:id`
- **Body:** `{ code?, nameEn?, nameAm?, parentId?, sortOrder?, isActive? }`
- **Response:** `OrgUnitResponseDto`

---

## 11) Notifications

### Delivery admin (`/notifications`)

#### GET `/notifications`
- **Permission:** `notification:manage`
- **Query:** `page`, `pageSize`, `status`, `to`, `templateKey`
- **Response:** `{ data: NotificationDeliveryItemDto[], meta }`

#### POST `/notifications/:id/resend`
- **Permission:** `notification:manage`
- **Body:** none
- **Response:** `{ data: { newDeliveryId } }`
- **Errors:** `404`, `409` (e.g., resend conflict while queued)

### Template admin (`/notification-templates`)

#### GET `/notification-templates`
- **Permission:** `template:manage`
- **Query:** `page`, `pageSize`
- **Response:** `{ data: NotificationTemplateItemDto[], meta }`

#### GET `/notification-templates/:id`
- **Permission:** `template:manage`
- **Response:** `{ data: NotificationTemplateItemDto }`

#### POST `/notification-templates`
- **Permission:** `template:manage`
- **Body:** `{ key, locale, channel, subject, bodyHtml, bodyText? }`
- **Response:** `{ data: NotificationTemplateItemDto }`
- **Errors:** `409` (unique key+locale+channel)

#### PATCH `/notification-templates/:id`
- **Permission:** `template:manage`
- **Body:** `{ subject?, bodyHtml?, bodyText? }`
- **Response:** `{ data: NotificationTemplateItemDto }`

---

## 12) Reports

### Common query filter (`DashboardReportQueryDto`)
- `from` (date string, required)
- `to` (date string, required)
- `bucket?` (`day|week|month`)
- `categoryId?` (UUID)
- `orgUnitId?` (UUID)

### GET `/reports/dashboard/volume`
- **Permission:** `report:view`
- **Response:** `{ data: { buckets[], series[], meta } }`

### GET `/reports/dashboard/sla`
- **Permission:** `report:view`
- **Response:** `{ data: { onTimePct, breachedPct, onTimeCount, breachedCount, activeCount, total, meta } }`

### GET `/reports/dashboard/resolution`
- **Permission:** `report:view`
- **Response:** `{ data: { avgResolutionHours, resolutionRate, backlog, closedCount, createdCount, byBucket[], meta } }`

### GET `/reports/dashboard/channels`
- **Permission:** `report:view`
- **Response:** `{ data: { channels[], meta } }`

### POST `/reports/export`
- **Permission:** `report:export`
- **Body (`CreateReportExportDto`):**
  - dashboard filter fields (`from`, `to`, etc.)
  - `format`: `csv|xlsx`
  - `reportType`: `complaints`
- **Response:** `{ data: { id, status, createdAt } }`
- **Status:** `201` (+ `Location` header)

### GET `/reports/export/:id`
- **Permission:** `report:export`
- **Response:** `{ data: { id, status, createdAt, completedAt?, errorMessage? } }`

### GET `/reports/export/:id/download`
- **Permission:** `report:export`
- **Response (ready):** `{ data: { url, expiresAt } }`
- **Response (not ready):** `202 Accepted` with `{ data: { status, url: "", expiresAt: "" } }`
- **Errors:** `404`, `410`

---

## 13) Audit logs

### GET `/audit-logs`
- **Permission:** `audit:read`
- **Query:** `eventType`, `actorUserId`, `entityType`, `entityId`, `createdFrom`, `createdTo`, `limit`, `cursor`
- **Response:** `{ data: AuditLogItemDto[], meta: { hasNext, nextCursor? } }`

### GET `/audit-logs/export`
- **Permission:** `audit:read`
- **Query:** same filters as list endpoint
- **Response:** CSV file (`text/csv`)

---

## 14) Admin utility

### GET `/admin/ping`
- **Permission:** `admin:ping`
- **Response:** `{ data: { status: "admin-ok" } }`
- **Purpose:** admin-only health/readiness signal with audit event

---

## 15) Notes on implementation scope

This file intentionally documents only currently implemented endpoints discovered from:
- `@Controller(...)` route handlers in `apps/api/src`
- bound DTOs and Swagger decorators
- actual route wiring and response shapes in controller code

Not included here: planned/future endpoints that are not present in controllers.
