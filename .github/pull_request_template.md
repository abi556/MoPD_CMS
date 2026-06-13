## Summary

<!-- What changed and why -->

## Staff / public boundary checklist

- [ ] Staff code (`components/staff`, `dashboard`, `auth`, `lib/staff`) does **not** import `components/public` or `PublicShell`
- [ ] New staff links use `staffRoutes` from `lib/staff/routes.ts` (no hard-coded `/dashboard` paths)
- [ ] Permission-gated routes use `RequirePermission`; widgets use `PermissionGate`

## Test plan

- [ ] `pnpm --filter @mopd-cms/web test`
- [ ] `pnpm --filter @mopd-cms/web lint`
- [ ] `pnpm --filter @mopd-cms/web build`
