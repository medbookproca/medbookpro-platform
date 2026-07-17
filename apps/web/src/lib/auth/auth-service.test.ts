import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAuthService } from './auth-service';

function createFakeClient() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  } as unknown as SupabaseClient;
}

describe('Supabase authentication service boundary', () => {
  it('passes sign-in credentials to Supabase', async () => {
    const client = createFakeClient();
    const service = createSupabaseAuthService(client);

    await expect(service.signIn({ email: 'user@example.com', password: 'Password123!' })).resolves.toEqual({
      success: true,
      message: 'Sign in successful.',
    });
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@example.com', password: 'Password123!' });
  });

  it('sends a callback URL and display name during sign-up', async () => {
    const client = createFakeClient();
    const service = createSupabaseAuthService(client);

    await service.signUp({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      emailRedirectTo: 'http://localhost:3000/auth/callback?next=/app',
    });

    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'Password123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=/app',
        data: { display_name: 'Jane Doe' },
      },
    });
  });

  it('maps provider failures into safe service errors', async () => {
    const client = createFakeClient();
    vi.mocked(client.auth.signInWithPassword).mockResolvedValue({ data: { user: null, session: null }, error: { code: 'invalid_credentials' } } as never);
    const service = createSupabaseAuthService(client);

    await expect(service.signIn({ email: 'user@example.com', password: 'wrong' })).rejects.toMatchObject({
      code: 'invalid_credentials',
      message: 'The email or password is incorrect.',
    });
  });

  it('calls Supabase sign-out through the adapter', async () => {
    const client = createFakeClient();
    const service = createSupabaseAuthService(client);

    await expect(service.signOut()).resolves.toBeUndefined();
    expect(client.auth.signOut).toHaveBeenCalledOnce();
  });
});
