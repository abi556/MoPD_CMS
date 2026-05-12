type CheckResult = {
  ok: boolean;
  message: string;
};

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) {
    return fallback;
  }
  return value === 'true';
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function hasStrongSecret(value: string | undefined): boolean {
  return Boolean(
    value && value.length >= 64 && !value.includes('replace-with'),
  );
}

function runChecks(): CheckResult[] {
  const env = process.env.NODE_ENV ?? 'development';
  const isProd = env === 'production';

  const checks: CheckResult[] = [];
  checks.push({
    ok: !!env,
    message: 'NODE_ENV is set',
  });

  if (!isProd) {
    checks.push({
      ok: true,
      message:
        'Production-only checks skipped (NODE_ENV is not production). Set NODE_ENV=production to enforce full security gate.',
    });
    return checks;
  }

  checks.push({
    ok: parseBoolean(process.env.AUTH_COOKIE_SECURE),
    message: 'AUTH_COOKIE_SECURE must be true in production',
  });
  checks.push({
    ok: parseBoolean(process.env.AUTH_CSRF_ENFORCED, true),
    message: 'AUTH_CSRF_ENFORCED must be true in production',
  });
  checks.push({
    ok: parseBoolean(process.env.TRUST_PROXY),
    message: 'TRUST_PROXY should be true when behind reverse proxy',
  });
  checks.push({
    ok: hasStrongSecret(process.env.JWT_ACCESS_SECRET),
    message: 'JWT_ACCESS_SECRET must be set and >= 64 chars',
  });
  checks.push({
    ok: hasStrongSecret(process.env.JWT_REFRESH_SECRET),
    message: 'JWT_REFRESH_SECRET must be set and >= 64 chars',
  });

  const corsOrigins = parseCsv(process.env.CORS_ALLOWED_ORIGINS);
  const csrfOrigins = parseCsv(process.env.AUTH_CSRF_TRUSTED_ORIGINS);

  checks.push({
    ok: corsOrigins.length > 0,
    message: 'CORS_ALLOWED_ORIGINS must include at least one origin',
  });
  checks.push({
    ok: !corsOrigins.some((origin) => origin.includes('*')),
    message: 'CORS_ALLOWED_ORIGINS must not use wildcard origins',
  });
  checks.push({
    ok: csrfOrigins.length > 0,
    message: 'AUTH_CSRF_TRUSTED_ORIGINS must include at least one origin',
  });
  checks.push({
    ok: process.env.AUTH_SEED_ENABLED !== 'true',
    message: 'AUTH_SEED_ENABLED must be false in production',
  });

  return checks;
}

function main(): void {
  const checks = runChecks();
  let hasFailure = false;

  for (const check of checks) {
    const prefix = check.ok ? 'PASS' : 'FAIL';

    console.log(`[${prefix}] ${check.message}`);
    if (!check.ok) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
    return;
  }

  console.log('Security check passed.');
}

main();
