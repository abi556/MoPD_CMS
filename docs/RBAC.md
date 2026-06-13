# MoPD CMS RBAC Reference

Authorization model for the MoPD CMS API. This document reflects **implemented** guards, permission checks, seed data, and service-layer policies in `apps/api/src` — not planned SRS permissions that are not wired to routes.

**Related docs:** [API.md](./API.md) (endpoint contracts), Swagger at `/api/docs`.

---

## 1) Overview

| Concept | Implementation |
|--------|----------------|
| **Identity** | Staff users authenticate with email/password; access token is a JWT (`Authorization: Bearer <token>`). |
| **Authorization** | JWT carries `roles[]` and `permissions[]` (union of all permissions on assigned roles). |
| **Route enforcement** | `JwtAuthGuard` + `PermissionsGuard` + `@Permissions(...)` on protected handlers. |
| **Permission source** | Database `Permission` rows linked to roles; seeded when `AUTH_SEED_ENABLED=true`. |
| **Code style** | SDS canonical codes (e.g. `complaint:read`) plus **legacy aliases** for backward compatibility. |
| **Public citizen flows** | Complaint submit and track require **no** staff permissions. |

Citizens are not staff roles. There is no `PublicUser` role in `ROLE_CATALOG`; public routes omit JWT guards.

---

## 2) Enforcement architecture

### Guards and decorators

Protected routes use **both** guards in this order:

1. **`JwtAuthGuard`** — validates Bearer JWT, revocation (`jti`), and populates `request.user` (`JwtUser`).
2. **`PermissionsGuard`** — reads `@Permissions(...)` metadata and requires the user to hold **every** listed permission (logical **AND**).

```typescript
// apps/api/src/common/decorators/permissions.decorator.ts
@Permissions('document:upload', 'complaint:read') // user must satisfy BOTH
```

If `@Permissions` is omitted on a handler that only uses `JwtAuthGuard`, any authenticated user may call the route (subject to throttling and business rules).

### Permission matching (`satisfiesPermission`)

Runtime checks use `apps/api/src/modules/auth/rbac/permission-check.ts`:

- Direct match: granted array contains the required code.
- **Alias match:** holding the **canonical** SDS code satisfies requirements for its **legacy** codes, and vice versa (see §4).

`PermissionsGuard` calls `hasAllPermissions`, which applies aliases. Some **data-scoping** helpers use **direct** codes only (see §6).

### HTTP outcomes

| Situation | Status | Body |
|-----------|--------|------|
| Missing/invalid token | `401` | Standard error envelope |
| Authenticated but missing permission(s) | `403` | `Insufficient permissions` |
| Workflow policy denial (after auth) | `422` | `error.code: workflow_forbidden` |
| Scoped complaint not visible | `404` | `Complaint not found` (intentional hide) |

### JWT payload (staff)

Issued at login/refresh; validated in `JwtStrategy`:

| Claim | Purpose |
|-------|---------|
| `sub` | User id |
| `email` | User email |
| `roles` | Role **names** (e.g. `CaseOfficer`, `SuperAdmin`) |
| `permissions` | Effective permission **codes** from role mappings |
| `jti` | Access-token id (revocation) |

`GET /api/v1/auth/me` returns the same `roles` and `permissions` for UI gating.

---

## 3) Permission catalog (seed)

All codes below are defined in `apps/api/src/modules/auth/rbac/seed-catalog.ts` (`SEED_PERMISSIONS`). Stable ids follow `perm-<code-with-dashes>`.

| Code | Description |
|------|-------------|
| `admin:ping` | Access admin health endpoint |
| `complaints:list` | List complaints (legacy staff list) |
| `complaints:detail` | View complaint detail (legacy) |
| `complaints:history` | View complaint history (legacy) |
| `complaints:assign` | Assign or reassign ownership (legacy) |
| `complaints:transition` | Transition workflow status (legacy) |
| `complaint:read` | Read **all** complaints (unscoped) |
| `complaint:read:own` | Read assignee-scoped complaints + queue |
| `complaint:recovery:manage` | Staff recovery inquiry queue (`GET/PATCH /complaints/recovery/inquiries`) |
| `complaint:review` | Move complaint into QA/legal review |
| `complaint:approve` | Approve response issuance from QA |
| `complaint:update` | Update non-status complaint fields |
| `workflow:transition` | Workflow transitions and assignments (SDS) |
| `user:manage` | User lifecycle and profiles |
| `role:manage` | Roles and permission mappings |
| `complaint:escalate` | Escalate / open appeal handling |
| `config:manage` | Categories, org units, broad config |
| `sla:configure` | SLA rule configuration |
| `notification:manage` | Notification delivery admin |
| `notification:read` | Read notification delivery status (**seed only; no route guard yet**) |
| `template:manage` | Notification template admin |
| `case:read` | List case notes/tasks on a complaint |
| `case:write` | Create/update case notes and tasks |
| `document:upload` | Upload documents to complaints |
| `document:read` | View/download clean documents |
| `document:delete` | Delete complaint documents |
| `audit:read` | Query and export audit logs |
| `report:view` | Analytics dashboards |
| `report:export` | Generate/download report exports |

