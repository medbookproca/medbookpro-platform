import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { createEncounterAction } from '../actions';
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
          <form action={createEncounterAction} className="grid gap-5">
            <label className="grid gap-2 font-medium">
              Patient
              <select
                name="patientId"
                required
                className="rounded border border-slate-300 px-3 py-2"
              >
                {(patients ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.first_name} {item.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Practitioner
              <select
                name="practitionerId"
                required
                className="rounded border border-slate-300 px-3 py-2"
              >
                {(practitioners ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Appointment context
              <select
                name="appointmentId"
                className="rounded border border-slate-300 px-3 py-2"
              >
                <option value="">No appointment link</option>
                {(appointments ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {new Date(item.scheduled_start).toLocaleString('en-CA')} ·{' '}
                    {item.status} · {item.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Encounter type
              <input
                name="encounterType"
                defaultValue="visit"
                required
                maxLength={120}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium">
              Initial status
              <select
                name="status"
                defaultValue="draft"
                className="rounded border border-slate-300 px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="in_progress">In progress</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
            >
              Create encounter
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
