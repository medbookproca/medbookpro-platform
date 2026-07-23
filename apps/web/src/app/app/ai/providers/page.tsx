import { Card } from '@medbookpro/ui';
import { createClient } from '@/lib/supabase/server';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';

export default async function AiProvidersPage() {
  await requireAuthenticatedUser('/app/ai/providers');
  const supabase = await createClient();
  const { data: providers } = await supabase
    .from('ai_providers')
    .select('provider_key,display_name,provider_type,active')
    .order('display_name');
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Provider catalogue</h1>
        <p className="mt-3 text-slate-600">
          These are future adapter placeholders only. No provider credentials or
          network calls are configured.
        </p>
        <Card className="mt-8">
          <ul className="divide-y">
            {(providers ?? []).map((provider) => (
              <li
                className="flex justify-between py-4"
                key={provider.provider_key}
              >
                <span className="font-medium">{provider.display_name}</span>
                <span className="text-sm text-slate-600">
                  {provider.provider_type} ·{' '}
                  {provider.active ? 'catalogued' : 'inactive'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
