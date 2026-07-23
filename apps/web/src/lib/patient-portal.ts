import 'server-only';

import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function requirePatientPortalAccount(path = '/app/patient') {
  const user = await requireAuthenticatedUser(path);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patient_portal_accounts')
    .select('id, organization_id, patient_id, email, status')
    .eq('auth_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  return { user, account: data };
}
