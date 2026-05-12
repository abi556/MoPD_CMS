import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';

const logger = new Logger('BullBoardAuth');

/**
 * Constant-time string equality to defeat timing side-channels on
 * credential comparison.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function parseBasicAuth(
  header: string | undefined,
): { user: string; pass: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(
      header.slice('Basic '.length),
      'base64',
    ).toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

/**
 * Express middleware that protects Bull Board with HTTP Basic Auth.
 *
 * Configuration:
 * - `BULL_BOARD_ENABLED` — set to "true" to expose the UI (default false in prod)
 * - `BULL_BOARD_USERNAME` — required
 * - `BULL_BOARD_PASSWORD` — required, minimum 16 chars recommended
 *
 * Returns 503 if not enabled, 401 if credentials are missing/wrong.
 */
export function basicAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const enabled = process.env.BULL_BOARD_ENABLED === 'true';
  if (!enabled) {
    res.status(503).json({
      error: {
        code: 'BULL_BOARD_DISABLED',
        message: 'Queue admin UI is disabled. Set BULL_BOARD_ENABLED=true.',
      },
    });
    return;
  }

  const expectedUser = process.env.BULL_BOARD_USERNAME;
  const expectedPass = process.env.BULL_BOARD_PASSWORD;
  if (!expectedUser || !expectedPass) {
    logger.error(
      'BULL_BOARD_ENABLED is true but BULL_BOARD_USERNAME/PASSWORD are not set.',
    );
    res.status(500).json({
      error: {
        code: 'BULL_BOARD_MISCONFIGURED',
        message: 'Server is missing Bull Board credentials.',
      },
    });
    return;
  }

  const creds = parseBasicAuth(req.headers.authorization);
  if (
    !creds ||
    !safeEqual(creds.user, expectedUser) ||
    !safeEqual(creds.pass, expectedPass)
  ) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="Queue Admin", charset="UTF-8"',
    );
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  next();
}
