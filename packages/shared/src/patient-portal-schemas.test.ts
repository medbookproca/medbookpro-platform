import { describe, expect, it } from 'vitest';
import { patientAppointmentRequestSchema, patientPortalConsentSchema } from './patient-portal-schemas';

describe('patient portal schemas', () => {
  it('accepts a valid appointment request', () => {
    const result = patientAppointmentRequestSchema.safeParse({
      organizationId: '00000000-0000-0000-0000-000000000001',
      practitionerId: '00000000-0000-0000-0000-000000000002',
      locationId: '00000000-0000-0000-0000-000000000003',
      serviceId: '00000000-0000-0000-0000-000000000004',
      appointmentType: 'in_person',
      scheduledStart: '2026-08-01T14:00:00Z',
      durationMinutes: 30,
      timezone: 'America/Edmonton',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsupported consent types', () => {
    const result = patientPortalConsentSchema.safeParse({
      consentType: 'unknown',
      version: '1.0',
      consentDate: '2026-08-01',
    });

    expect(result.success).toBe(false);
  });
});
