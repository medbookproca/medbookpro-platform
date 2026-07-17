import { describe, expect, it } from 'vitest';
import { firstLocationSchema, onboardingFormSchema } from './onboarding-schemas';

const baseOrganization = {
  legalName: 'Northstar Wellness Test Organization',
  displayName: 'Northstar Wellness',
  countryCode: 'CA',
  timezone: 'America/Edmonton',
  currency: 'CAD',
  locale: 'en-CA',
};

describe('onboarding schemas', () => {
  it('accepts a Canadian physical location with a valid postal code', () => {
    const result = firstLocationSchema.safeParse({ name: 'Downtown Test Location', locationType: 'physical', addressLine1: '100 Test Street', city: 'Edmonton', provinceOrState: 'AB', postalCode: 'T5J 1N3', countryCode: 'CA', timezone: 'America/Edmonton', publicBookingEnabled: false });
    expect(result.success).toBe(true);
  });

  it('allows a virtual location without a street address', () => {
    const result = firstLocationSchema.safeParse({ name: 'Virtual Test Location', locationType: 'virtual', countryCode: 'CA', timezone: 'America/Edmonton', publicBookingEnabled: false });
    expect(result.success).toBe(true);
  });

  it('requires an address for physical locations', () => {
    const result = firstLocationSchema.safeParse({ name: 'Physical Test Location', locationType: 'physical', countryCode: 'CA', timezone: 'America/Edmonton', publicBookingEnabled: false });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid Canadian postal code', () => {
    const result = firstLocationSchema.safeParse({ name: 'Downtown Test Location', locationType: 'physical', addressLine1: '100 Test Street', countryCode: 'CA', postalCode: '12345', timezone: 'America/Edmonton', publicBookingEnabled: false });
    expect(result.success).toBe(false);
  });

  it('validates the combined onboarding request shape', () => {
    const result = onboardingFormSchema.safeParse({ organization: baseOrganization, location: { name: 'Downtown Test Location', locationType: 'physical', addressLine1: '100 Test Street', countryCode: 'CA', timezone: 'America/Edmonton', publicBookingEnabled: false } });
    expect(result.success).toBe(true);
  });
});
