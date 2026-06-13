# Staff components (`components/staff/`)

Staff-console UI that must not ship with the public citizen portal.

## Import rules

| Allowed | Forbidden |
|---------|-----------|
| `@/components/ui/*` | `@/components/public/*` |
| `@/lib/api-client`, `@/lib/staff/*` | `PublicShell` |
| `@/components/providers/auth-provider` | Citizen complaint submit/track flows |

ESLint enforces these rules for `components/staff/**`, `app/**/dashboard/**`, `app/**/auth/**`, and `lib/staff/**`.

## Layout

- `layout/` — breadcrumbs, user menu, shell helpers
- `dashboard/` — KPI widgets, home panels
- `auth/` — login-adjacent staff forms (when moved from `components/forms`)
- `system/` — forbidden, session-expired staff chrome

Citizen complaint journeys stay in `components/complaints/`. Staff queue UI goes under `components/staff/complaints/` (Phase 3+).
