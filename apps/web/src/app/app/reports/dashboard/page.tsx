import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { ReportNav } from '../report-nav';
import { requestReportExportAction } from '../actions';

export default async function ReportsDashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; locationId?: string; practitionerId?: string }> }) {
  const params = await searchParams;
  const user = await requireAuthenticatedUser('/app/reports/dashboard');
  const org = await getActiveOrganizationContext(user.id);
  if (!org) return null;
  const from = params.from ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_dashboard_summary', { p_organization_id: org.organizationId, p_from_date: from, p_to_date: to, p_location_id: params.locationId || undefined, p_practitioner_id: params.practitionerId || undefined });
  const metrics = (data ?? {}) as Record<string, string | number>;
  const cards = [['Appointments', metrics.appointments ?? 0], ['New patients', metrics.patients ?? 0], ['Revenue', `$${metrics.revenue ?? 0}`], ['Outstanding', `$${metrics.outstanding ?? 0}`], ['Payments', `$${metrics.payments ?? 0}`], ['Encounters', metrics.encounters ?? 0], ['Notifications', metrics.notifications ?? 0]];
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-6xl"><h1 className="text-4xl font-semibold tracking-tight">Reporting dashboard</h1><p className="mt-3 text-slate-600">{from} through {to}. Metrics are organization-scoped and descriptive.</p><ReportNav /><form className="mt-6 flex flex-wrap gap-3 rounded-xl border bg-white p-4" method="get"><label className="text-sm">From<input type="date" name="from" defaultValue={from} className="ml-2 rounded border p-2" /></label><label className="text-sm">To<input type="date" name="to" defaultValue={to} className="ml-2 rounded border p-2" /></label><label className="text-sm">Location ID<input name="locationId" className="ml-2 rounded border p-2" /></label><label className="text-sm">Practitioner ID<input name="practitionerId" className="ml-2 rounded border p-2" /></label><button className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Apply filters</button></form><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <Card key={String(label)}><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></Card>)}</div><form action={requestReportExportAction} className="mt-6"><input type="hidden" name="reportKey" value="dashboard" /><input type="hidden" name="format" value="csv" /><button className="rounded border bg-white px-4 py-2 text-sm font-semibold" type="submit">Request CSV export placeholder</button></form></div></main>;
}
