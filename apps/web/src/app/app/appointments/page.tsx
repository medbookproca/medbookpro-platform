import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function AppointmentsPage() {
  const user = await requireAuthenticatedUser('/app/appointments');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, scheduled_start, scheduled_end, status, appointment_type, patient_id, practitioner_id, location_id, service_id',
    )
    .eq('organization_id', organization.organizationId)
    .order('scheduled_start')
    .limit(100);
  const appointments = data ?? [];
  if (error)
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <Card>
          <p role="alert">Appointments are temporarily unavailable.</p>
        </Card>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Appointments
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Scheduling engine
            </h1>
            <p className="mt-3 text-slate-600">
              Availability-aware appointments for{' '}
              {organization.organizationName}.
            </p>
          </div>
          <Link
            href="/app/appointments/new"
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
          >
            New appointment
          </Link>
        </div>
        <Card className="mt-8">
          <nav
            aria-label="Appointment views"
            className="mb-5 flex gap-4 text-sm font-medium"
          >
            <Link className="text-blue-700" href="/app/appointments">
              List
            </Link>
            <span className="text-slate-400">Day</span>
            <span className="text-slate-400">Week</span>
          </nav>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <caption className="sr-only">
                Appointments in {organization.organizationName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3">Start</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Practitioner</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-4">
                      {new Date(appointment.scheduled_start).toLocaleString(
                        'en-CA',
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {appointment.appointment_type.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {appointment.patient_id}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {appointment.practitioner_id}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        className="font-medium text-blue-700 hover:underline"
                        href={`/app/appointments/${appointment.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {appointments.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-600">
              No appointments scheduled.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
