import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { CreateServiceForm, ServiceManager } from './service-manager';

export default async function ServicesPage() {
  const user = await requireAuthenticatedUser('/app/services');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, display_order, status')
    .eq('organization_id', organization.organizationId)
    .order('status')
    .order('display_order')
    .order('name');
  const canManage = organization.roleKeys.some((role) =>
    [
      'organization.owner',
      'organization.admin',
      'clinic.admin',
      'data.migration.specialist',
    ].includes(role),
  );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Services
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Clinic services
        </h1>
        <p className="mt-3 text-slate-600">
          Manage bookable services used by practitioners, appointments, and
          billing.
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
          >
            Services are temporarily unavailable.
          </p>
        ) : null}
        <div className="mt-8 grid gap-6 lg:grid-cols-[20rem_1fr]">
          {canManage ? (
            <Card>
              <h2 className="text-xl font-semibold">Add service</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create a service without entering patient information.
              </p>
              <div className="mt-5">
                <CreateServiceForm />
              </div>
            </Card>
          ) : null}
          <Card className={canManage ? '' : 'lg:col-span-2'}>
            <h2 className="text-xl font-semibold">Service catalogue</h2>
            <p className="mt-2 text-sm text-slate-600">
              {services?.length ?? 0} organization-scoped services.
            </p>
            <div className="mt-5">
              {services?.length ? (
                <ServiceManager services={services} />
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                  No services yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
