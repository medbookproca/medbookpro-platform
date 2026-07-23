import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export default async function BillingPage() { const user = await requireAuthenticatedUser('/app/billing'); const org = await getActiveOrganizationContext(user.id); if (!org) redirect('/onboarding'); const links = [['Invoices', '/app/billing/invoices'], ['Payments', '/app/billing/payments'], ['Receipts', '/app/billing/receipts'], ['Settings', '/app/billing/settings'], ['Mock payment', '/app/billing/mock-payment']]; return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Billing</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Financial foundation</h1><p className="mt-3 text-slate-600">Invoices and manual/mock payment records for {org.organizationName}. No gateway is connected.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{links.map(([label, href]) => <Card key={href}><Link className="font-semibold text-blue-700 underline" href={href}>{label}</Link><p className="mt-2 text-sm text-slate-600">Protected, organization-scoped workspace.</p></Card>)}</div></div></main>; }
