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
- **Staff password policy** (change password, reset password, admin user create):
  - Minimum **8** characters (**12+** recommended; MFA is available)
  - At least one uppercase letter, one lowercase letter, one digit, and one special character
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
- **Response (no MFA):** `{ data: { user, accessToken, tokenType: "Bearer", expiresIn, mustChangePassword, mfaRequired: false } }`
  - `user: { id, email, roles[], permissions[] }`
- **Response (MFA required):** `{ data: { mustChangePassword, mfaRequired: true, mfaToken } }`
  - No `accessToken` or `user` — client must call `POST /auth/mfa/verify` with the `mfaToken`
- **Errors:** `401`
- **Side effect:** sets `refresh_token` cookie (only when MFA is not required)

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
  - `newPassword` min length `8`; must include uppercase, lowercase, digit, and special character (12+ recommended)
- **Response:** success message
- **Errors:** validation/domain failures (`422`)

### POST `/auth/change-password`
- **Auth:** Bearer
- **Body:** `{ currentPassword, newPassword }`
  - `currentPassword` min length `8`
  - `newPassword` min length `8`; must include uppercase, lowercase, digit, and special character (12+ recommended)
- **Response:** `{ data: { message } }`
- **Errors:** `401` (wrong current password), `422` (same as current)
- **Rate limit:** 10 req/min
- **Notes:** Bumps `passwordVersion` (invalidates all existing sessions). Clears `mustChangePassword` flag. Creates in-app `account_password_changed` notification.

### GET `/auth/mfa/status`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { enrolled, method, provider: "totp", policy: "optional" | "required", mustEnroll, totpOnly, canSkipEnroll } }`
- **Notes:**
  - `mustEnroll` — always `false` during onboarding (MFA is recommended, not blocking)
  - `canSkipEnroll` — `true` until the user enrolls
  - `mustEnrollMfa` on the user record is **not** returned here; see `/auth/me`

### POST `/auth/mfa/enroll`
- **Auth:** Bearer
- **Response:** `{ data: { qrCodeDataUrl, secret, backupCodes[] } }`
- **Notes:** Returns QR code data URL for authenticator app and 10 one-time backup codes.

### POST `/auth/mfa/confirm`
- **Auth:** Bearer
- **Body:** `{ code }` — 6-digit TOTP code from authenticator app
- **Response:** `{ data: { message } }`
- **Errors:** `422` (invalid code)
- **Notes:** Confirms TOTP enrollment. Sets `mfaEnabled: true`, `mfaMethod: "totp"`, clears `mustEnrollMfa`.

### POST `/auth/mfa/skip`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { message } }`
- **Errors:** `400` (already enrolled)
- **Notes:** Defers optional onboarding MFA for any staff role. Clears `mustEnrollMfa` on the user. SuperAdmin/SystemAdmin may still use TOTP-only at login after they enroll; email OTP switch remains blocked for elevated roles in Profile → MFA.

### POST `/auth/mfa/verify`
- **Auth:** Bearer (mfaToken from login response)
- **Body:** `{ code }` or `{ backupCode }`
- **Response:** `{ data: { user, accessToken, tokenType: "Bearer", expiresIn, mustChangePassword } }`
- **Errors:** `401` (invalid/expired mfaToken or wrong code)
- **Side effect:** sets `refresh_token` cookie
- **Notes:** Completes MFA login challenge. Issues real JWT + refresh token.

### PATCH `/auth/mfa/method`
- **Auth:** Bearer
- **Body:** `{ method: "totp" | "email" }`
- **Response:** `{ data: { message } }`
- **Errors:** `403` (SuperAdmin/SystemAdmin cannot downgrade to email)

### DELETE `/auth/mfa`
- **Auth:** Bearer
- **Body:** `{ password }` — current password for re-verification
- **Response:** `{ data: { message } }`
- **Errors:** `401` (wrong password), `403` (blocked for elevated roles)
- **Notes:** Disables MFA. SuperAdmin/SystemAdmin cannot disable MFA.

