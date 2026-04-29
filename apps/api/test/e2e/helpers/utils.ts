import type { Response } from 'supertest';

export function getBody<T>(response: Response): T {
  return response.body as T;
}

export function getRefreshCookieHeader(response: Response): string {
  const setCookie = response.headers['set-cookie'];
  if (!Array.isArray(setCookie) || setCookie.length === 0) {
    throw new Error('Expected refresh cookie to be set');
  }
  const fullHeader = setCookie[0] as string;
  const [cookiePair] = fullHeader.split(';');
  if (!cookiePair) {
    throw new Error('Invalid refresh cookie header');
  }
  return cookiePair;
}
