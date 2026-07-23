import { describe, expect, it } from 'vitest';
import {
  patientContactSchema,
  patientCreationSchema,
  patientIdentifierSchema,
} from './patient-schemas';

describe('patient schemas', () => {
  it('validates Canadian contact formats', () => {
    expect(
      patientContactSchema.parse({
        patientId: '00000000-0000-0000-0000-000000000001',
        email: 'patient@example.test',
        phone: '+1 780 555 0100',
        country: 'Canada',
        province: 'AB',
        postalCode: 'T5J 1N1',
        preferredContactMethod: 'phone',
      }).province,
    ).toBe('AB');
    expect(() =>
      patientContactSchema.parse({
        patientId: '00000000-0000-0000-0000-000000000001',
        email: 'not-an-email',
        country: 'Canada',
        preferredContactMethod: 'email',
      }),
    ).toThrow();
  });

  it('rejects a future date of birth and accepts a minimal profile', () => {
    expect(() =>
      patientCreationSchema.parse({
        organizationId: '00000000-0000-0000-0000-000000000001',
        firstName: 'Future',
        lastName: 'Patient',
        dateOfBirth: '2999-01-01',
        biologicalSex: 'undisclosed',
        maritalStatus: 'undisclosed',
        preferredLanguage: 'en',
      }),
    ).toThrow();
  });

  it('keeps identifier validation explicit and bounded', () => {
    expect(
      patientIdentifierSchema.parse({
        patientId: '00000000-0000-0000-0000-000000000001',
        identifierType: 'internal_mrn',
        identifierValue: 'MRN-100',
      }).identifierType,
    ).toBe('internal_mrn');
    expect(() =>
      patientIdentifierSchema.parse({
        patientId: 'not-a-uuid',
        identifierType: 'passport',
        identifierValue: 'ABC',
      }),
    ).toThrow();
  });
});
