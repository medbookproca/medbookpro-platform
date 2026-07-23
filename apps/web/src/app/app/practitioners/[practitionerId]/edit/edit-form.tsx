'use client';

import { updatePractitionerAction } from '../../actions';
import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import type { PractitionerActionResult } from '../../actions';

export function PractitionerEditForm({
  practitioner,
}: {
  practitioner: {
    id: string;
    display_name: string;
    professional_title: string | null;
    registration_jurisdiction: string | null;
  };
}) {
  const [state, formAction] = useActionState<
    PractitionerActionResult,
    FormData
  >((_, formData) => updatePractitionerAction(formData), {});
  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <FormAlert
          type="error"
          title="Practitioner could not be updated"
          message={state.error}
        />
      ) : null}
      <input type="hidden" name="practitionerId" value={practitioner.id} />
      <label className="block text-sm font-medium">
        Display name
        <input
          name="displayName"
          defaultValue={practitioner.display_name}
          required
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium">
        Professional title
        <input
          name="professionalTitle"
          defaultValue={practitioner.professional_title ?? ''}
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm font-medium">
        Registration jurisdiction
        <input
          name="registrationJurisdiction"
          defaultValue={practitioner.registration_jurisdiction ?? ''}
          placeholder="Province, territory, or country"
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <PendingSubmitButton pendingText="Saving practitioner...">
        Save profile
      </PendingSubmitButton>
    </form>
  );
}
