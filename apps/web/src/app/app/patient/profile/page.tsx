import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';
import { patientProfileAction } from '../actions';

export default async function PatientProfilePage() {
  await requirePatientPortalAccount('/app/patient/profile');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_profile');
  if (error) throw error;
  const profile = data as { preferredName?: string; preferredLanguage?: string; email?: string; phone?: string };
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-2xl"><h1 className="text-4xl font-semibold">Profile</h1><Card className="mt-8"><form action={patientProfileAction} className="space-y-5"><label className="block"><span className="text-sm font-medium">Preferred name</span><input name="preferredName" defaultValue={profile.preferredName ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block"><span className="text-sm font-medium">Preferred language</span><input name="preferredLanguage" defaultValue={profile.preferredLanguage ?? 'en-CA'} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block"><span className="text-sm font-medium">Email</span><input type="email" name="email" defaultValue={profile.email ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block"><span className="text-sm font-medium">Phone</span><input name="phone" defaultValue={profile.phone ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label><button className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white" type="submit">Save profile</button></form></Card></div></main>;
}
