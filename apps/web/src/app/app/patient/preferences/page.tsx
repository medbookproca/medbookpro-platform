import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';
import { patientPreferencesAction } from '../actions';

export default async function PatientPreferencesPage() {
  await requirePatientPortalAccount('/app/patient/preferences');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_preferences');
  if (error) throw error;
  const preferences = data as { appointment_reminders?: boolean; marketing_opt_in?: boolean; sms_enabled?: boolean; email_enabled?: boolean; preferred_language?: string };
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-2xl"><h1 className="text-4xl font-semibold">Preferences</h1><Card className="mt-8"><form action={patientPreferencesAction} className="space-y-4"><label className="flex gap-3"><input type="checkbox" name="appointmentReminders" defaultChecked={preferences.appointment_reminders ?? true} />Appointment reminders</label><label className="flex gap-3"><input type="checkbox" name="marketingOptIn" defaultChecked={preferences.marketing_opt_in ?? false} />Optional communications</label><label className="flex gap-3"><input type="checkbox" name="smsEnabled" defaultChecked={preferences.sms_enabled ?? false} />SMS notifications</label><label className="flex gap-3"><input type="checkbox" name="emailEnabled" defaultChecked={preferences.email_enabled ?? true} />Email notifications</label><label className="block"><span className="text-sm font-medium">Preferred language</span><input name="preferredLanguage" defaultValue={preferences.preferred_language ?? 'en-CA'} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label><button className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white" type="submit">Save preferences</button></form></Card></div></main>;
}
