import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { ReportNav } from '../report-nav';

export default async function AppointmentReportPage() { const user = await requireAuthenticatedUser('/app/reports/appointments'); const org = await getActiveOrganizationContext(user.id); if (!org) return null; const supabase = await createClient(); const { data } = await supabase.from('vw_appointment_statistics').select('activity_date, status, appointment_count').eq('organization_id', org.organizationId).order('activity_date', { ascending: false }).limit(100); return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-6xl"><h1 className="text-4xl font-semibold tracking-tight">Appointment statistics</h1><ReportNav /><Card className="mt-8"><div className="space-y-3">{(data ?? []).map((row) => <p className="rounded border p-3" key={`${row.activity_date}-${row.status}`}>{row.activity_date} · {row.status} · {row.appointment_count}</p>)}{!data?.length && <p className="text-sm text-slate-600">No appointment activity recorded.</p>}</div></Card></div></main>; }
