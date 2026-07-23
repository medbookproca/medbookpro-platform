import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function ClinicalPage() {
  const user = await requireAuthenticatedUser('/app/clinical');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('encounters')
    .select(
      'id, patient_id, practitioner_id, appointment_id, encounter_type, status, created_at, updated_at',
    )
    .eq('organization_id', organization.organizationId)
    .order('updated_at', { ascending: false })
    .limit(100);
  const encounters = data ?? [];
  if (error)
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <Card>
          <p role="alert">Clinical records are temporarily unavailable.</p>
        </Card>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Clinical
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Encounter foundation
            </h1>
            <p className="mt-3 text-slate-600">
              Secure organization-owned clinical records for{' '}
              {organization.organizationName}.
            </p>
          </div>
          <Link
            href="/app/clinical/new"
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
          >
            New encounter
          </Link>
        </div>
        <Card className="mt-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <caption className="sr-only">
                Clinical encounters in {organization.organizationName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Practitioner</th>
                  <th className="px-3 py-3">Appointment</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {encounters.map((encounter) => (
                  <tr key={encounter.id} className="border-b border-slate-100">
                    <td className="px-3 py-4">
                      {new Date(encounter.updated_at).toLocaleString('en-CA')}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {encounter.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">{encounter.encounter_type}</td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {encounter.patient_id}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {encounter.practitioner_id}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {encounter.appointment_id ?? '—'}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        href={`/app/clinical/${encounter.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {encounters.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-600">
              No encounters yet.
            </p>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
