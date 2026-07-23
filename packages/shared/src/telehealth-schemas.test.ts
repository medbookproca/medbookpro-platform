import { describe, expect, it } from 'vitest';
import { telehealthProviderSettingsSchema, telehealthSessionSchema } from './telehealth-schemas';

describe('telehealth schemas', () => {
  it('accepts a scheduled placeholder session', () => {
    expect(telehealthSessionSchema.safeParse({
      organizationId: '00000000-0000-0000-0000-000000000001', appointmentId: '00000000-0000-0000-0000-000000000002', patientId: '00000000-0000-0000-0000-000000000003', practitionerId: '00000000-0000-0000-0000-000000000004', scheduledStart: '2026-08-01T14:00:00Z', scheduledEnd: '2026-08-01T14:30:00Z', status: 'scheduled',
    }).success).toBe(true);
  });

  it('restricts providers to approved placeholders', () => {
    expect(telehealthProviderSettingsSchema.safeParse({ provider: 'unknown', enabled: false }).success).toBe(false);
  });
});
