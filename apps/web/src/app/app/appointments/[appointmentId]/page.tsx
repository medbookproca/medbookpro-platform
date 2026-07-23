import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { notFound, redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { changeAppointmentStatusAction } from '../actions';

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await requireAuthenticatedUser('/app/appointments');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle();
  if (error || !appointment) notFound();
  const nextStatuses: Record<string, string[]> = {
    draft: ['scheduled', 'cancelled'],
    scheduled: ['confirmed', 'cancelled', 'no_show'],
    confirmed: ['checked_in', 'cancelled', 'no_show'],
    checked_in: ['in_progress'],
    in_progress: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
  };
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Appointment
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Scheduling detail
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/app/appointments/${appointmentId}/edit`}
              className="rounded border border-slate-300 px-4 py-2 font-medium"
            >
              Edit
            </Link>
            <Link
              href="/app/appointments"
              className="rounded border border-slate-300 px-4 py-2 font-medium"
            >
              Back to appointments
            </Link>
          </div>
        </div>
        <Card className="mt-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-600">Start</dt>
              <dd className="font-medium">
                {new Date(appointment.scheduled_start).toLocaleString('en-CA')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">End</dt>
              <dd className="font-medium">
                {new Date(appointment.scheduled_end).toLocaleString('en-CA')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Status</dt>
              <dd className="font-medium">{appointment.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Type</dt>
              <dd className="font-medium">
                {appointment.appointment_type.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Patient</dt>
              <dd className="font-mono text-xs">{appointment.patient_id}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Practitioner</dt>
              <dd className="font-mono text-xs">
                {appointment.practitioner_id}
              </dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            {nextStatuses[appointment.status].map((status) => (
              <form key={status} action={changeAppointmentStatusAction}>
                <input
                  type="hidden"
                  name="appointmentId"
                  value={appointment.id}
                />
                <input type="hidden" name="status" value={status} />
                <button
                  className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
                  type="submit"
                >
                  {status.replace('_', ' ')}
                </button>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
