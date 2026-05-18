import { parseClamAvResponse } from './clamav-response';

describe('parseClamAvResponse', () => {
  it('parses stream OK with NUL terminator', () => {
    const raw = Buffer.from('stream: OK\0', 'ascii');
    expect(parseClamAvResponse(raw)).toEqual({ clean: true });
  });

  it('parses stream OK without terminator', () => {
    expect(parseClamAvResponse(Buffer.from('stream: OK\n', 'ascii'))).toEqual({
      clean: true,
    });
  });

  it('parses virus FOUND', () => {
    const raw = Buffer.from('stream: Eicar-Signature FOUND\0', 'ascii');
    expect(parseClamAvResponse(raw)).toEqual({
      clean: false,
      signature: 'Eicar-Signature',
    });
  });
});
