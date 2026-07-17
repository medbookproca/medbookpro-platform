import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from './server';
import { getCurrentUserFromClient, getVerifiedClaimsFromClient, type VerifiedClaims } from './verified-claims';
import { getSafeNextPath } from '@/lib/auth/safe-redirect';

export { getCurrentUserFromClient, getVerifiedClaimsFromClient } from './verified-claims';
export type { VerifiedClaims } from './verified-claims';

export async function getVerifiedClaims(): Promise<VerifiedClaims | null> {
  return getVerifiedClaimsFromClient(await createClient());
}

export async function getCurrentUser() {
  return getCurrentUserFromClient(await createClient());
}

export async function requireAuthenticatedUser(path = '/app') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(getSafeNextPath(path))}`);
  }

  return user;
}
