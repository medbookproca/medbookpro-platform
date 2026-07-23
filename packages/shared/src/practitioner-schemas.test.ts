import { describe, expect, it } from 'vitest';
import {
  credentialDisplayStatus,
  isPractitionerSelectable,
  practitionerCreationSchema,
  publicProfileSchema,
} from './practitioner-schemas';

describe('practitioner schemas', () => {
  it('requires primary locations to be selected', () => {
    const result = practitionerCreationSchema.safeParse({
      displayName: 'A. Practitioner',
      locationIds: [],
      primaryLocationId: '00000000-0000-0000-0000-000000000001',
      specialtyIds: [],
      languageCodes: [],
    });
    expect(result.success).toBe(false);
  });

  it('keeps archived practitioners non-selectable and detects expiry', () => {
    expect(isPractitionerSelectable('archived')).toBe(false);
    expect(credentialDisplayStatus('verified', '2020-01-01')).toBe('expired');
  });

  it('defaults public profiles to explicit visibility values', () => {
    const result = publicProfileSchema.safeParse({
      practitionerId: '00000000-0000-0000-0000-000000000001',
      visibilityStatus: 'private',
      bookingVisibility: 'hidden',
    });
    expect(result.success).toBe(true);
  });
});
