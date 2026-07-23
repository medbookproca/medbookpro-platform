import { describe, expect, it } from 'vitest';
import {
  intervalDurationMinutes,
  localDateTimeToUtc,
} from './availability-engine';

describe('availability time-zone calculations', () => {
  it('converts local wall-clock intervals across the Alberta spring DST transition', () => {
    const interval = {
      date: '2026-03-08',
      startTime: '00:00',
      endTime: '08:00',
      timezone: 'America/Edmonton',
    } as const;
    expect(intervalDurationMinutes(interval)).toBe(420);
    expect(
      localDateTimeToUtc(
        interval.date,
        interval.startTime,
        interval.timezone,
      ).toISOString(),
    ).toBe('2026-03-08T07:00:00.000Z');
  });
});
