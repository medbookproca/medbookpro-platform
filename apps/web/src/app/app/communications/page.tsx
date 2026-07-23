import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { redirect } from 'next/navigation';

export default async function CommunicationsPage() {
  const user = await requireAuthenticatedUser('/app/communications');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const links = [['Templates', '/app/communications/templates'], ['Queue and delivery log', '/app/communications/queue'], ['Mock send', '/app/communications/mock-send'], ['Organization settings', '/app/communications/settings']];
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Communications</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Notification foundation</h1><p className="mt-3 text-slate-600">Mock-only notification operations for {organization.organizationName}. No email or SMS is sent.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{links.map(([label, href]) => <Card key={href}><Link className="font-semibold text-blue-700 underline" href={href}>{label}</Link><p className="mt-2 text-sm text-slate-600">Protected, organization-scoped workspace.</p></Card>)}</div></div></main>;
}
