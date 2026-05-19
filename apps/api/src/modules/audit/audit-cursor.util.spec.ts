import {
  decodeAuditCursor,
  encodeAuditCursor,
  InvalidAuditCursorError,
} from './audit-cursor.util';

describe('audit-cursor.util', () => {
  it('round-trips createdAt and id', () => {
    const createdAt = new Date('2026-05-15T12:00:00.000Z');
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const encoded = encodeAuditCursor({ createdAt, id });
    const decoded = decodeAuditCursor(encoded);
    expect(decoded.id).toBe(id);
    expect(decoded.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it('throws InvalidAuditCursorError for malformed base64', () => {
    expect(() => decodeAuditCursor('not-valid!!!')).toThrow(
      InvalidAuditCursorError,
    );
  });

  it('throws InvalidAuditCursorError for missing fields', () => {
    const payload = Buffer.from(JSON.stringify({ id: 'x' }), 'utf8').toString(
      'base64url',
    );
    expect(() => decodeAuditCursor(payload)).toThrow(InvalidAuditCursorError);
  });

  it('throws InvalidAuditCursorError for invalid date', () => {
    const payload = Buffer.from(
      JSON.stringify({ id: 'x', createdAt: 'not-a-date' }),
      'utf8',
    ).toString('base64url');
    expect(() => decodeAuditCursor(payload)).toThrow(InvalidAuditCursorError);
  });
});
