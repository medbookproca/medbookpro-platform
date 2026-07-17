import { describe, expect, it } from 'vitest';
import { AuthServiceError, mapAuthError } from './auth-errors';

describe('authentication error mapping', () => {
  it('maps invalid credentials neutrally', () => {
    expect(mapAuthError({ code: 'invalid_credentials' })).toEqual({
      code: 'invalid_credentials',
      message: 'The email or password is incorrect.',
    });
  });

  it('maps rate limits without exposing provider details', () => {
    const error = mapAuthError({ code: 'over_request_rate_limit', status: 429, message: 'internal detail' });
    expect(error.code).toBe('rate_limited');
    expect(error.message).not.toContain('internal detail');
  });

  it('maps network failures safely', () => {
    expect(mapAuthError(new TypeError('fetch failed')).code).toBe('network_error');
  });

  it('preserves the safe message on service errors', () => {
    expect(new AuthServiceError({ code: 'unexpected', message: 'Safe message' }).message).toBe('Safe message');
  });
});
