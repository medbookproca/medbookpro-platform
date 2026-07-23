import { describe, expect, it } from 'vitest';
import { getVisibleAppNavigation } from './app-navigation';

describe('authenticated application navigation', () => {
  it('always exposes the dashboard but filters privileged modules', () => {
    const navigation = getVisibleAppNavigation(['practitioner']);
    const hrefs = navigation.map((item) => item.href);

    expect(hrefs).toContain('/app');
    expect(hrefs).toContain('/app/clinical');
    expect(hrefs).not.toContain('/app/settings/staff');
    expect(hrefs).not.toContain('/app/billing');
  });

  it('exposes the complete supported shell to an organization owner', () => {
    const navigation = getVisibleAppNavigation(['organization.owner']);
    expect(navigation.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        '/app/patients',
        '/app/appointments',
        '/app/reports',
        '/app/integrations',
        '/app/settings/staff',
      ]),
    );
  });
});
