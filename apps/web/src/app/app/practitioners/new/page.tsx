import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { PractitionerForm } from './practitioner-form';

export default async function NewPractitionerPage() {
  const user = await requireAuthenticatedUser('/app/practitioners/new');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [{ data: locations }, { data: specialties }, { data: memberships }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('name'),
      supabase
        .from('specialties')
        .select('id, name')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('display_order')
        .order('name'),
      supabase
        .from('organization_memberships')
        .select('id, profile_id')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('created_at'),
    ]);
  const typedMemberships = (memberships ?? []) as Array<{
    id: string;
    profile_id: string;
  }>;
  const membershipOptions = typedMemberships.map((membership) => ({
    id: membership.id,
    label: `Membership ${membership.profile_id.slice(0, 8)}`,
  }));
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Practitioners
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Create practitioner
        </h1>
        <p className="mt-3 text-slate-600">
          Create an organization-owned professional profile. Account linkage is
          optional.
        </p>
        <Card className="mt-8">
          <PractitionerForm
            locations={locations ?? []}
            specialties={specialties ?? []}
            memberships={membershipOptions}
          />
        </Card>
      </div>
    </main>
  );
}
