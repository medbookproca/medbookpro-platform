'use client';

import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import { updateSoapAction, type ClinicalActionResult } from '../actions';

export function SoapNoteForm({
  encounterId,
  values,
}: {
  encounterId: string;
  values: Record<'subjective' | 'objective' | 'assessment' | 'plan', string>;
}) {
  const [state, formAction] = useActionState<ClinicalActionResult, FormData>(
    (previousState, formData) => updateSoapAction(previousState, formData),
    {},
  );

  return (
    <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
      {state.error ? (
        <div className="md:col-span-2">
          <FormAlert
            type="error"
            title="SOAP note could not be saved"
            message={state.error}
          />
        </div>
      ) : null}
      {state.success ? (
        <div className="md:col-span-2">
          <FormAlert type="success" message={state.success} />
        </div>
      ) : null}
      <input type="hidden" name="encounterId" value={encounterId} />
      {(['subjective', 'objective', 'assessment', 'plan'] as const).map(
        (section) => (
          <label
            key={section}
            className="grid gap-2 text-sm font-medium capitalize"
          >
            {section}
            <textarea
              name={section}
              defaultValue={values[section]}
              rows={5}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        ),
      )}
      <PendingSubmitButton pendingText="Saving SOAP note...">
        Save SOAP note
      </PendingSubmitButton>
    </form>
  );
}
