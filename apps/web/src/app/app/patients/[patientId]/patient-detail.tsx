'use client';

import { Card } from '@medbookpro/ui';
import {
  addEmergencyContactAction,
  addPatientIdentifierAction,
  changePatientStatusAction,
  updatePatientConsentAction,
  updatePatientContactAction,
  type PatientActionResult,
} from '../actions';

const invoke =
  (action: (formData: FormData) => Promise<PatientActionResult>) =>
  async (formData: FormData) => {
    await action(formData);
  };
const fieldClass =
  'mt-1 block w-full rounded border border-slate-300 px-3 py-2';

export function PatientDetail({
  patient,
  contact,
  identifiers,
  emergencyContacts,
  consents,
  duplicateFlags,
}: {
  patient: Record<string, unknown>;
  contact: Record<string, unknown> | null;
  identifiers: Array<Record<string, unknown>>;
  emergencyContacts: Array<Record<string, unknown>>;
  consents: Array<Record<string, unknown>>;
  duplicateFlags: Array<Record<string, unknown>>;
}) {
  const patientId = String(patient.id);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {duplicateFlags.length ? (
        <Card className="border-amber-300 bg-amber-50 lg:col-span-2">
          <p className="font-semibold text-amber-900">
            Potential duplicate review required
          </p>
          <p className="mt-1 text-sm text-amber-800">
            This record has an advisory match. No automatic merge has occurred.
          </p>
        </Card>
      ) : null}
      <Card>
        <h2 className="text-xl font-semibold">Lifecycle</h2>
        <p className="mt-2 text-sm text-slate-600">
          Archived patients remain historically referenced and require explicit
          restoration.
        </p>
        <form
          action={invoke(changePatientStatusAction)}
          className="mt-4 flex flex-wrap gap-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <select
            name="status"
            defaultValue={String(patient.status)}
            className={fieldClass + ' max-w-48'}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <input
            name="reason"
            placeholder="Reason"
            className="flex-1 rounded border border-slate-300 px-3 py-2"
          />
          <button className="rounded bg-slate-900 px-4 py-2 font-medium text-white">
            Save status
          </button>
        </form>
        <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-600">Patient number</dt>
            <dd>{String(patient.patient_number)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Date of birth</dt>
            <dd>{String(patient.date_of_birth)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Preferred language</dt>
            <dd>{String(patient.preferred_language)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Interpreter</dt>
            <dd>{patient.interpreter_required ? 'Required' : 'Not marked'}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Profile</h2>
          <a
            href={`/app/patients/${patientId}/edit`}
            className="rounded border border-slate-300 px-3 py-2 text-sm font-medium"
          >
            Edit
          </a>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-slate-600">Name</dt>
            <dd>
              {String(patient.first_name)} {String(patient.middle_name ?? '')}{' '}
              {String(patient.last_name)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600">Preferred name</dt>
            <dd>{String(patient.preferred_name ?? 'Not provided')}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Biological sex</dt>
            <dd>{String(patient.biological_sex)}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Gender identity</dt>
            <dd>{String(patient.gender_identity ?? 'Not provided')}</dd>
          </div>
          <div>
            <dt className="text-slate-600">Accessibility notes</dt>
            <dd>{String(patient.accessibility_notes ?? 'Not provided')}</dd>
          </div>
        </dl>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Contact and communication</h2>
        <form
          action={invoke(updatePatientContactAction)}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Email
              <input
                name="email"
                type="email"
                defaultValue={String(contact?.email ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Phone
              <input
                name="phone"
                type="tel"
                defaultValue={String(contact?.phone ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Alternate phone
              <input
                name="alternatePhone"
                defaultValue={String(contact?.alternate_phone ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              City
              <input
                name="city"
                defaultValue={String(contact?.city ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Province/state
              <input
                name="province"
                defaultValue={String(contact?.province ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Postal code
              <input
                name="postalCode"
                defaultValue={String(contact?.postal_code ?? '')}
                className={fieldClass}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Address
              <input
                name="address"
                defaultValue={String(contact?.address ?? '')}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-sm">
            Country
            <input
              name="country"
              defaultValue={String(contact?.country ?? 'Canada')}
              className={fieldClass}
            />
          </label>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <label>
              <input
                type="checkbox"
                name="emailAllowed"
                defaultChecked={Boolean(contact?.email_allowed)}
                className="mr-2"
              />
              Email allowed
            </label>
            <label>
              <input
                type="checkbox"
                name="smsAllowed"
                defaultChecked={Boolean(contact?.sms_allowed)}
                className="mr-2"
              />
              SMS allowed
            </label>
            <label>
              <input
                type="checkbox"
                name="phoneAllowed"
                defaultChecked={Boolean(contact?.phone_allowed)}
                className="mr-2"
              />
              Phone allowed
            </label>
            <label>
              <input
                type="checkbox"
                name="marketingOptIn"
                defaultChecked={Boolean(contact?.marketing_opt_in)}
                className="mr-2"
              />
              Marketing opt-in
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Preferred contact
              <select
                name="preferredContactMethod"
                defaultValue={String(
                  contact?.preferred_contact_method ?? 'none',
                )}
                className={fieldClass}
              >
                <option value="none">None</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label className="text-sm">
              Reminder preference placeholder
              <input
                name="reminderPreference"
                defaultValue={String(contact?.reminder_preference ?? '')}
                className={fieldClass}
              />
            </label>
          </div>
          <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Save contact
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Protected identifiers</h2>
        <p className="mt-2 text-sm text-slate-600">
          Full identifier values are never displayed after entry. Only type and
          last-four metadata are shown.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          {identifiers.map((identifier) => (
            <p key={String(identifier.id)}>
              {String(identifier.identifier_type)} · ending{' '}
              {String(identifier.identifier_last4)}
              {identifier.is_primary ? ' · primary' : ''}
            </p>
          ))}
        </div>
        <form
          action={invoke(addPatientIdentifierAction)}
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Type
              <select
                name="identifierType"
                defaultValue="internal_mrn"
                className={fieldClass}
              >
                <option value="internal_mrn">Internal MRN</option>
                <option value="provincial_health_number">
                  Provincial health number placeholder
                </option>
                <option value="passport">Passport</option>
                <option value="drivers_licence">Driver&apos;s licence</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-sm">
              Value
              <input name="identifierValue" required className={fieldClass} />
            </label>
          </div>
          <label className="text-sm">
            Issuing jurisdiction
            <input name="issuingJurisdiction" className={fieldClass} />
          </label>
          <label className="text-sm">
            <input type="checkbox" name="isPrimary" className="mr-2" />
            Primary
          </label>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Add identifier
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">
          Emergency contacts and guardians
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          {emergencyContacts.map((contactRecord) => (
            <div
              key={String(contactRecord.id)}
              className="rounded border border-slate-200 p-3"
            >
              <p className="font-medium">
                {String(contactRecord.name)} ·{' '}
                {String(contactRecord.relationship)}
                {contactRecord.is_primary ? ' · primary' : ''}
              </p>
              <p className="text-slate-600">
                {String(contactRecord.phone)}
                {contactRecord.email ? ` · ${String(contactRecord.email)}` : ''}
              </p>
            </div>
          ))}
        </div>
        <form
          action={invoke(addEmergencyContactAction)}
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input name="name" required className={fieldClass} />
            </label>
            <label className="text-sm">
              Relationship
              <input
                name="relationship"
                required
                placeholder="Parent, guardian, caregiver"
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Phone
              <input name="phone" required type="tel" className={fieldClass} />
            </label>
            <label className="text-sm">
              Alternate phone
              <input name="alternatePhone" className={fieldClass} />
            </label>
            <label className="text-sm">
              Email
              <input name="email" type="email" className={fieldClass} />
            </label>
            <label className="text-sm">
              Address
              <input name="address" className={fieldClass} />
            </label>
          </div>
          <label className="text-sm">
            <input type="checkbox" name="isPrimary" className="mr-2" />
            Primary contact
          </label>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Add emergency contact
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Consents</h2>
        <div className="mt-4 space-y-2 text-sm">
          {consents.map((consent) => (
            <p key={String(consent.id)}>
              {String(consent.consent_type)} · version {String(consent.version)}{' '}
              · {consent.withdrawn ? 'withdrawn' : 'active'}
            </p>
          ))}
        </div>
        <form
          action={invoke(updatePatientConsentAction)}
          className="mt-5 space-y-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Consent type
              <select
                name="consentType"
                defaultValue="privacy_acknowledgement"
                className={fieldClass}
              >
                <option value="privacy_acknowledgement">
                  Privacy acknowledgement
                </option>
                <option value="communication">Communication consent</option>
                <option value="treatment">Treatment consent placeholder</option>
              </select>
            </label>
            <label className="text-sm">
              Consent date
              <input
                name="consentDate"
                type="date"
                required
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Version
              <input
                name="version"
                required
                defaultValue="v1"
                className={fieldClass}
              />
            </label>
            <label className="text-sm">
              Document reference placeholder
              <input name="documentReference" className={fieldClass} />
            </label>
          </div>
          <label className="text-sm">
            <input type="checkbox" name="withdrawn" className="mr-2" />
            Withdrawn
          </label>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Save consent
          </button>
        </form>
      </Card>
    </div>
  );
}
