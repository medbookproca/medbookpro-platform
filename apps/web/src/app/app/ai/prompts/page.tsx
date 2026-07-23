import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { createPromptAction } from '../actions';

export default async function AiPromptsPage() {
  const user = await requireAuthenticatedUser('/app/ai/prompts');
  const org = await getActiveOrganizationContext(user.id);
  if (!org) return null;
  const supabase = await createClient();
  const { data: prompts } = await supabase
    .from('ai_prompts')
    .select('id,name,category,status,approval_state,created_at')
    .eq('organization_id', org.organizationId)
    .order('created_at', { ascending: false });
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Prompt management</h1>
        <p className="mt-3 text-slate-600">
          Draft and review prompt versions. Publishing requires an authorized
          human and does not call a provider.
        </p>
        <Card className="mt-8">
          <h2 className="text-xl font-semibold">Create draft prompt</h2>
          <form action={createPromptAction} className="mt-4 grid gap-4">
            <label>
              Name
              <input
                name="name"
                required
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label>
              Category
              <select
                name="category"
                className="mt-1 block w-full rounded border p-2"
              >
                <option>clinical</option>
                <option>administrative</option>
                <option>communication</option>
                <option>coding</option>
                <option>safety</option>
              </select>
            </label>
            <label>
              System prompt
              <textarea
                name="systemPrompt"
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label>
              User template
              <textarea
                name="userTemplate"
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <button
              className="w-fit rounded bg-blue-600 px-4 py-2 font-medium text-white"
              type="submit"
            >
              Save draft
            </button>
          </form>
        </Card>
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">Organization prompts</h2>
          <ul className="mt-4 divide-y">
            {(prompts ?? []).map((prompt) => (
              <li className="py-3" key={prompt.id}>
                <p className="font-medium">{prompt.name}</p>
                <p className="text-sm text-slate-600">
                  {prompt.category} · {prompt.status} · {prompt.approval_state}
                </p>
              </li>
            ))}
            {prompts?.length === 0 && (
              <li className="py-3 text-slate-600">No prompts yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </main>
  );
}
