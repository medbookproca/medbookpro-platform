import { describe, expect, it } from 'vitest';
import { getReleaseMetadata } from './release-metadata';

describe('release metadata', () => {
  it('uses safe defaults when build metadata is unavailable', () => {
    expect(getReleaseMetadata({})).toEqual({
      version: '0.1.0-dev',
      commit: 'unknown',
      buildTimestamp: 'unknown',
    });
  });

  it('prefers explicitly supplied release metadata', () => {
    expect(
      getReleaseMetadata({
        NEXT_PUBLIC_APP_VERSION: '1.2.3',
        GIT_COMMIT_SHA: 'abc123',
        BUILD_TIMESTAMP: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({
      version: '1.2.3',
      commit: 'abc123',
      buildTimestamp: '2026-01-01T00:00:00Z',
    });
  });
});
