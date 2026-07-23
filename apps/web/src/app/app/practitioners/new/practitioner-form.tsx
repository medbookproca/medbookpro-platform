'use client';

import { createPractitionerAction } from '../actions';
import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import type { PractitionerActionResult } from '../actions';

export function PractitionerForm({
  locations,
  specialties,
  memberships,
}: {
  locations: Array<{ id: string; name: string }>;
  specialties: Array<{ id: string; name: string }>;
  memberships: Array<{ id: string; label: string }>;
}) {
  const [state, formAction] = useActionState<
    PractitionerActionResult,
    FormData
  >((_, formData) => createPractitionerAction(formData), {});
  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <FormAlert
          type="error"
          title="Practitioner could not be created"
          message={state.error}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Display name
          <input
            name="displayName"
            required
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Dr. Alex Carey"
          />
        </label>
        <label className="text-sm font-medium">
          Professional title
          <input
            name="professionalTitle"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Physiotherapist"
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Initial status
        <select
          name="status"
          defaultValue="draft"
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Optional membership linkage
        <select
          name="membershipId"
          defaultValue=""
          className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="">No linked membership</option>
          {memberships.map((membership) => (
            <option key={membership.id} value={membership.id}>
              {membership.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm font-medium">Locations</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {locations.map((location) => (
            <label key={location.id} className="text-sm">
              <input
                type="checkbox"
                name="locationIds"
                value={location.id}
                className="mr-2"
              />
              {location.name}
            </label>
          ))}
        </div>
        <label className="mt-3 block text-sm">
          Primary location
          <select
            name="primaryLocationId"
            defaultValue=""
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">None selected</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Specialties</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {specialties.map((specialty) => (
            <label key={specialty.id} className="text-sm">
              <input
                type="checkbox"
                name="specialtyIds"
                value={specialty.id}
                className="mr-2"
              />
              {specialty.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-medium">Languages</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {['en', 'fr'].map((language) => (
            <label key={language} className="text-sm">
              <input
                type="checkbox"
                name="languageCodes"
                value={language}
                className="mr-2"
              />
              {language === 'en' ? 'English' : 'French'} ({language})
            </label>
          ))}
        </div>
      </fieldset>
      <PendingSubmitButton pendingText="Creating practitioner...">
        Create practitioner
      </PendingSubmitButton>
    </form>
  );
}
