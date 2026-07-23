import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';
import { patientConsentAction } from '../actions';

export default async function PatientConsentsPage() {
  await requirePatientPortalAccount('/app/patient/consents');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_consents');
  if (error) throw error;
  const consents = data as Array<{ id: string; consentType: string; version: string; consentDate: string; withdrawn: boolean }>;
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-semibold">Consents</h1><p className="mt-3 text-slate-600">Review your consent history and accept current portal documents.</p><div className="mt-8 space-y-4">{consents.map((consent) => <Card key={consent.id}><p className="font-semibold">{consent.consentType} · v{consent.version}</p><p className="text-sm text-slate-600">{consent.consentDate}{consent.withdrawn ? ' · Withdrawn' : ''}</p></Card>)}</div><Card className="mt-8"><form action={patientConsentAction} className="grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-medium">Consent type</span><select name="consentType" defaultValue="privacy_acknowledgement" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="privacy_acknowledgement">Privacy acknowledgement</option><option value="communication">Communication</option><option value="treatment">Treatment</option></select></label><label><span className="text-sm font-medium">Version</span><input name="version" defaultValue="1.0" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label><span className="text-sm font-medium">Consent date</span><input type="date" name="consentDate" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="sm:col-span-2"><span className="text-sm font-medium">Document reference (optional)</span><input name="documentReference" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><button className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white sm:col-span-2" type="submit">Accept consent</button></form></Card></div></main>;
}