---

## 4) Canonical ↔ legacy aliases

Defined in `apps/api/src/modules/auth/rbac/permission-aliases.ts`. Aliases are **additive**; existing role seeds may grant legacy codes only.

| Canonical (SDS) | Legacy codes satisfied |
|-----------------|------------------------|
| `complaint:read` | `complaints:list`, `complaints:detail`, `complaints:history` |
| `complaint:read:own` | _(self only)_ |
| `workflow:transition` | `complaints:transition`, `complaints:assign` |
| `complaint:escalate` | `complaint:escalate` |
| `template:manage` | `config:manage` |
| `notification:manage` | `config:manage` |
| `sla:configure` | `config:manage` |
| `complaint:update` | `complaint:update` |

**Examples**

- Route requires `complaint:read` → user with only `complaints:list` passes `PermissionsGuard`.
- Route requires `workflow:transition` → user with `complaints:assign` passes.
- Route requires `sla:configure` → user with `config:manage` passes (SystemAdmin path).
- Assign/transition **workflow policy** also accepts legacy `complaints:assign` / `complaints:transition` via `hasPermission` (alias-aware).

**Not aliased:** `complaint:read:own` does not imply `complaint:read`. Scoping helpers treat `complaint:read` as a **direct** grant only.

---

## 5) Roles (seed catalog)

Roles are defined in `apps/api/src/modules/auth/rbac/role-catalog.ts`. Permission assignments for bootstrap are in `ROLE_PERMISSION_IDS` (`seed-catalog.ts`).

### SuperAdmin

| Field | Value |
|-------|-------|
| **Seed ID** | `role-super-admin` |
| **Name** | `SuperAdmin` |
| **Permissions** | All codes in `SEED_PERMISSIONS` |

**Bypass:** Role name `SuperAdmin` skips workflow policy checks and is treated as unscoped read in `hasComplaintReadAll` (even if permission list were empty).

### SystemAdmin

| Field | Value |
|-------|-------|
| **Seed ID** | `role-system-admin` |
| **Name** | `SystemAdmin` |

**Permissions:** `admin:ping`, `user:manage`, `role:manage`, `config:manage`, `sla:configure`, `template:manage`, `notification:manage`

**Typical use:** user/role administration, reference data, SLA and notification configuration. No complaint workflow permissions unless granted manually in DB.

### ComplaintsAdmin

| Field | Value |
|-------|-------|
| **Seed ID** | `role-complaints-admin` |
| **Name** | `ComplaintsAdmin` |

**Permissions:** `complaint:read`, `workflow:transition`, `complaints:assign`, `complaints:transition`, `complaint:escalate`, `complaints:list`, `complaints:detail`, `complaints:history`, `complaint:update`

**Typical use:** full complaint visibility, assignment, transitions, metadata updates, appeals/escalation. No case notes, documents, reports, or audit.

### CaseOfficer

| Field | Value |
|-------|-------|
| **Seed ID** | `role-case-officer` |
| **Name** | `CaseOfficer` |

**Permissions:** `complaint:read:own`, `complaints:list`, `complaints:detail`, `complaints:history`, `complaints:assign`, `complaints:transition`, `workflow:transition`, `complaint:escalate`, `case:read`, `case:write`, `document:upload`, `document:read`, `document:delete`, `complaint:update`

**Typical use:** assignee-scoped complaint work, case collaboration, documents. List/detail routes accept legacy list codes via alias; data layer scopes rows (§6).

### ReviewerApprover

| Field | Value |
|-------|-------|
| **Seed ID** | `role-reviewer-approver` |
| **Name** | `ReviewerApprover` |

**Permissions:** `complaint:read`, `complaint:review`, `complaint:approve`, `workflow:transition`, `complaints:transition`, `complaints:list`, `complaints:detail`, `complaints:history`

**Typical use:** QA/legal review and approving issuance from QA (workflow policy §7).

### CommunicationsOfficer

| Field | Value |
|-------|-------|
| **Seed ID** | `role-communications-officer` |
| **Name** | `CommunicationsOfficer` |

