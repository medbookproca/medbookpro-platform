'use client';

import { updatePractitionerAction } from '../../actions';

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
  const action = async (formData: FormData) => {
    await updatePractitionerAction(formData);
  };
  return (
    <form action={action} className="space-y-5">
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
      <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
        Save profile
      </button>
    </form>
  );
}
