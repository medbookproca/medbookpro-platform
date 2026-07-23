'use client';

import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import { createPatientAction, type PatientActionResult } from './actions';

const fieldClass =
  'mt-1 block w-full rounded border border-slate-300 px-3 py-2';

export function PatientForm() {
  const [state, formAction] = useActionState<PatientActionResult, FormData>(
    (_, formData) => createPatientAction(formData),
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <FormAlert
          type="error"
          title="Patient could not be created"
          message={state.error}
        />
      ) : null}
      <fieldset>
        <legend className="text-lg font-semibold">Identity</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            First name
            <input name="firstName" required className={fieldClass} />
          </label>
          <label className="text-sm">
            Middle name
            <input name="middleName" className={fieldClass} />
          </label>
          <label className="text-sm">
            Last name
            <input name="lastName" required className={fieldClass} />
          </label>
          <label className="text-sm">
            Preferred name
            <input name="preferredName" className={fieldClass} />
          </label>
          <label className="text-sm">
            Legal name
            <input name="legalName" className={fieldClass} />
          </label>
          <label className="text-sm">
            Internal patient number
            <input
              name="patientNumber"
              className={fieldClass}
              placeholder="Generated if blank"
            />
          </label>
          <label className="text-sm">
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              required
              className={fieldClass}
            />
          </label>
          <label className="text-sm">
            Biological sex
            <select
              name="biologicalSex"
              defaultValue="undisclosed"
              className={fieldClass}
            >
              <option value="undisclosed">Undisclosed</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="intersex">Intersex</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="text-sm">
            Gender identity
            <input name="genderIdentity" className={fieldClass} />
          </label>
          <label className="text-sm">
            Pronouns
            <input name="pronouns" className={fieldClass} />
          </label>
          <label className="text-sm">
            Marital status
            <select
              name="maritalStatus"
              defaultValue="undisclosed"
              className={fieldClass}
            >
              <option value="undisclosed">Undisclosed</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="common_law">Common law</option>
              <option value="separated">Separated</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="text-sm">
            Preferred language
            <input
              name="preferredLanguage"
              required
              defaultValue="en"
              className={fieldClass}
            />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-lg font-semibold">Contact</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Email
            <input name="email" type="email" className={fieldClass} />
          </label>
          <label className="text-sm">
            Phone
            <input name="phone" type="tel" className={fieldClass} />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-lg font-semibold">Readiness details</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Occupation
            <input name="occupation" className={fieldClass} />
          </label>
          <label className="text-sm">
            Photo reference placeholder
            <input name="photoReference" className={fieldClass} />
          </label>
          <label className="text-sm sm:col-span-2">
            Accessibility notes
            <textarea name="accessibilityNotes" className={fieldClass} />
          </label>
          <label className="text-sm sm:col-span-2">
            Non-clinical notes placeholder
            <textarea name="nonClinicalNotes" className={fieldClass} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <input type="checkbox" name="interpreterRequired" className="mr-2" />
          Interpreter required
        </label>
      </fieldset>
      <label className="block text-sm">
        Initial status
        <select name="status" defaultValue="draft" className={fieldClass}>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
      <PendingSubmitButton pendingText="Creating patient...">
        Create patient
      </PendingSubmitButton>
    </form>
  );
}
