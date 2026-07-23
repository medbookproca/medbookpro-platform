import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function AppointmentEncounterPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const user = await requireAuthenticatedUser('/app/appointments');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: appointment } = await supabase.from('appointments').select('id, patient_id, practitioner_id, status').eq('id', appointmentId).eq('organization_id', organization.organizationId).maybeSingle();
  const { data: encounter } = appointment ? await supabase.from('encounters').select('id, status').eq('appointment_id', appointmentId).eq('organization_id', organization.organizationId).order('created_at', { ascending: false }).limit(1).maybeSingle() : { data: null };
  if (!appointment) redirect('/app/appointments');
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Appointment clinical context</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Encounter</h1><Card className="mt-8"><p className="text-sm text-slate-600">Only in-progress or completed appointments can be linked to clinical records.</p>{encounter ? <Link href={`/app/clinical/${encounter.id}`} className="mt-5 inline-block rounded bg-blue-700 px-4 py-2 font-medium text-white">Open encounter ({encounter.status})</Link> : <p className="mt-5 text-sm">No encounter is linked yet. Use the clinical foundation route to create one with this appointment context.</p>}<Link href={`/app/appointments/${appointmentId}`} className="mt-5 block font-medium text-blue-700 hover:underline">Back to appointment</Link></Card></div></main>;
}
