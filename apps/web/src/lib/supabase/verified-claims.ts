import type { SupabaseClient } from '@supabase/supabase-js';

export interface VerifiedClaims {
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

export async function getVerifiedClaimsFromClient(supabase: SupabaseClient): Promise<VerifiedClaims | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return data.claims as VerifiedClaims;
}

export async function getCurrentUserFromClient(supabase: SupabaseClient) {
  const claims = await getVerifiedClaimsFromClient(supabase);
  if (!claims?.sub) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}
