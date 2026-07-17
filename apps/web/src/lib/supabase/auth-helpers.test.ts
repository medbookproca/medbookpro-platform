import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentUserFromClient, getVerifiedClaimsFromClient } from './verified-claims';

function createFakeClient(claims: Record<string, unknown> | null, user: { email?: string } | null) {
  return {
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: claims ? { claims } : { claims: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  } as unknown as SupabaseClient;
}

describe('verified authentication helpers', () => {
  it('returns verified claims from the auth client', async () => {
    const client = createFakeClient({ sub: 'user-1', email: 'user@example.com' }, null);
    await expect(getVerifiedClaimsFromClient(client)).resolves.toMatchObject({ sub: 'user-1' });
  });

  it('does not retrieve a user when claims are absent', async () => {
    const client = createFakeClient(null, { email: 'user@example.com' });
    await expect(getCurrentUserFromClient(client)).resolves.toBeNull();
    expect(client.auth.getUser).not.toHaveBeenCalled();
  });

  it('retrieves the current user only after claims verification', async () => {
    const client = createFakeClient({ sub: 'user-1' }, { email: 'user@example.com' });
    await expect(getCurrentUserFromClient(client)).resolves.toEqual({ email: 'user@example.com' });
    expect(client.auth.getClaims).toHaveBeenCalledOnce();
    expect(client.auth.getUser).toHaveBeenCalledOnce();
  });
});