**Permissions:** `notification:manage`, `notification:read`, `template:manage`

**Typical use:** notification templates and delivery admin. `notification:read` is seeded but not bound to a controller guard today.

### Auditor

| Field | Value |
|-------|-------|
| **Seed ID** | `role-auditor` |
| **Name** | `Auditor` |

**Permissions:** `audit:read`, `report:view`, `report:export`

### Ombudsperson

| Field | Value |
|-------|-------|
| **Seed ID** | `role-ombudsperson` |
| **Name** | `Ombudsperson` |

**Permissions:** `complaint:read`, `audit:read`, `report:view`, `complaint:escalate`, `complaints:list`, `complaints:detail`, `complaints:history`

**Typical use:** oversight read, audit, dashboards, escalation/appeal — not day-to-day case editing.

### ReadOnlyObserver

| Field | Value |
|-------|-------|
| **Seed ID** | `role-read-only-observer` |
| **Name** | `ReadOnlyObserver` |

**Permissions:** `complaint:read`, `report:view`, `complaints:list`, `complaints:detail`, `complaints:history`

---

## 6) Complaint data scoping

Implemented in `ComplaintAccessService` and used from `ComplaintsService` for list, detail, history, assign, transition, appeal, and metadata update.

### Unscoped read (`complaint:read` — direct)

- User has **direct** `complaint:read` in JWT `permissions`, **or** role name `SuperAdmin`.
- List filter: no assignee restriction.
- Detail/history: any complaint id (if it exists).

Legacy `complaints:list` / `complaints:detail` / `complaints:history` satisfy **route** `@Permissions('complaint:read')` but do **not** set unscoped read for filtering.

### Assignee-scoped read

Active when `shouldScopeComplaintsToAssignee(user)` is true:

- User does **not** have unscoped read, **and**
- User has **direct** `complaint:read:own` **or** **direct** `complaints:list`.

**List filter** (`buildListScopeFilter`):

- Complaints where `assignedToUserId = current user`, **or**
- Unassigned complaints in status `SUBMITTED` or `TRIAGE` (queue pickup).

**Detail/history** (`assertCanAccessComplaint`):

- Same assignee rule, or unassigned queue item in `SUBMITTED`/`TRIAGE`.
- Otherwise **`404`** (not `403`) to avoid leaking existence.

### Scoping gaps (implementation note)

Case collaboration (`/complaints/:id/notes|tasks`), documents (`/documents/*`), and SLA status (`GET /complaints/:id/sla`) check permissions on the route but **do not** call `ComplaintAccessService` today. A user who knows a complaint UUID could interact with those endpoints if they hold `case:*` or `document:*` without passing complaint list/detail scoping. Frontend should still route officers through scoped complaint APIs; tightening server-side scope is a recommended hardening follow-up.

---

## 7) Workflow policy (beyond RBAC)

`WorkflowPolicyService` runs **after** authentication and `@Permissions` checks. Denials return **`422`** with `workflow_forbidden`.

| Rule | Requirement |
|------|-------------|
| **SuperAdmin** | All workflow checks skipped |
| **Assign** (`assertCanAssign`) | `workflow:transition` **or** `complaints:assign` |
| **Transition to `QA_LEGAL_REVIEW`** | `complaint:review` |
| **`QA_LEGAL_REVIEW` → `RESPONSE_ISSUED`** | `complaint:approve` |
| **Transition to `APPEAL`** | `complaint:escalate` |
| **Transition to `ASSIGNED`, or from `TRIAGE`** | `workflow:transition` **or** `complaints:transition` **or** `complaints:assign` |

**Important:** `@Permissions('workflow:transition')` on assign/transition routes is necessary but not sufficient — workflow policy may still reject the operation.

There are two escalation surfaces with the same permission:

| Route | Permission | Behavior |
|-------|------------|----------|
| `POST /complaints/:id/appeal` | `complaint:escalate` | Workflow transition to `APPEAL` (policy above) |
| `POST /complaints/:id/escalate` | `complaint:escalate` | SLA escalation side effect (`204`) |

Citizen self-service appeal is **not** public; it requires staff `complaint:escalate`.

---

## 8) Endpoint permission matrix

Base path: `/api/v1`. See [API.md](./API.md) for bodies, pagination, and errors.

### Public (no JWT)

| Method | Path | Permission |
|--------|------|------------|
| `POST` | `/complaints` | — |
| `GET` | `/complaints/track/:referenceNo` | — |
| Auth/password/MFA routes | `/auth/*` (except bearer-only) | — |
| Health | `/health`, `/health/redis`, `/health/ready` | — |

