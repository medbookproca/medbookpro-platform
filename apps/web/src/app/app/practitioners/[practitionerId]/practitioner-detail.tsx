'use client';

import { Card } from '@medbookpro/ui';
import {
  addPractitionerCredentialAction,
  changePractitionerStatusAction,
  linkPractitionerMembershipAction,
  unlinkPractitionerMembershipAction,
  updatePractitionerLanguagesAction,
  updatePractitionerLocationsAction,
  updatePractitionerPublicProfileAction,
  updatePractitionerServicesAction,
  updatePractitionerSpecialtiesAction,
  verifyPractitionerCredentialAction,
  type PractitionerActionResult,
} from '../actions';

const invoke =
  (action: (formData: FormData) => Promise<PractitionerActionResult>) =>
  async (formData: FormData) => {
    await action(formData);
  };

export function PractitionerDetail({
  practitioner,
  locations,
  credentials,
  specialties,
  services,
  languages,
  publicProfile,
  locationOptions,
  specialtyOptions,
  serviceOptions,
  memberships,
}: {
  practitioner: {
    id: string;
    display_name: string;
    professional_title: string | null;
    registration_jurisdiction: string | null;
    status: string;
    linked_membership_id: string | null;
  };
  locations: Array<{
    id: string;
    name: string;
    status: string;
    isPrimary: boolean;
  }>;
  credentials: Array<{
    id: string;
    credential_type: string;
    issuing_body: string | null;
    registration_number: string | null;
    jurisdiction: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    verification_status: string;
    is_primary: boolean;
    status: string;
  }>;
  specialties: Array<{
    id: string;
    name: string;
    status: string;
    isPrimary: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    locationName: string | null;
    status: string;
  }>;
  languages: Array<{ language_code: string; is_primary: boolean }>;
  publicProfile: Record<string, unknown> | null;
  locationOptions: Array<{ id: string; name: string }>;
  specialtyOptions: Array<{ id: string; name: string }>;
  serviceOptions: Array<{ id: string; name: string }>;
  memberships: Array<{ id: string; label: string }>;
}) {
  const activeLocationIds = new Set(
    locations
      .filter((location) => location.status === 'active')
      .map((location) => location.id),
  );
  const activeSpecialtyIds = new Set(
    specialties
      .filter((specialty) => specialty.status === 'active')
      .map((specialty) => specialty.id),
  );
  const activeServiceIds = new Set(
    services
      .filter((service) => service.status === 'active')
      .map((service) => service.id),
  );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Lifecycle</h2>
        <p className="mt-2 text-sm text-slate-600">
          Draft practitioners are not bookable. Archived records retain history
          and require explicit restoration.
        </p>
        <form
          action={invoke(changePractitionerStatusAction)}
          className="mt-4 flex flex-wrap gap-3"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <select
            name="status"
            defaultValue={practitioner.status}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <input
            name="reason"
            placeholder="Reason"
            className="min-w-40 rounded border border-slate-300 px-3 py-2"
          />
          <button className="rounded bg-slate-900 px-4 py-2 font-medium text-white">
            Save status
          </button>
        </form>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Membership</dt>
            <dd>
              {practitioner.linked_membership_id ? 'Linked' : 'Not linked'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Jurisdiction</dt>
            <dd>{practitioner.registration_jurisdiction ?? 'Not provided'}</dd>
          </div>
        </dl>
        {practitioner.linked_membership_id ? (
          <form
            action={invoke(unlinkPractitionerMembershipAction)}
            className="mt-5"
          >
            <input
              type="hidden"
              name="practitionerId"
              value={practitioner.id}
            />
            <button className="rounded border border-red-300 px-3 py-2 text-sm text-red-700">
              Unlink membership
            </button>
          </form>
        ) : (
          <form
            action={invoke(linkPractitionerMembershipAction)}
            className="mt-5 flex gap-2"
          >
            <input
              type="hidden"
              name="practitionerId"
              value={practitioner.id}
            />
            <select
              name="membershipId"
              required
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Link active membership</option>
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {membership.label}
                </option>
              ))}
            </select>
            <button className="rounded border border-slate-300 px-3 py-2 text-sm">
              Link
            </button>
          </form>
        )}
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Locations</h2>
        <form
          action={invoke(updatePractitionerLocationsAction)}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <div className="grid gap-2">
            {locationOptions.map((location) => (
              <label key={location.id} className="text-sm">
                <input
                  type="checkbox"
                  name="locationIds"
                  value={location.id}
                  defaultChecked={activeLocationIds.has(location.id)}
                  className="mr-2"
                />
                {location.name}
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Primary location
            <select
              name="primaryLocationId"
              defaultValue={
                locations.find((location) => location.isPrimary)?.id ?? ''
              }
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">None</option>
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Update locations
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Specialties and languages</h2>
        <form
          action={invoke(updatePractitionerSpecialtiesAction)}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <fieldset>
            <legend className="text-sm font-medium">Specialties</legend>
            {specialtyOptions.map((specialty) => (
              <label key={specialty.id} className="mt-2 block text-sm">
                <input
                  type="checkbox"
                  name="specialtyIds"
                  value={specialty.id}
                  defaultChecked={activeSpecialtyIds.has(specialty.id)}
                  className="mr-2"
                />
                {specialty.name}
              </label>
            ))}
          </fieldset>
          <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Update specialties
          </button>
        </form>
        <form
          action={invoke(updatePractitionerLanguagesAction)}
          className="mt-6 space-y-3"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <fieldset>
            <legend className="text-sm font-medium">Languages</legend>
            {['en', 'fr', 'es'].map((language) => (
              <label key={language} className="mr-4 mt-2 inline-block text-sm">
                <input
                  type="checkbox"
                  name="languageCodes"
                  value={language}
                  defaultChecked={languages.some(
                    (item) => item.language_code === language,
                  )}
                  className="mr-2"
                />
                {language}
              </label>
            ))}
          </fieldset>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Update languages
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Credentials</h2>
        <div className="mt-4 space-y-3">
          {credentials.map((credential) => (
            <div
              key={credential.id}
              className="rounded border border-slate-200 p-3 text-sm"
            >
              <p className="font-medium">
                {credential.credential_type}
                {credential.is_primary ? ' · Primary' : ''}
              </p>
              <p className="text-slate-600">
                {credential.issuing_body ?? 'Issuing body not provided'} ·{' '}
                {credential.jurisdiction ?? 'Jurisdiction not provided'} ·{' '}
                {credential.verification_status}
              </p>
              <p className="text-slate-600">
                Registration number:{' '}
                {credential.registration_number
                  ? 'Stored securely'
                  : 'Not provided'}
              </p>
              <form
                action={invoke(verifyPractitionerCredentialAction)}
                className="mt-2 flex gap-2"
              >
                <input
                  type="hidden"
                  name="credentialId"
                  value={credential.id}
                />
                <select
                  name="verificationStatus"
                  defaultValue={credential.verification_status}
                  className="rounded border border-slate-300 px-2 py-1"
                >
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
                <button className="rounded border border-slate-300 px-3 py-1">
                  Save verification
                </button>
              </form>
            </div>
          ))}
        </div>
        <form
          action={invoke(addPractitionerCredentialAction)}
          className="mt-5 grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <input
            name="credentialType"
            required
            placeholder="Credential type"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            name="issuingBody"
            placeholder="Issuing body"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            name="registrationNumber"
            placeholder="Registration number (optional)"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            name="jurisdiction"
            placeholder="Jurisdiction, e.g. AB"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <label className="text-sm">
            Issue date
            <input
              name="issueDate"
              type="date"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Expiry date
            <input
              name="expiryDate"
              type="date"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <input type="checkbox" name="isPrimary" className="mr-2" />
            Primary credential
          </label>
          <button className="w-fit rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Add credential
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Services</h2>
        <form
          action={invoke(updatePractitionerServicesAction)}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <div className="grid gap-2">
            {serviceOptions.map((service) => (
              <label key={service.id} className="text-sm">
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  defaultChecked={activeServiceIds.has(service.id)}
                  className="mr-2"
                />
                {service.name}
              </label>
            ))}
          </div>
          <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Update services
          </button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Public-profile readiness</h2>
        <p className="mt-2 text-sm text-slate-600">
          No public route is launched in this phase. Publication remains
          explicit and private by default.
        </p>
        <form
          action={invoke(updatePractitionerPublicProfileAction)}
          className="mt-4 grid gap-3"
        >
          <input type="hidden" name="practitionerId" value={practitioner.id} />
          <input
            name="displayName"
            defaultValue={String(
              publicProfile?.display_name ?? practitioner.display_name,
            )}
            placeholder="Public display name"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            name="professionalTitle"
            defaultValue={String(
              publicProfile?.professional_title ??
                practitioner.professional_title ??
                '',
            )}
            placeholder="Public professional title"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <textarea
            name="shortBiography"
            defaultValue={String(publicProfile?.short_biography ?? '')}
            placeholder="Short biography"
            className="rounded border border-slate-300 px-3 py-2"
            rows={3}
          />
          <textarea
            name="fullBiography"
            defaultValue={String(publicProfile?.full_biography ?? '')}
            placeholder="Full biography"
            className="rounded border border-slate-300 px-3 py-2"
            rows={5}
          />
          <input
            name="pronouns"
            defaultValue={String(publicProfile?.pronouns ?? '')}
            placeholder="Pronouns (optional)"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            name="profileSlug"
            defaultValue={String(publicProfile?.profile_slug ?? '')}
            placeholder="Future profile slug"
            className="rounded border border-slate-300 px-3 py-2"
          />
          <label className="text-sm">
            <input
              type="checkbox"
              name="acceptingNewClients"
              defaultChecked={publicProfile?.accepting_new_clients === true}
              className="mr-2"
            />
            Accepting new clients
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Visibility
              <select
                name="visibilityStatus"
                defaultValue={String(
                  publicProfile?.visibility_status ?? 'private',
                )}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="private">Private</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="text-sm">
              Booking visibility
              <select
                name="bookingVisibility"
                defaultValue={String(
                  publicProfile?.booking_visibility ?? 'hidden',
                )}
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="hidden">Hidden</option>
                <option value="visible">Visible</option>
              </select>
            </label>
          </div>
          <button className="w-fit rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Save profile readiness
          </button>
        </form>
      </Card>
    </div>
  );
}
