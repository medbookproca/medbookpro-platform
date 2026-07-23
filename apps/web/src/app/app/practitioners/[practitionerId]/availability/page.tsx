import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { AvailabilityClient } from './availability-client';

export default async function PractitionerAvailabilityPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = await params;
  const user = await requireAuthenticatedUser(
    `/app/practitioners/${practitionerId}/availability`,
  );
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [
    { data: practitioner },
    { data: templates },
    { data: blocks },
    { data: overrides },
    { data: timeOff },
    { data: holidays },
    { data: locations },
    { data: services },
  ] = await Promise.all([
    supabase
      .from('practitioners')
      .select('id, display_name, status')
      .eq('id', practitionerId)
      .eq('organization_id', organization.organizationId)
      .maybeSingle(),
    supabase
      .from('practitioner_availability_templates')
      .select('id, name, timezone, status')
      .eq('practitioner_id', practitionerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('practitioner_availability_blocks')
      .select('weekday, start_time, end_time, mode')
      .eq('practitioner_id', practitionerId)
      .order('weekday')
      .order('start_time'),
    supabase
      .from('practitioner_schedule_overrides')
      .select('override_date, kind, start_time, end_time, reason')
      .eq('practitioner_id', practitionerId)
      .order('override_date'),
    supabase
      .from('practitioner_time_off')
      .select('category, start_date, end_date, status, reason')
      .eq('practitioner_id', practitionerId)
      .order('start_date'),
    supabase
      .from('organization_holidays')
      .select('holiday_date, name, status')
      .eq('organization_id', organization.organizationId)
      .order('holiday_date'),
    supabase
      .from('locations')
      .select('id, name')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('services')
      .select('id, name')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('name'),
  ]);
  if (!practitioner) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Availability
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {practitioner.display_name}
            </h1>
            <p className="mt-2 text-slate-600">
              Foundational schedule configuration · {practitioner.status}
            </p>
          </div>
          <Link
            href={`/app/practitioners/${practitionerId}`}
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back to practitioner
          </Link>
        </div>
        <div className="mt-8">
          <AvailabilityClient
            practitionerId={practitionerId}
            templates={templates ?? []}
            blocks={blocks ?? []}
            overrides={overrides ?? []}
            timeOff={timeOff ?? []}
            holidays={holidays ?? []}
            locations={locations ?? []}
            services={services ?? []}
          />
        </div>
      </div>
    </main>
  );
}
