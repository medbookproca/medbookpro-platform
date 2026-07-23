import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireAuthenticatedUser('/app/patients');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const params = await searchParams;
  const query = (params.q ?? '').trim().replace(/[(),]/g, '').slice(0, 120);
  const status = ['draft', 'active', 'inactive', 'archived'].includes(
    params.status ?? '',
  )
    ? params.status
    : '';
  const supabase = await createClient();
  let patientQuery = supabase
    .from('patients')
    .select(
      'id, patient_number, first_name, middle_name, last_name, preferred_name, date_of_birth, status, interpreter_required',
    )
    .eq('organization_id', organization.organizationId)
    .order('last_name')
    .order('first_name');
  if (status) patientQuery = patientQuery.eq('status', status);
  if (query)
    patientQuery = patientQuery.or(
      `patient_number.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
    );
  const { data, error } = await patientQuery;
  const patients = data ?? [];
  const { data: duplicateFlags } = patients.length
    ? await supabase
        .from('patient_duplicate_flags')
        .select('patient_id')
        .in(
          'patient_id',
          patients.map((patient) => patient.id),
        )
        .eq('status', 'open')
    : { data: [] };
  const duplicateIds = new Set(
    (duplicateFlags ?? []).map((flag) => flag.patient_id),
  );
  if (error)
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <Card>
          <p role="alert">Patients are temporarily unavailable.</p>
        </Card>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Patients
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Patient foundation
            </h1>
            <p className="mt-3 text-slate-600">
              Organization-owned identity and consent readiness. No clinical
              history or appointments.
            </p>
          </div>
          <Link
            href="/app/patients/new"
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
          >
            Add patient
          </Link>
        </div>
        <Card className="mt-8">
          <form className="flex flex-wrap gap-3" role="search">
            <label className="sr-only" htmlFor="patient-search">
              Search patients
            </label>
            <input
              id="patient-search"
              name="q"
              defaultValue={query}
              placeholder="Search name or patient number"
              className="min-w-64 flex-1 rounded border border-slate-300 px-3 py-2"
            />
            <select
              name="status"
              defaultValue={status}
              aria-label="Filter by status"
              className="rounded border border-slate-300 px-3 py-2"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <button className="rounded border border-slate-300 px-4 py-2 font-medium">
              Search
            </button>
          </form>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">
                Patients in {organization.organizationName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Patient number</th>
                  <th className="px-3 py-3 font-medium">Date of birth</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Review</th>
                  <th className="px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100">
                    <td className="px-3 py-4 font-medium">
                      {patient.preferred_name ||
                        `${patient.first_name} ${patient.last_name}`}
                    </td>
                    <td className="px-3 py-4">{patient.patient_number}</td>
                    <td className="px-3 py-4">{patient.date_of_birth}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {duplicateIds.has(patient.id) ? (
                        <span className="font-medium text-amber-700">
                          Potential duplicate
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        className="font-medium text-blue-700 hover:underline"
                        href={`/app/patients/${patient.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {patients.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-600">
              No patients match this search.
            </p>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
