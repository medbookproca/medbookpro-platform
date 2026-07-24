import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { AppointmentEditForm } from './appointment-edit-form';

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
          <AppointmentEditForm
            appointment={appointment}
            locations={locations ?? []}
            services={services ?? []}
          />
        </Card>
      </div>
    </main>
  );
}
