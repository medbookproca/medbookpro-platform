import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { ReportNav } from '../report-nav';

export default async function RevenueReportPage() { const user = await requireAuthenticatedUser('/app/reports/revenue'); const org = await getActiveOrganizationContext(user.id); if (!org) return null; const supabase = await createClient(); const { data } = await supabase.rpc('get_revenue_summary', { p_organization_id: org.organizationId }); const rows = Array.isArray(data) ? data as Array<Record<string, string | number>> : []; return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-6xl"><h1 className="text-4xl font-semibold tracking-tight">Revenue summary</h1><ReportNav /><Card className="mt-8"><div className="space-y-3">{rows.map((row, index) => <p className="rounded border p-3" key={index}>{String(row.period_start)} · total ${String(row.total)} · balance ${String(row.balance)} · invoices {String(row.invoice_count)}</p>)}{!rows.length && <p className="text-sm text-slate-600">No revenue data in the default period.</p>}</div></Card></div></main>; }
