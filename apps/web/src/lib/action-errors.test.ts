import { describe, expect, it, vi } from 'vitest';
import { getSafeActionError } from './action-errors';

vi.mock('./observability', () => ({
  getSafeErrorDetails: (error: unknown) => ({
    code:
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : undefined,
    message: error instanceof Error ? error.message : undefined,
  }),
  logDiagnostic: vi.fn(),
}));

describe('getSafeActionError', () => {
  it('maps duplicate errors without returning database details', () => {
    expect(
      getSafeActionError(
        Object.assign(new Error('duplicate key value'), { code: '23505' }),
        'test.failed',
        'Fallback',
      ),
    ).toBe('This record already exists. Review the information and try again.');
  });

  it('uses a generic fallback for unknown errors', () => {
    expect(
      getSafeActionError(
        new Error('internal database detail'),
        'test.failed',
        'Fallback',
      ),
    ).toBe('Fallback');
  });
});
