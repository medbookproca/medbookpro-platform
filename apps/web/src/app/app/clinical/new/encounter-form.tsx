'use client';

import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import { createEncounterAction, type ClinicalActionResult } from '../actions';

export function EncounterForm({
  patients,
  practitioners,
  appointments,
}: {
  patients: Array<{ id: string; first_name: string; last_name: string }>;
  practitioners: Array<{ id: string; display_name: string }>;
  appointments: Array<{
    id: string;
    patient_id: string;
    practitioner_id: string;
    scheduled_start: string;
    status: string;
  }>;
}) {
  const [state, formAction] = useActionState<ClinicalActionResult, FormData>(
    (previousState, formData) => createEncounterAction(previousState, formData),
    {},
  );

  return (
    <form action={formAction} className="grid gap-5">
      {state.error ? (
        <FormAlert
          type="error"
          title="Encounter could not be created"
          message={state.error}
        />
      ) : null}
      <label className="grid gap-2 font-medium">
        Patient
        <select
          name="patientId"
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {patients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.first_name} {item.last_name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Practitioner
        <select
          name="practitionerId"
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {practitioners.map((item) => (
            <option key={item.id} value={item.id}>
              {item.display_name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Appointment context
        <select
          name="appointmentId"
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">No appointment link</option>
          {appointments.map((item) => (
            <option key={item.id} value={item.id}>
              {new Date(item.scheduled_start).toLocaleString('en-CA')} ·{' '}
              {item.status} · {item.id}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Encounter type
        <input
          name="encounterType"
          defaultValue="visit"
          required
          maxLength={120}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Initial status
        <select
          name="status"
          defaultValue="draft"
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
        </select>
      </label>
      <PendingSubmitButton pendingText="Creating encounter...">
        Create encounter
      </PendingSubmitButton>
    </form>
  );
}
