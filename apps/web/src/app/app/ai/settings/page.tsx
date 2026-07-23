import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { updateAiProviderSettingsAction } from '../actions';

export default async function AiSettingsPage() {
  const user = await requireAuthenticatedUser('/app/ai/settings');
  const org = await getActiveOrganizationContext(user.id);
  if (!org) return null;
  const supabase = await createClient();
  const { data: providers } = await supabase
    .from('ai_providers')
    .select('provider_key,display_name')
    .order('display_name');
  const { data: settings } = await supabase
    .from('ai_provider_settings')
    .select('provider_id,enabled,ai_providers(provider_key)')
    .eq('organization_id', org.organizationId);
  const enabledKeys = new Set(
    (settings ?? [])
      .filter((setting) => setting.enabled)
      .map(
        (setting) =>
          (setting.ai_providers as { provider_key: string } | null)
            ?.provider_key,
      ),
  );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Provider settings</h1>
        <p className="mt-3 text-slate-600">
          Enabling a catalogue entry only records an organization preference. It
          does not provision credentials or connect to a provider.
        </p>
        <div className="mt-8 grid gap-4">
          {(providers ?? []).map((provider) => (
            <Card key={provider.provider_key}>
              <form
                action={updateAiProviderSettingsAction}
                className="flex items-center justify-between gap-4"
              >
                <input
                  type="hidden"
                  name="providerKey"
                  value={provider.provider_key}
                />
                <span className="font-medium">{provider.display_name}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={enabledKeys.has(provider.provider_key)}
                  />{' '}
                  Enabled
                </label>
                <button
                  className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white"
                  type="submit"
                >
                  Save
                </button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
