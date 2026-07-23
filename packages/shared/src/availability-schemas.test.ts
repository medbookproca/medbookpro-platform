import { describe, expect, it } from 'vitest';
import {
  availabilityBlockSchema,
  availabilityOverrideSchema,
  subtractAvailabilityBreaks,
} from './availability-schemas';

describe('availability schemas', () => {
  it('rejects invalid intervals and partial overrides', () => {
    expect(() =>
      availabilityBlockSchema.parse({
        weekday: 1,
        startTime: '10:00',
        endTime: '09:00',
        mode: 'virtual',
      }),
    ).toThrow();
    expect(() =>
      availabilityOverrideSchema.parse({
        practitionerId: '00000000-0000-0000-0000-000000000001',
        overrideDate: '2026-08-01',
        kind: 'available',
        startTime: '09:00',
        mode: 'virtual',
      }),
    ).toThrow();
  });

  it('subtracts breaks without creating empty or reversed segments', () => {
    expect(
      subtractAvailabilityBreaks({ startTime: '09:00', endTime: '17:00' }, [
        { startTime: '12:00', endTime: '13:00' },
        { startTime: '15:30', endTime: '16:00' },
      ]),
    ).toEqual([
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '15:30' },
      { startTime: '16:00', endTime: '17:00' },
    ]);
  });
});
