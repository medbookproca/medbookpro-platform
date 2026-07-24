'use client';

import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import {
  createDocumentMetadataAction,
  type DocumentActionResult,
} from './actions';

export function DocumentMetadataForm() {
  const [state, formAction] = useActionState<DocumentActionResult, FormData>(
    (previousState, formData) =>
      createDocumentMetadataAction(previousState, formData),
    {},
  );

  return (
    <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-2">
      {state.error ? (
        <div className="md:col-span-2">
          <FormAlert
            type="error"
            title="Document metadata could not be created"
            message={state.error}
          />
        </div>
      ) : null}
      {state.success ? (
        <div className="md:col-span-2">
          <FormAlert type="success" message={state.success} />
        </div>
      ) : null}
      <input
        required
        name="title"
        placeholder="Document title"
        className="rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        required
        name="categoryKey"
        placeholder="Category key, e.g. referral"
        className="rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        name="patientId"
        placeholder="Patient UUID (optional)"
        className="rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        name="encounterId"
        placeholder="Encounter UUID (optional)"
        className="rounded-lg border border-slate-300 px-3 py-2"
      />
      <textarea
        name="description"
        placeholder="Description"
        className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
      />
      <PendingSubmitButton pendingText="Creating metadata...">
        Create metadata record
      </PendingSubmitButton>
    </form>
  );
}
