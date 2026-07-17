import { describe, expect, it } from 'vitest';
import { parseSupabaseEnv } from './env';

describe('Supabase environment validation', () => {
  it('accepts a valid URL and publishable key', () => {
    expect(parseSupabaseEnv({ url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' })).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test',
    });
  });

  it('reports missing public configuration without exposing values', () => {
    expect(() => parseSupabaseEnv({})).toThrow('Supabase environment is not configured');
    expect(() => parseSupabaseEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_URL');
    expect(() => parseSupabaseEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  });

  it('rejects malformed URLs', () => {
    expect(() => parseSupabaseEnv({ url: 'not-a-url', publishableKey: 'sb_publishable_test' })).toThrow('valid URL');
  });
});
