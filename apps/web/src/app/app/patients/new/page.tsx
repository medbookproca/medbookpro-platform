import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { PatientForm } from '../patient-form';

export default async function NewPatientPage() {
  const user = await requireAuthenticatedUser('/app/patients/new');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Patients
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Create patient
            </h1>
            <p className="mt-3 text-slate-600">
              Create an organization-owned patient identity record. Patient
              portal accounts are not created.
            </p>
          </div>
          <Link
            href="/app/patients"
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back
          </Link>
        </div>
        <Card className="mt-8">
          <PatientForm />
        </Card>
      </div>
    </main>
  );
}
