import { describe, expect, it } from 'vitest';
import { mapOnboardingError } from './onboarding-errors';

describe('onboarding error mapping', () => {
  it('does not expose database details', () => {
    expect(
      mapOnboardingError(
        new Error('ONBOARDING_INVALID_COUNTRY in public.organizations'),
      ).message,
    ).toBe('Review the highlighted information and try again.');
    expect(
      mapOnboardingError(new Error('select * from secret_table')).message,
    ).not.toContain('secret_table');
  });

  it('maps transport failures to a safe retry message', () => {
    expect(mapOnboardingError(new TypeError('fetch failed')).code).toBe(
      'unavailable',
    );
    expect(
      mapOnboardingError(new TypeError('fetch failed')).message,
    ).not.toContain('fetch failed');
  });
});
