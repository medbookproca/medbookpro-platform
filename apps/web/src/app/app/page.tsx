import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { createClient } from '@/lib/supabase/server';
import { signOutAction } from './actions';

export default async function AppPage() {
  const user = await requireAuthenticatedUser('/app');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) return null;
  const supabase = await createClient();
  const { data: summary, error } = await supabase
    .from('vw_dashboard_summary')
    .select(
      'active_appointments, active_patients, outstanding_invoices, recorded_payments, clinical_encounters, pending_notifications',
    )
    .eq('organization_id', organization.organizationId)
    .maybeSingle();
  const metrics = [
    ['Active appointments', summary?.active_appointments ?? 0],
    ['Active patients', summary?.active_patients ?? 0],
    ['Outstanding invoices', summary?.outstanding_invoices ?? 0],
    ['Recorded payments', summary?.recorded_payments ?? 0],
    ['Clinical encounters', summary?.clinical_encounters ?? 0],
    ['Pending notifications', summary?.pending_notifications ?? 0],
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {organization.organizationName}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Clinic dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              A scoped operational overview for{' '}
              {organization.locationName ?? 'your active location'}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/appointments/new"
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              New appointment
            </Link>
            <Link
              href="/app/patients/new"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add patient
            </Link>
          </div>
        </div>
        {error && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            Summary metrics are temporarily unavailable. You can still use the
            navigation to continue.
          </p>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm text-slate-600">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {value}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <h2 className="text-lg font-semibold">Continue working</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use the application navigation to open organization-scoped modules
              available to your role.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/app/appointments"
                className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Review appointments
              </Link>
              <Link
                href="/app/patients"
                className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Open patients
              </Link>
              <Link
                href="/app/reports"
                className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                View reports
              </Link>
              {organization.roleKeys.some((role) =>
                [
                  'organization.owner',
                  'organization.admin',
                  'clinic.admin',
                  'location.manager',
                ].includes(role),
              ) && (
                <Link
                  href="/app/settings/staff"
                  className="rounded-lg border border-slate-200 p-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Manage staff
                </Link>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Session</h2>
            <p className="mt-2 break-words text-sm text-slate-600">
              Signed in as {user.email ?? 'the authenticated user'}.
            </p>
            <form action={signOutAction} className="mt-5">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
