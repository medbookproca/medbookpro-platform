import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { PractitionerDetail } from './practitioner-detail';

export default async function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = await params;
  const user = await requireAuthenticatedUser(
    `/app/practitioners/${practitionerId}`,
  );
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data: practitioner } = await supabase
    .from('practitioners')
    .select(
      'id, organization_id, display_name, professional_title, registration_jurisdiction, status, linked_membership_id',
    )
    .eq('id', practitionerId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle();
  if (!practitioner) notFound();
  const [
    { data: locations },
    { data: credentials },
    { data: specialties },
    { data: services },
    { data: languages },
    { data: publicProfile },
    { data: locationOptions },
    { data: specialtyOptions },
    { data: serviceOptions },
    { data: membershipOptions },
  ] = await Promise.all([
    supabase
      .from('practitioner_location_assignments')
      .select(
        'id, location_id, status, is_primary, effective_from, effective_to, booking_visible, internal_notes, locations(name)',
      )
      .eq('practitioner_id', practitionerId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('practitioner_credentials')
      .select(
        'id, credential_type, issuing_body, registration_number, jurisdiction, issue_date, expiry_date, verification_status, verification_date, notes, is_primary, status',
      )
      .eq('practitioner_id', practitionerId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('practitioner_specialty_assignments')
      .select(
        'specialty_id, status, is_primary, display_order, specialties(name)',
      )
      .eq('practitioner_id', practitionerId)
      .order('display_order'),
    supabase
      .from('practitioner_service_assignments')
      .select(
        'service_id, location_id, status, services(name), locations(name)',
      )
      .eq('practitioner_id', practitionerId)
      .order('display_order'),
    supabase
      .from('practitioner_languages')
      .select('language_code, is_primary')
      .eq('practitioner_id', practitionerId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('practitioner_public_profiles')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .maybeSingle(),
    supabase
      .from('locations')
      .select('id, name')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('specialties')
      .select('id, name')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('display_order')
      .order('name'),
    supabase
      .from('services')
      .select('id, name')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('display_order')
      .order('name'),
    supabase
      .from('organization_memberships')
      .select('id, profile_id')
      .eq('organization_id', organization.organizationId)
      .eq('status', 'active')
      .order('created_at'),
  ]);
  const mappedLocations = (
    (locations ?? []) as Array<{
      id: string;
      location_id: string;
      status: string;
      is_primary: boolean;
      locations: { name: string } | { name: string }[] | null;
    }>
  ).map((row) => ({
    id: row.location_id,
    name: Array.isArray(row.locations)
      ? (row.locations[0]?.name ?? 'Location')
      : (row.locations?.name ?? 'Location'),
    status: row.status,
    isPrimary: row.is_primary,
  }));
  const mappedSpecialties = (
    (specialties ?? []) as Array<{
      specialty_id: string;
      status: string;
      is_primary: boolean;
      specialties: { name: string } | { name: string }[] | null;
    }>
  ).map((row) => ({
    id: row.specialty_id,
    name: Array.isArray(row.specialties)
      ? (row.specialties[0]?.name ?? 'Specialty')
      : (row.specialties?.name ?? 'Specialty'),
    status: row.status,
    isPrimary: row.is_primary,
  }));
  const mappedServices = (
    (services ?? []) as Array<{
      service_id: string;
      location_id: string | null;
      status: string;
      services: { name: string } | { name: string }[] | null;
      locations: { name: string } | { name: string }[] | null;
    }>
  ).map((row) => ({
    id: row.service_id,
    name: Array.isArray(row.services)
      ? (row.services[0]?.name ?? 'Service')
      : (row.services?.name ?? 'Service'),
    locationName: Array.isArray(row.locations)
      ? (row.locations[0]?.name ?? null)
      : (row.locations?.name ?? null),
    status: row.status,
  }));
  const memberships = (
    (membershipOptions ?? []) as Array<{ id: string; profile_id: string }>
  ).map((membership) => ({
    id: membership.id,
    label: `Membership ${membership.profile_id.slice(0, 8)}`,
  }));
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Practitioner
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {practitioner.display_name}
            </h1>
            <p className="mt-2 text-slate-600">
              {practitioner.professional_title ?? 'Professional profile'} ·{' '}
              {practitioner.status}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/app/practitioners"
              className="rounded border border-slate-300 px-4 py-2 font-medium"
            >
              Back
            </Link>
            <Link
              href={`/app/practitioners/${practitionerId}/edit`}
              className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
            >
              Edit profile
            </Link>
            <Link
              href={`/app/practitioners/${practitionerId}/availability`}
              className="rounded border border-blue-300 px-4 py-2 font-medium text-blue-800"
            >
              Availability
            </Link>
          </div>
        </div>
        <div className="mt-8">
          <PractitionerDetail
            practitioner={practitioner}
            locations={mappedLocations}
            credentials={credentials ?? []}
            specialties={mappedSpecialties}
            services={mappedServices}
            languages={languages ?? []}
            publicProfile={publicProfile}
            locationOptions={locationOptions ?? []}
            specialtyOptions={specialtyOptions ?? []}
            serviceOptions={serviceOptions ?? []}
            memberships={memberships}
          />
        </div>
      </div>
    </main>
  );
}
