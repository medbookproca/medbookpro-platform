import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { notFound, redirect } from 'next/navigation';
import {
  changeEncounterStatusAction,
  updateCarePlanAction,
  updateFormAction,
  updateSoapAction,
} from '../actions';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

const fieldClass =
  'mt-1 block w-full rounded border border-slate-300 px-3 py-2';

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ encounterId: string }>;
}) {
  const user = await requireAuthenticatedUser('/app/clinical');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const { encounterId } = await params;
  const supabase = await createClient();
  const [
    { data: encounter, error },
    { data: soap },
    { data: carePlans },
    { data: forms },
    { data: diagnoses },
    { data: procedures },
    { data: attachments },
  ] = await Promise.all([
    supabase
      .from('encounters')
      .select('*')
      .eq('id', encounterId)
      .eq('organization_id', organization.organizationId)
      .maybeSingle(),
    supabase
      .from('soap_notes')
      .select('*')
      .eq('encounter_id', encounterId)
      .maybeSingle(),
    supabase
      .from('care_plans')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('clinical_forms')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('clinical_diagnoses')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('is_primary', { ascending: false }),
    supabase
      .from('clinical_procedures')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('performed_date', { ascending: false }),
    supabase
      .from('clinical_attachments')
      .select(
        'id, filename, media_type, size_bytes, storage_reference, uploaded_by, created_at',
      )
      .eq('encounter_id', encounterId)
      .order('created_at', { ascending: false }),
  ]);
  if (error || !encounter) notFound();
  const editable =
    encounter.status !== 'completed' && encounter.status !== 'archived';
  const nextStatuses: Record<string, string[]> = {
    draft: ['in_progress', 'archived'],
    in_progress: ['completed'],
    completed: ['amended', 'archived'],
    amended: ['completed', 'archived'],
    archived: [],
  };
  const plan = carePlans?.[0];
  const form = forms?.[0];
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Clinical encounter
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              {encounter.encounter_type}
            </h1>
            <p className="mt-3 text-slate-600">
              Patient {encounter.patient_id} · Practitioner{' '}
              {encounter.practitioner_id}
            </p>
          </div>
          <Link
            href="/app/clinical"
            className="rounded border border-slate-300 px-4 py-2 font-medium"
          >
            Back to clinical
          </Link>
        </div>
        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">Lifecycle</p>
              <p className="mt-1 font-semibold">{encounter.status}</p>
              <p className="mt-1 text-sm text-slate-600">
                Appointment: {encounter.appointment_id ?? 'not linked'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {nextStatuses[encounter.status].map((status) => (
                <form key={status} action={changeEncounterStatusAction}>
                  <input
                    type="hidden"
                    name="encounterId"
                    value={encounter.id}
                  />
                  <input type="hidden" name="status" value={status} />
                  <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
                    {status.replace('_', ' ')}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </Card>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold">SOAP note</h2>
            {editable ? (
              <form
                action={updateSoapAction}
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <input type="hidden" name="encounterId" value={encounter.id} />
                {(
                  ['subjective', 'objective', 'assessment', 'plan'] as const
                ).map((section) => (
                  <label
                    key={section}
                    className="grid gap-2 text-sm font-medium capitalize"
                  >
                    {section}
                    <textarea
                      name={section}
                      defaultValue={soap?.[section] ?? ''}
                      rows={5}
                      className={fieldClass}
                    />
                  </label>
                ))}
                <button className="rounded bg-slate-900 px-4 py-2 font-medium text-white md:col-span-2">
                  Save SOAP note
                </button>
              </form>
            ) : (
              <dl className="mt-5 grid gap-4 md:grid-cols-2">
                {(
                  ['subjective', 'objective', 'assessment', 'plan'] as const
                ).map((section) => (
                  <div key={section}>
                    <dt className="font-medium capitalize">{section}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {soap?.[section] || 'Not documented.'}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Care plan</h2>
            {editable ? (
              <form action={updateCarePlanAction} className="mt-5 grid gap-3">
                <input type="hidden" name="encounterId" value={encounter.id} />
                {plan ? (
                  <input type="hidden" name="carePlanId" value={plan.id} />
                ) : null}
                <label className="text-sm">
                  Goals
                  <textarea
                    name="goals"
                    defaultValue={plan?.goals ?? ''}
                    rows={3}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  Interventions
                  <textarea
                    name="interventions"
                    defaultValue={plan?.interventions ?? ''}
                    rows={3}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  Follow-up notes
                  <textarea
                    name="followUpNotes"
                    defaultValue={plan?.follow_up_notes ?? ''}
                    rows={3}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm">
                  Status
                  <select
                    name="status"
                    defaultValue={plan?.status ?? 'active'}
                    className={fieldClass}
                  >
                    <option value="active">Active</option>
                    <option value="on_hold">On hold</option>
                    <option value="completed">Completed</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </label>
                <label className="text-sm">
                  Review date
                  <input
                    type="date"
                    name="reviewDate"
                    defaultValue={plan?.review_date ?? ''}
                    className={fieldClass}
                  />
                </label>
                <button className="rounded bg-slate-900 px-4 py-2 font-medium text-white">
                  Save care plan
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Care plans are immutable on archived encounters.
              </p>
            )}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Diagnoses and procedures</h2>
            <p className="mt-3 text-sm text-slate-600">
              Foundation placeholders are stored server-side and await coding
              integrations.
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-medium">Diagnoses</dt>
                <dd>
                  {diagnoses?.length
                    ? diagnoses.map((item) => (
                        <p key={item.id}>
                          {item.coding_system} {item.code} — {item.description}
                          {item.is_primary ? ' (primary)' : ''}
                        </p>
                      ))
                    : 'None recorded.'}
                </dd>
              </div>
              <div>
                <dt className="font-medium">Procedures</dt>
                <dd>
                  {procedures?.length
                    ? procedures.map((item) => (
                        <p key={item.id}>
                          {item.code} — {item.description}
                        </p>
                      ))
                    : 'None recorded.'}
                </dd>
              </div>
            </dl>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Forms</h2>
            {editable ? (
              <form action={updateFormAction} className="mt-4 grid gap-3">
                <input type="hidden" name="encounterId" value={encounter.id} />
                {form ? (
                  <input type="hidden" name="formId" value={form.id} />
                ) : null}
                <input
                  name="formType"
                  placeholder="Form type"
                  defaultValue={form?.form_type ?? 'clinical_form'}
                  className={fieldClass}
                  required
                />
                <input
                  name="title"
                  placeholder="Title"
                  defaultValue={form?.title ?? ''}
                  className={fieldClass}
                  required
                />
                <input
                  name="version"
                  placeholder="Version"
                  defaultValue={form?.version ?? '1'}
                  className={fieldClass}
                  required
                />
                <select
                  name="completionStatus"
                  defaultValue={form?.completion_status ?? 'draft'}
                  className={fieldClass}
                >
                  <option value="draft">Draft</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="void">Void</option>
                </select>
                <textarea
                  name="structuredResponse"
                  defaultValue={JSON.stringify(
                    form?.structured_response ?? {},
                    null,
                    2,
                  )}
                  rows={5}
                  className={fieldClass}
                />
                <button className="rounded bg-slate-900 px-4 py-2 font-medium text-white">
                  Save form placeholder
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Forms are immutable on archived encounters.
              </p>
            )}
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Attachment metadata</h2>
            <p className="mt-3 text-sm text-slate-600">
              {attachments?.length ?? 0} metadata record(s). File uploads are
              not implemented.
            </p>
            {attachments?.map((item) => (
              <p key={item.id} className="mt-2 text-sm">
                {item.filename} · {item.media_type} · {item.size_bytes} bytes
              </p>
            ))}
          </Card>
        </div>
      </div>
    </main>
  );
}
