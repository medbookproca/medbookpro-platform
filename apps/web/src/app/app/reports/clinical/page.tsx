import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { ReportNav } from '../report-nav';

export default async function ClinicalReportPage() { const user = await requireAuthenticatedUser('/app/reports/clinical'); const org = await getActiveOrganizationContext(user.id); if (!org) return null; const supabase = await createClient(); const { data } = await supabase.rpc('get_clinical_summary', { p_organization_id: org.organizationId }); const rows = Array.isArray(data) ? data as Array<Record<string, string | number>> : []; return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-6xl"><h1 className="text-4xl font-semibold tracking-tight">Clinical activity</h1><p className="mt-3 text-slate-600">Counts only; clinical note content is never included.</p><ReportNav /><Card className="mt-8"><div className="space-y-3">{rows.map((row, index) => <p className="rounded border p-3" key={index}>{String(row.activity_date)} · {String(row.status)} · encounters {String(row.encounter_count)}</p>)}{!rows.length && <p className="text-sm text-slate-600">No clinical activity recorded.</p>}</div></Card></div></main>; }