### Authentication (JWT, no `@Permissions`)

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/auth/mfa/status` | Bearer |
| `GET` | `/auth/me` | Bearer; returns `permissions[]` for UI |
| `GET` | `/users/me` | Bearer |
| `PATCH` | `/users/me` | Bearer |

### Complaints (staff)

| Method | Path | `@Permissions` | Scoping |
|--------|------|----------------|---------|
| `GET` | `/complaints` | `complaint:read` | §6 list filter |
| `GET` | `/complaints/:id` | `complaint:read` | §6 |
| `GET` | `/complaints/:id/history` | `complaint:read` | §6 |
| `POST` | `/complaints/:id/assign` | `workflow:transition` | §6 + §7 |
| `POST` | `/complaints/:id/transition` | `workflow:transition` | §6 + §7 |
| `POST` | `/complaints/:id/appeal` | `complaint:escalate` | §6 + §7 |
| `PATCH` | `/complaints/:id` | `complaint:update` | §6 |

### Case collaboration

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/complaints/:id/notes` | `case:read` |
| `POST` | `/complaints/:id/notes` | `case:write` |
| `GET` | `/complaints/:id/tasks` | `case:read` |
| `POST` | `/complaints/:id/tasks` | `case:write` |
| `PATCH` | `/complaints/:id/tasks/:taskId` | `case:write` |

### Documents

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `POST` | `/documents/upload` | `document:upload` **and** `complaint:read` |
| `GET` | `/documents/:id` | `document:read` **and** `complaint:read` |
| `GET` | `/documents/:id/download` | `document:read` **and** `complaint:read` |
| `DELETE` | `/documents/:id` | `document:delete` |

CaseOfficer satisfies `complaint:read` on document routes via `complaints:list` alias; upload still requires `document:upload`.

### SLA

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/complaints/:id/sla` | `complaint:read` |
| `POST` | `/complaints/:id/escalate` | `complaint:escalate` |
| `GET` | `/admin/sla-configs` | `sla:configure` |
| `POST` | `/admin/sla-configs` | `sla:configure` |
| `PATCH` | `/admin/sla-configs/:id` | `sla:configure` |

### Reference data (admin)

All require `config:manage`:

| Method | Path |
|--------|------|
| `GET` | `/admin/complaint-categories` |
| `POST` | `/admin/complaint-categories` |
| `PATCH` | `/admin/complaint-categories/:id` |
| `GET` | `/admin/org-units` |
| `POST` | `/admin/org-units` |
| `PATCH` | `/admin/org-units/:id` |

**Frontend gap:** public complaint forms need active categories; today `GET /admin/complaint-categories` is staff-only (`config:manage`). Consider a dedicated public catalog endpoint.

### Users and roles

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/users` | `user:manage` |
| `GET` | `/users/:id` | `user:manage` |
| `POST` | `/users` | `user:manage` |
| `PATCH` | `/users/:id` | `user:manage` |
| `POST` | `/users/:id/deactivate` | `user:manage` |
| `GET` | `/roles` | `role:manage` |
| `POST` | `/roles` | `role:manage` |
| `PATCH` | `/roles/:id` | `role:manage` |
| `DELETE` | `/roles/:id` | `role:manage` |
| `GET` | `/permissions` | `role:manage` |

### Notifications

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/notifications` | `notification:manage` |
| `POST` | `/notifications/:id/resend` | `notification:manage` |
| `GET` | `/notification-templates` | `template:manage` |
| `GET` | `/notification-templates/:id` | `template:manage` |
| `POST` | `/notification-templates` | `template:manage` |
| `PATCH` | `/notification-templates/:id` | `template:manage` |

### Reports

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/reports/dashboard/volume` | `report:view` |
| `GET` | `/reports/dashboard/sla` | `report:view` |
| `GET` | `/reports/dashboard/resolution` | `report:view` |
| `GET` | `/reports/dashboard/channels` | `report:view` |
| `POST` | `/reports/export` | `report:export` |
| `GET` | `/reports/export/:id` | `report:export` |
| `GET` | `/reports/export/:id/download` | `report:export` |

