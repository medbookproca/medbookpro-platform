import { describe, expect, it } from 'vitest';
import { getOrCreateRequestId } from './request-correlation';

describe('request correlation', () => {
  it('preserves a bounded safe correlation id', () => {
    expect(getOrCreateRequestId('release-test-123')).toBe('release-test-123');
  });

  it('replaces invalid correlation input', () => {
    expect(getOrCreateRequestId('invalid id with spaces')).not.toContain(' ');
  });
});
