import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';
import { ReportNav } from './report-nav';

export default async function ReportsPage() { const user = await requireAuthenticatedUser('/app/reports'); const org = await getActiveOrganizationContext(user.id); if (!org) redirect('/onboarding'); return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Reports</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Operational analytics</h1><p className="mt-3 text-slate-600">Organization-scoped descriptive reporting for {org.organizationName}. No AI or predictive analytics.</p><ReportNav /><div className="mt-8 grid gap-4 sm:grid-cols-2"><Card><Link className="font-semibold text-blue-700 underline" href="/app/reports/dashboard">Open dashboard</Link><p className="mt-2 text-sm text-slate-600">Appointments, patients, revenue, payments, encounters, and notifications.</p></Card><Card><p className="font-semibold">Export placeholders</p><p className="mt-2 text-sm text-slate-600">CSV, Excel, and PDF are audit-only placeholders; no file is generated.</p></Card></div></div></main>; }
