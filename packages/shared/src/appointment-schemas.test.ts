import { describe, expect, it } from 'vitest';
import {
  appointmentCreateSchema,
  appointmentStatusUpdateSchema,
} from './appointment-schemas';

const validAppointment = {
  patientId: '81000000-0000-0000-0000-000000000001',
  practitionerId: '91000000-0000-0000-0000-000000000001',
  locationId: '83000000-0000-0000-0000-000000000001',
  serviceId: '76000000-0000-0000-0000-000000000001',
  appointmentType: 'in_person' as const,
  scheduledStart: '2026-08-03T09:00:00-06:00',
  durationMinutes: 30,
  timezone: 'America/Edmonton',
  preBufferMinutes: 5,
  postBufferMinutes: 5,
};

describe('appointment schemas', () => {
  it('accepts a tenant-scoped appointment request', () => {
    expect(
      appointmentCreateSchema.parse(validAppointment).durationMinutes,
    ).toBe(30);
  });

  it('rejects invalid status transitions at the input boundary', () => {
    expect(() =>
      appointmentStatusUpdateSchema.parse({
        appointmentId: validAppointment.patientId,
        status: 'unknown',
      }),
    ).toThrow();
  });
});
