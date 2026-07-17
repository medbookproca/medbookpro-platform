import { describe, expect, it } from 'vitest';
import { getAuthCallbackErrorPath, getSafeNextPath } from './safe-redirect';

describe('safe authentication redirects', () => {
  it('keeps same-origin relative paths', () => {
    expect(getSafeNextPath('/app?tab=overview#details')).toBe('/app?tab=overview#details');
  });

  it('rejects external and protocol-relative redirects', () => {
    expect(getSafeNextPath('https://attacker.example')).toBe('/app');
    expect(getSafeNextPath('//attacker.example/path')).toBe('/app');
  });

  it('provides a stable callback error path', () => {
    expect(getAuthCallbackErrorPath()).toBe('/sign-in?error=auth_callback_failed');
  });
});
