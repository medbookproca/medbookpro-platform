import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function AiPage() {
  const user = await requireAuthenticatedUser('/app/ai');
  const org = await getActiveOrganizationContext(user.id);
  if (!org) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_usage_metrics', {});
  const metrics = data as {
    requestCount?: number;
    completedCount?: number;
    blockedCount?: number;
  } | null;
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          AI foundation
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Assistive workflows, not autonomous care
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Organization-scoped placeholders for future reviewed AI assistance in{' '}
          {org.organizationName}. No provider is connected and no clinical
          record is created.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-600">Requests</p>
            <p className="mt-2 text-3xl font-semibold">
              {metrics?.requestCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-600">Completed placeholders</p>
            <p className="mt-2 text-3xl font-semibold">
              {metrics?.completedCount ?? 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-600">Blocked</p>
            <p className="mt-2 text-3xl font-semibold">
              {metrics?.blockedCount ?? 0}
            </p>
          </Card>
        </div>
        <nav
          aria-label="AI foundation sections"
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {[
            ['Prompts', '/app/ai/prompts'],
            ['Requests', '/app/ai/requests'],
            ['Providers', '/app/ai/providers'],
            ['Metrics', '/app/ai/metrics'],
            ['Settings', '/app/ai/settings'],
          ].map(([label, href]) => (
            <Card key={href}>
              <Link
                className="font-semibold text-blue-700 underline"
                href={href}
              >
                {label}
              </Link>
              <p className="mt-2 text-sm text-slate-600">
                Foundation placeholder.
              </p>
            </Card>
          ))}
        </nav>
      </div>
    </main>
  );
}
