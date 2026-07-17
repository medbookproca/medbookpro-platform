import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import OnboardingForm from './onboarding-form';

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser('/onboarding');
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('profile_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (membership) redirect('/app');
  return <OnboardingForm />;
}
