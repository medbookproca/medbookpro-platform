import { Card } from '@medbookpro/ui';
import { createClient } from '@/lib/supabase/server';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';

export default async function AiMetricsPage() {
  await requireAuthenticatedUser('/app/ai/metrics');
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_usage_metrics', {});
  const metrics = data as Record<string, number> | null;
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">AI usage metrics</h1>
        <p className="mt-3 text-slate-600">
          Metrics are organization-scoped placeholders; no provider cost or
          token usage is real yet.
        </p>
        <Card className="mt-8">
          <dl className="grid gap-4 sm:grid-cols-3">
            {Object.entries(
              metrics ?? {
                requestCount: 0,
                completedCount: 0,
                blockedCount: 0,
                inputTokensPlaceholder: 0,
                outputTokensPlaceholder: 0,
                costPlaceholder: 0,
              },
            ).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm text-slate-600">{key}</dt>
                <dd className="text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </main>
  );
}