### GET `/auth/me`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { id, email, roles[], permissions[], mustChangePassword, mustEnrollMfa, requireMfaEnrollment, mfaEnrolled, mfaMethod, canSkipMfaEnroll } }`
- **Errors:** `401`
- **Notes:**
  - `mustEnrollMfa` — soft prompt flag (redirect to enroll after password change); cleared by skip or confirm
  - `requireMfaEnrollment` — always `false` during onboarding (use dashboard guard + `mustEnrollMfa` soft prompt instead)
  - `canSkipMfaEnroll` — mirrors `/auth/mfa/status` `canSkipEnroll`

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
- **Body:** `{ email?, preferredLocale? }` (`preferredLocale`: `en` | `am`)
- **Response:** `{ data: UserItemDto }`
- **Side effect:** when `email` changes, creates an in-app `account_email_changed` notification for the user

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
- **Response:** `{ data: { id, referenceNo, status, channel, subject, submittedAt, locale, consentGiven, categoryId?, orgUnitId?, uploadSession?, ackEmailQueued } }`
  - `uploadSession`: `{ token, expiresAt, complaintId, maxFiles, maxBytesPerFile }`
  - `ackEmailQueued`: `true` when `complainantEmail` was provided and the immediate `complaint_submitted_ack` email (reference + track link) was queued — not a later investigator-assignment notice
- **Errors:** `422`

### POST `/complaints/recovery/request`
- **Auth:** Public
- **Body:** `{ channel: 'email' | 'sms', email?, phone?, locale }`
- **Response:** `204` (always, to avoid contact enumeration)
- **Throttle:** 5/min per IP; per-contact limit 3/hour

### POST `/complaints/recovery/verify`
- **Auth:** Public
- **Body:** `{ channel, email?, phone?, code (6 digits), locale }`
- **Response:** `{ data: { references: [{ referenceNo, submittedAt }] } }`
- **Errors:** `400` invalid code, `429` lockout

### POST `/complaints/recovery/inquiries`
- **Auth:** Public (manual fallback when no email/phone on file)
- **Body:** `{ subjectFragment, contactEmail, submittedDateGregorian?, submittedDateEthiopian?, categoryId?, orgUnitId?, additionalNotes?, locale }`
- **Email:** Acknowledgement on create; on staff **RESOLVED** sends reference to `contactEmail`; on **REJECTED** sends unable-to-verify guidance with link to submit anew.
- **Rate limit:** 15 requests/hour per IP (each submit attempt counts, including validation failures). Max 5 inquiries per `contactEmail` per 24h. Dev: `DISABLE_THROTTLE=true` in API `.env`.
- **Response:** `{ data: { inquiryId, message } }`

### GET `/complaints/recovery/inquiries` (staff)
- **Permission:** `complaint:recovery:manage`
- **Query:** `status?` (`PENDING|IN_REVIEW|RESOLVED|REJECTED`)

### GET `/complaints/recovery/inquiries/:id/candidates` (staff)
- **Permission:** `complaint:recovery:manage`
- **Response:** `{ data: RecoveryInquiryCandidateDto[] }`
  - `RecoveryInquiryCandidateDto`: `{ id, referenceNo, subject, submittedAt, status, complainantEmail? }`
- **Purpose:** Pre-filtered complaint search for a recovery inquiry (subject fragment, optional ±3 day date window, category, org unit)
- **Errors:** `404` (unknown inquiry)

### PATCH `/complaints/recovery/inquiries/:id` (staff)
- **Permission:** `complaint:recovery:manage`
- **Body:** `{ status, matchedComplaintId?, resolvedReferenceNo? }`

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
- **Errors:** `404`, `422` (includes `workflow_forbidden` with `details.reasonCode`, `requiredRoles`, `requiredPermissions`)

### POST `/complaints/:id/transition`
- **Permission:** `workflow:transition`
- **Body:** `{ toStatus, reason }`
- **Response:** `{ data: ComplaintDetailDataDto }`
- **Errors:** `404`, `422` (includes workflow policy violations)

When workflow policy rejects an assign or transition, the API returns **`422`** with:

```json
{
  "error": {
    "code": "workflow_forbidden",
    "message": "You cannot perform this workflow step.",
    "details": {
      "fromStatus": "ASSIGNED",
      "toStatus": "IN_INVESTIGATION",
      "requiredPermissions": ["complaint:investigate"],
      "requiredRoles": ["CaseOfficer"],
      "reasonCode": "not_assignee"
    }
  }
}
```

See [RBAC.md](./RBAC.md) §7 for the full transition matrix.

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

Staff notifications are split into two surfaces:

| Surface | Purpose | Auth |
|---------|---------|------|
| **In-app inbox** (`/users/me/notifications`) | Personal alerts (assignments, SLA, account, exports) | Bearer JWT only — no extra permission |
| **Outbound email admin** (`/notifications`, `/notification-templates`) | Email/SMS template and delivery log management | `notification:manage` / `template:manage` |

