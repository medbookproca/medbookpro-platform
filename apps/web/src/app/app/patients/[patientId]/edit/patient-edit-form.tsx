import { updatePatientAction, type PatientActionResult } from '../../actions';

const submit = async (formData: FormData): Promise<void> => {
  await (
    updatePatientAction as (data: FormData) => Promise<PatientActionResult>
  )(formData);
};

const fieldClass =
  'mt-1 block w-full rounded border border-slate-300 px-3 py-2';

export function PatientEditForm({
  patient,
}: {
  patient: Record<string, unknown>;
}) {
  return (
    <form action={submit} className="space-y-5">
      <input type="hidden" name="patientId" value={String(patient.id)} />
      <input
        type="hidden"
        name="patientNumber"
        value={String(patient.patient_number ?? '')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          First name
          <input
            name="firstName"
            required
            defaultValue={String(patient.first_name ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Middle name
          <input
            name="middleName"
            defaultValue={String(patient.middle_name ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Last name
          <input
            name="lastName"
            required
            defaultValue={String(patient.last_name ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Preferred name
          <input
            name="preferredName"
            defaultValue={String(patient.preferred_name ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Legal name
          <input
            name="legalName"
            defaultValue={String(patient.legal_name ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            required
            defaultValue={String(patient.date_of_birth ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Biological sex
          <select
            name="biologicalSex"
            defaultValue={String(patient.biological_sex)}
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
          <input
            name="genderIdentity"
            defaultValue={String(patient.gender_identity ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Pronouns
          <input
            name="pronouns"
            defaultValue={String(patient.pronouns ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Marital status
          <select
            name="maritalStatus"
            defaultValue={String(patient.marital_status)}
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
            defaultValue={String(patient.preferred_language)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm">
          Occupation
          <input
            name="occupation"
            defaultValue={String(patient.occupation ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Accessibility notes
          <textarea
            name="accessibilityNotes"
            defaultValue={String(patient.accessibility_notes ?? '')}
            className={fieldClass}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Non-clinical notes placeholder
          <textarea
            name="nonClinicalNotes"
            defaultValue={String(patient.non_clinical_notes ?? '')}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        <input
          type="checkbox"
          name="interpreterRequired"
          defaultChecked={Boolean(patient.interpreter_required)}
          className="mr-2"
        />
        Interpreter required
      </label>
      <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
        Save patient
      </button>
    </form>
  );
}
