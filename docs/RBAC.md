# MoPD CMS RBAC Reference

Staff authorization uses JWT `permissions[]` (resolved from database role mappings). Legacy permission codes remain valid; SDS codes are additive aliases (see `apps/api/src/modules/auth/rbac/permission-aliases.ts`).

## Roles (seed IDs)

| Role | Seed ID | Primary permissions |
|------|---------|---------------------|
| SuperAdmin | `role-super-admin` | All permissions |
| SystemAdmin | `role-system-admin` | `user:manage`, `role:manage`, `config:manage`, `sla:configure`, `template:manage`, `notification:manage`, `admin:ping` |
| ComplaintsAdmin | `role-complaints-admin` | `complaint:read`, `workflow:transition`, `complaint:update`, `complaint:escalate` |
| CaseOfficer | `role-case-officer` | `complaint:read:own`, legacy list/detail, `workflow:transition`, case/document write |
| ReviewerApprover | `role-reviewer-approver` | `complaint:review`, `complaint:approve`, `complaint:read`, `workflow:transition` |
| CommunicationsOfficer | `role-communications-officer` | `template:manage`, `notification:manage` |
| Auditor | `role-auditor` | `audit:read`, `report:view`, `report:export` |
| Ombudsperson | `role-ombudsperson` | `complaint:read`, `audit:read`, `report:view`, `complaint:escalate` |
| ReadOnlyObserver | `role-read-only-observer` | `complaint:read`, `report:view` |

## Data scoping

- **`complaint:read`**: all complaints.
- **`complaint:read:own`**: assigned complaints plus unassigned queue items in `SUBMITTED` / `TRIAGE`.

## Key endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/complaints` | `complaint:read` |
| GET | `/api/v1/complaints/:id` | `complaint:read` |
| PATCH | `/api/v1/complaints/:id` | `complaint:update` |
| POST | `/api/v1/complaints/:id/assign` | `workflow:transition` |
| POST | `/api/v1/complaints/:id/transition` | `workflow:transition` |
| POST | `/api/v1/complaints/:id/appeal` | `complaint:escalate` |
| GET | `/api/v1/notification-templates` | `template:manage` |
| GET | `/api/v1/notifications` | `notification:manage` |
| GET/PATCH | `/api/v1/admin/sla-configs` | `sla:configure` |

## Dev seed users (`AUTH_SEED_ENABLED=true`)

See `apps/api/.env.example` and `apps/api/test/e2e/helpers/auth-seed.ts` for emails/passwords (`admin@mopd.local`, `officer@mopd.local`, `reviewer@mopd.local`, etc.).

## Workflow policy

Transitions to `QA_LEGAL_REVIEW` require `complaint:review`. Issuing `RESPONSE_ISSUED` from QA requires `complaint:approve`. Denied transitions return HTTP 422 with `workflow_forbidden`.
