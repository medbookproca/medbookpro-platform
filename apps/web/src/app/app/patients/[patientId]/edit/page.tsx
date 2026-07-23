import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { PatientEditForm } from './patient-edit-form';

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const user = await requireAuthenticatedUser(
    `/app/patients/${patientId}/edit`,
  );
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle();
  if (!patient) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Patients
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Edit patient
            </h1>
          </div>
          <Link
            href={`/app/patients/${patientId}`}
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back
          </Link>
        </div>
        <Card className="mt-8">
          <PatientEditForm patient={patient} />
        </Card>
      </div>
    </main>
  );
}
