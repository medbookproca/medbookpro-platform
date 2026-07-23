import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';

export default async function PatientDashboardPage() {
  await requirePatientPortalAccount('/app/patient/dashboard');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_dashboard');
  if (error) throw error;
  const dashboard = data as { profile?: { preferredName?: string | null }; upcomingAppointments?: unknown[]; outstandingBalance?: number; unreadCommunications?: number };
  const links = [['Appointments', '/app/patient/appointments'], ['Billing', '/app/patient/billing'], ['Profile', '/app/patient/profile'], ['Preferences', '/app/patient/preferences'], ['Consents', '/app/patient/consents']];
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MedBookPro Patient Portal</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Welcome{dashboard.profile?.preferredName ? `, ${dashboard.profile.preferredName}` : ''}</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Card><p className="text-sm text-slate-600">Upcoming appointments</p><p className="mt-2 text-3xl font-semibold">{dashboard.upcomingAppointments?.length ?? 0}</p></Card><Card><p className="text-sm text-slate-600">Outstanding balance</p><p className="mt-2 text-3xl font-semibold">${(dashboard.outstandingBalance ?? 0).toFixed(2)} CAD</p></Card><Card><p className="text-sm text-slate-600">Unread communications</p><p className="mt-2 text-3xl font-semibold">{dashboard.unreadCommunications ?? 0}</p></Card></div><nav aria-label="Patient portal" className="mt-8 grid gap-4 sm:grid-cols-2">{links.map(([label, href]) => <Card key={href}><Link className="font-semibold text-blue-700 underline" href={href}>{label}</Link><p className="mt-2 text-sm text-slate-600">View your own information securely.</p></Card>)}</nav></div></main>;
}
