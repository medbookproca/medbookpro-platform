import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAiRequestAction } from '../actions';

export default async function AiRequestsPage() {
  const user = await requireAuthenticatedUser('/app/ai/requests');
  const org = await getActiveOrganizationContext(user.id);
  if (!org) return null;
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from('ai_requests')
    .select(
      'id,request_type,status,human_review_required,blocked,clinical_disclaimer,requested_at',
    )
    .eq('organization_id', org.organizationId)
    .order('requested_at', { ascending: false })
    .limit(25);
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">AI requests</h1>
        <p className="mt-3 text-slate-600">
          Requests are queued placeholders and always require qualified human
          review.
        </p>
        <Card className="mt-8">
          <h2 className="text-xl font-semibold">Queue a reviewed request</h2>
          <form action={createAiRequestAction} className="mt-4 grid gap-4">
            <label>
              Prompt version ID
              <input
                name="promptVersionId"
                required
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label>
              Patient ID (optional)
              <input
                name="patientId"
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label>
              Encounter ID (optional)
              <input
                name="encounterId"
                className="mt-1 block w-full rounded border p-2"
              />
            </label>
            <label>
              Request type
              <select
                name="requestType"
                className="mt-1 block w-full rounded border p-2"
              >
                <option>soap_assistance</option>
                <option>clinical_note_drafting</option>
                <option>document_summarization</option>
                <option>patient_education</option>
                <option>clinical_letter_drafting</option>
              </select>
            </label>
            <button
              className="w-fit rounded bg-blue-600 px-4 py-2 font-medium text-white"
              type="submit"
            >
              Queue placeholder
            </button>
          </form>
        </Card>
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">Recent requests</h2>
          <ul className="mt-4 divide-y">
            {(requests ?? []).map((request) => (
              <li className="py-3" key={request.id}>
                <p className="font-medium">
                  {request.request_type} · {request.status}
                </p>
                <p className="text-sm text-slate-600">
                  {request.clinical_disclaimer}{' '}
                  {request.blocked ? 'Blocked.' : 'Human review required.'}
                </p>
              </li>
            ))}
            {requests?.length === 0 && (
              <li className="py-3 text-slate-600">No requests yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </main>
  );
}
