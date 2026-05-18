import {
  buildStorageKey,
  getAllowedMimeTypes,
  isExtensionBlocked,
} from './document.config';

describe('document.config', () => {
  it('builds storage key under complaint path', () => {
    expect(buildStorageKey('cmp_1', 'doc_1')).toBe('complaints/cmp_1/doc_1');
  });

  it('blocks executable extensions', () => {
    expect(isExtensionBlocked('malware.exe')).toBe(true);
    expect(isExtensionBlocked('safe.pdf')).toBe(false);
  });

  it('includes pdf in default allowlist', () => {
    expect(getAllowedMimeTypes().has('application/pdf')).toBe(true);
  });
});
