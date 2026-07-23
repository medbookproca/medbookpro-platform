import { Card } from '@medbookpro/ui';
import { notFound, redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { PractitionerEditForm } from './edit-form';

export default async function EditPractitionerPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = await params;
  const user = await requireAuthenticatedUser(
    `/app/practitioners/${practitionerId}/edit`,
  );
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data } = await supabase
    .from('practitioners')
    .select('id, display_name, professional_title, registration_jurisdiction')
    .eq('id', practitionerId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle();
  if (!data) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Practitioner
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Edit profile
        </h1>
        <Card className="mt-8">
          <PractitionerEditForm practitioner={data} />
        </Card>
      </div>
    </main>
  );
}