### In-app inbox (`/users/me/notifications`)

Persisted in `UserNotification`. The web staff UI renders `messageKey` + `messageParams` via `next-intl` (keys under `inbox.types.*`). `link` is a staff-console path without locale prefix.

**Notification types** (enum `UserNotificationType`):

| Type | Typical trigger | Severity |
|------|-----------------|----------|
| `complaint_assigned` | Complaint assigned to user | `info` |
| `case_task_assigned` | Case task created for assignee | `info` |
| `case_task_reassigned` | Case task assignee changed | `info` |
| `sla_warning` | SLA reaches warning threshold (~80%) | `warning` |
| `sla_breached` | SLA target exceeded (assignee + escalation role) | `critical` |
| `account_password_changed` | User changed password | `success` |
| `account_email_changed` | User/admin updated email | `success` |
| `security_mfa_reminder` | Weekly job for users without MFA | `warning` |
| `report_export_ready` | Async report export completed | `success` |
| `report_export_failed` | Async report export failed | `warning` |

Duplicate domain events are suppressed when a `dedupKey` is set (e.g. one SLA warning per tracker).

#### GET `/users/me/notifications`
- **Auth:** Bearer
- **Query:** `page?` (default `1`), `pageSize?` (default `20`, max `100`), `unreadOnly?` (`true` | `false`)
- **Response:** `{ data: UserNotificationItemDto[], meta: { page, pageSize, total, totalPages } }`
- **UserNotificationItemDto:** `{ id, type, severity, messageKey, messageParams, link?, entityType?, entityId?, readAt?, createdAt }`

#### GET `/users/me/notifications/unread-count`
- **Auth:** Bearer
- **Response:** `{ data: { count: number } }`
- **Purpose:** Header bell badge polling

#### PATCH `/users/me/notifications/:id/read`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: UserNotificationItemDto }` (with `readAt` set)
- **Errors:** `404` if notification does not exist or belongs to another user

#### POST `/users/me/notifications/read-all`
- **Auth:** Bearer
- **Body:** none
- **Response:** `{ data: { updated: number } }`

### Outbound delivery admin (`/notifications`)

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
  - `format`: `csv|xlsx|pdf`
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

## 15) Melhiq chatbot (public + admin)

### POST `/chatbot/message`
- **Auth:** Public (no JWT)
- **Throttle:** 30 req/min per IP
- **Body:** `{ sessionId: uuid, message: string (1–500), locale: "en" | "am" }`
- **Response:** `{ data: { reply, confidence: "verified" | "guidance_only" | "refused", sources: [{ title, slug, url? }], sessionId, turnCount, disclaimer? } }`
- **Errors:** `400 chatbot_invalid_message`, `403 chatbot_session_limit`, `503 chatbot_disabled`, `429 rate_limited`

### POST `/chatbot/handoff`
- **Auth:** Public
- **Body:** `{ sessionId, locale, reason }`
- **Response:** `{ data: { handoffUrl } }` — e.g. `/en/contact?reason=chatbot&session=...`

### GET `/admin/knowledge/articles`
- **Permission:** `knowledge:manage`
- **Query:** `status`, `locale`, `topic`
- **Response:** `KnowledgeArticle[]`

### POST `/admin/knowledge/articles`
- **Permission:** `knowledge:manage`
- **Body:** create draft article (`slug`, `locale`, `title`, `bodyMarkdown`, `topic`, optional `sourceUrl`, `sourceType`)

### PATCH `/admin/knowledge/articles/:id`
- **Permission:** `knowledge:manage`

### POST `/admin/knowledge/articles/:id/publish`
- **Permission:** `knowledge:manage` — sets `published`, enqueues pgvector re-index job

### POST `/admin/knowledge/articles/:id/reindex`
- **Permission:** `knowledge:manage` — manual embedding rebuild

### GET `/admin/knowledge/analytics`
- **Permission:** `chatbot:analytics:read`
- **Response:** daily aggregates (no PII)

---

## 16) Notes on implementation scope

This file intentionally documents only currently implemented endpoints discovered from:
- `@Controller(...)` route handlers in `apps/api/src`
- bound DTOs and Swagger decorators
- actual route wiring and response shapes in controller code

Not included here: planned/future endpoints that are not present in controllers.