### Audit

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/audit-logs` | `audit:read` |
| `GET` | `/audit-logs/export` | `audit:read` |

### Admin utility

| Method | Path | `@Permissions` |
|--------|------|----------------|
| `GET` | `/admin/ping` | `admin:ping` |

---

## 9) Role × capability summary

Quick matrix for UI navigation and product planning. “✓” = seeded permission or alias satisfies typical route guards; “—” = not seeded.

| Capability | SuperAdmin | SystemAdmin | ComplaintsAdmin | CaseOfficer | ReviewerApprover | CommunicationsOfficer | Auditor | Ombudsperson | ReadOnlyObserver |
|------------|:----------:|:-----------:|:-----------------:|:-----------:|:----------------:|:---------------------:|:-------:|:------------:|:----------------:|
| All permissions | ✓ | — | — | — | — | — | — | — | — |
| User/role admin | ✓ | ✓ | — | — | — | — | — | — | — |
| Reference data / SLA config | ✓ | ✓ | — | — | — | — | — | — | — |
| Templates / notification admin | ✓ | ✓ | — | — | — | ✓ | — | — | — |
| Complaints (unscoped) | ✓ | — | ✓ | — | ✓ | — | — | ✓ | ✓ |
| Complaints (scoped) | — | — | — | ✓ | — | — | — | — | — |
| Workflow assign/transition | ✓ | — | ✓ | ✓ | ✓ | — | — | — | — |
| QA review / approve response | ✓ | — | — | — | ✓ | — | — | — | — |
| Case notes/tasks | ✓ | — | — | ✓ | — | — | — | — | — |
| Documents | ✓ | — | — | ✓ | — | — | — | — | — |
| Escalate / appeal (staff) | ✓ | — | ✓ | ✓ | — | — | — | ✓ | — |
| Reports | ✓ | — | — | — | — | — | ✓ | ✓ | ✓ |
| Audit | ✓ | — | — | — | — | — | ✓ | ✓ | — |

---

## 10) Development seed users

When `AUTH_SEED_ENABLED=true`, bootstrap creates roles from `ROLE_CATALOG` and users with `ROLE_PERMISSION_IDS`. Defaults for E2E/dev are in `apps/api/test/e2e/helpers/auth-seed.ts`; production values belong in environment variables (`apps/api/.env.example`).

| Role | Default email | Default password (E2E helper) |
|------|---------------|-------------------------------|
| SuperAdmin | `admin@mopd.local` | `AdminPass123!` |
| SystemAdmin | `system-admin@mopd.local` | `SystemAdminPass123!` |
| ComplaintsAdmin | `complaints-admin@mopd.local` | `ComplaintsAdminPass123!` |
| CaseOfficer | `officer@mopd.local` | `OfficerPass123!` |
| CaseOfficer (2) | `officer2@mopd.local` | `Officer2Pass123!` |
| ReviewerApprover | `reviewer@mopd.local` | `ReviewerPass123!` |
| CommunicationsOfficer | `communications@mopd.local` | `CommunicationsPass123!` |
| Auditor | `auditor@mopd.local` | `AuditorPass123!` |
| Ombudsperson | `ombudsperson@mopd.local` | `OmbudspersonPass123!` |
| ReadOnlyObserver | `observer@mopd.local` | `ObserverPass123!` |

Override any credential via `AUTH_SEED_*_EMAIL` / `AUTH_SEED_*_PASSWORD` env vars. **Do not use default passwords in production.**

---

## 11) Frontend authorization patterns

1. **Gate screens** with JWT `permissions` from `/auth/me` (or login payload), using the same codes as `@Permissions` (aliases are resolved server-side; UI may check canonical codes only).
2. **Treat `403` and `422 workflow_forbidden`** as distinct UX: missing role vs invalid workflow step.
3. **Do not infer row access from menu visibility alone** for CaseOfficer — list is scoped server-side; deep links to other complaint ids return `404`.
4. **Multi-permission routes:** document upload requires both upload and read; hide upload unless both pass.
5. **Public site** must not call staff-only admin routes for categories (see §8 reference data).

For page-level nav matrices, see `CMS SRS + SDS/MoPD_CMS_Frontend_UI_Plan.md` §7.

---

## 12) Source of truth (implementation map)

| Concern | Location |
|---------|----------|
| Route `@Permissions` | Controllers under `apps/api/src/modules/**` |
| Guard | `apps/api/src/common/guards/permissions.guard.ts` |
| Alias + helpers | `apps/api/src/modules/auth/rbac/permission-aliases.ts`, `permission-check.ts` |
| Seed roles/permissions | `role-catalog.ts`, `seed-catalog.ts` |
| Complaint scoping | `complaint-access.service.ts`, `complaints.service.ts` |
| Workflow policy | `workflow-policy.service.ts` |
| JWT user shape | `interfaces/jwt-user.interface.ts`, `auth.service.ts` (`toAuthUser`) |

This file documents only behavior present in the codebase at the time of writing. Permissions without controller guards (e.g. `notification:read`) are listed for seed completeness but are not API-enforced yet.
