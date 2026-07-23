import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { PatientDetail } from './patient-detail';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const user = await requireAuthenticatedUser(`/app/patients/${patientId}`);
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [
    { data: patient },
    { data: contact },
    { data: identifiers },
    { data: emergencyContacts },
    { data: consents },
    { data: duplicateFlags },
  ] = await Promise.all([
    supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('organization_id', organization.organizationId)
      .maybeSingle(),
    supabase
      .from('patient_contacts')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle(),
    supabase
      .from('patient_identifiers')
      .select(
        'id, identifier_type, identifier_last4, issuing_jurisdiction, is_primary, status',
      )
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false }),
    supabase
      .from('patient_emergency_contacts')
      .select(
        'id, name, relationship, phone, alternate_phone, email, address, is_primary, status',
      )
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('is_primary', { ascending: false }),
    supabase
      .from('patient_consents')
      .select(
        'id, consent_type, consent_date, version, document_reference, withdrawn',
      )
      .eq('patient_id', patientId)
      .order('consent_date', { ascending: false }),
    supabase
      .from('patient_duplicate_flags')
      .select('id, matched_patient_id, match_reason, status')
      .eq('patient_id', patientId)
      .eq('status', 'open'),
  ]);
  if (!patient) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Patient
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {patient.preferred_name ||
                `${patient.first_name} ${patient.last_name}`}
            </h1>
            <p className="mt-2 text-slate-600">
              {patient.patient_number} · organization-owned identity record
            </p>
          </div>
          <Link
            href="/app/patients"
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back to patients
          </Link>
        </div>
        <div className="mt-8">
          <PatientDetail
            patient={patient}
            contact={contact}
            identifiers={identifiers ?? []}
            emergencyContacts={emergencyContacts ?? []}
            consents={consents ?? []}
            duplicateFlags={duplicateFlags ?? []}
          />
        </div>
      </div>
    </main>
  );
}
