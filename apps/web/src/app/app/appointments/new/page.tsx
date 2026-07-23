import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { AppointmentForm } from '../appointment-form';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function NewAppointmentPage() {
  const user = await requireAuthenticatedUser('/app/appointments/new');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [
    { data: patients },
    { data: practitioners },
    { data: locations },
    { data: services },
  ] = await Promise.all([
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
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Appointments
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Create appointment
            </h1>
            <p className="mt-3 text-slate-600">
              The server validates assignments, availability, holidays, time
              off, breaks, and conflicts.
            </p>
          </div>
          <Link
            href="/app/appointments"
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back
          </Link>
        </div>
        <Card className="mt-8">
          <AppointmentForm
            patients={(patients ?? []).map((item) => ({
              id: item.id,
              label: `${item.first_name} ${item.last_name}`,
            }))}
            practitioners={(practitioners ?? []).map((item) => ({
              id: item.id,
              label: item.display_name,
            }))}
            locations={(locations ?? []).map((item) => ({
              id: item.id,
              label: item.name,
            }))}
            services={(services ?? []).map((item) => ({
              id: item.id,
              label: item.name,
            }))}
          />
        </Card>
      </div>
    </main>
  );
}
