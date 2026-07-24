import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { EncounterForm } from './encounter-form';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function NewEncounterPage() {
  const user = await requireAuthenticatedUser('/app/clinical/new');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [{ data: patients }, { data: practitioners }, { data: appointments }] =
    await Promise.all([
      supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('last_name'),
      supabase
        .from('practitioners')
        .select('id, display_name')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('display_name'),
      supabase
        .from('appointments')
        .select('id, patient_id, practitioner_id, scheduled_start, status')
        .eq('organization_id', organization.organizationId)
        .in('status', ['in_progress', 'completed'])
        .order('scheduled_start', { ascending: false })
        .limit(100),
    ]);
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Clinical
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Create encounter
            </h1>
            <p className="mt-3 text-slate-600">
              Link the record to an in-progress or completed appointment when
              applicable.
            </p>
          </div>
          <Link
            href="/app/clinical"
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back
          </Link>
        </div>
        <Card className="mt-8">
          <EncounterForm
            patients={patients ?? []}
            practitioners={practitioners ?? []}
            appointments={appointments ?? []}
          />
        </Card>
      </div>
    </main>
  );
}
