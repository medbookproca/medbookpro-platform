import { beforeEach, describe, expect, it } from 'vitest';
import { createBrowserClient, parsePublicSupabaseEnv } from './index';

describe('database Supabase client boundary', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54331';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('validates the publishable browser configuration', () => {
    expect(parsePublicSupabaseEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54331',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });
  });

  it('does not require the legacy anon or service-role key', () => {
    expect(() => createBrowserClient()).not.toThrow();
  });

  it('rejects missing publishable configuration', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(() => parsePublicSupabaseEnv()).toThrow(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    );
  });
});
