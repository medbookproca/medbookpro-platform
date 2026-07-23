import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { updateAppointmentAction } from '../../actions';

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await requireAuthenticatedUser('/app/appointments');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const { appointmentId } = await params;
  const supabase = await createClient();
  const [{ data: appointment }, { data: locations }, { data: services }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('organization_id', organization.organizationId)
        .maybeSingle(),
      supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', organization.organizationId)
        .eq('operational_status', 'active')
        .order('name'),
      supabase
        .from('services')
        .select('id, name')
        .eq('organization_id', organization.organizationId)
        .eq('status', 'active')
        .order('name'),
    ]);
  if (!appointment) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Appointments
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Edit appointment
            </h1>
          </div>
          <Link
            href={`/app/appointments/${appointmentId}`}
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Cancel
          </Link>
        </div>
        <Card className="mt-8">
          <form
            action={updateAppointmentAction}
            className="grid gap-5 md:grid-cols-2"
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input
              type="hidden"
              name="patientId"
              value={appointment.patient_id}
            />
            <input
              type="hidden"
              name="practitionerId"
              value={appointment.practitioner_id}
            />
            <label className="grid gap-2 font-medium">
              Location
              <select
                name="locationId"
                defaultValue={appointment.location_id}
                required
                className="rounded border border-slate-300 px-3 py-2"
              >
                {(locations ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Service
              <select
                name="serviceId"
                defaultValue={appointment.service_id}
                required
                className="rounded border border-slate-300 px-3 py-2"
              >
                {(services ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Appointment type
              <select
                name="appointmentType"
                defaultValue={appointment.appointment_type}
                className="rounded border border-slate-300 px-3 py-2"
              >
                <option value="in_person">In person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="grid gap-2 font-medium">
              Start
              <input
                name="scheduledStart"
                type="datetime-local"
                defaultValue={new Date(appointment.scheduled_start)
                  .toISOString()
                  .slice(0, 16)}
                required
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium">
              Duration (minutes)
              <input
                name="durationMinutes"
                type="number"
                min="1"
                max="1440"
                defaultValue={appointment.duration_minutes}
                required
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium">
              Timezone
              <input
                name="timezone"
                defaultValue={appointment.timezone}
                required
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium">
              Pre-buffer (minutes)
              <input
                name="preBufferMinutes"
                type="number"
                min="0"
                max="1440"
                defaultValue={appointment.pre_buffer_minutes}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium">
              Post-buffer (minutes)
              <input
                name="postBufferMinutes"
                type="number"
                min="0"
                max="1440"
                defaultValue={appointment.post_buffer_minutes}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-2 font-medium md:col-span-2">
              Notes
              <textarea
                name="notes"
                maxLength={1000}
                rows={3}
                defaultValue={appointment.notes ?? ''}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-blue-700 px-4 py-2 font-medium text-white md:col-span-2"
            >
              Validate and save
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
