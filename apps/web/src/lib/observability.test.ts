import { describe, expect, it, vi } from 'vitest';
import { getSafeErrorDetails, logDiagnostic } from './observability';

describe('diagnostic logging', () => {
  it('redacts sensitive field names before writing structured output', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logDiagnostic('info', 'test.event', {
      requestId: 'request-1',
      accessToken: 'secret-value',
    });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('"accessToken":"[REDACTED]"'),
    );
    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining('secret-value'),
    );
    spy.mockRestore();
  });
});

describe('safe error details', () => {
  it('redacts credentials from development diagnostics', () => {
    expect(
      getSafeErrorDetails(
        new Error('request failed Bearer secret-token eyJsecret'),
      ),
    ).toEqual({
      message: 'request failed Bearer [REDACTED] [REDACTED]',
    });
  });
});
