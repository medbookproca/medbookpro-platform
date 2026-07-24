'use client';

import { useActionState } from 'react';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import {
  updateAppointmentAction,
  type AppointmentActionResult,
} from '../../actions';

export function AppointmentEditForm({
  appointment,
  locations,
  services,
}: {
  appointment: {
    id: string;
    patient_id: string;
    practitioner_id: string;
    location_id: string;
    service_id: string;
    appointment_type: string;
    scheduled_start: string;
    duration_minutes: number;
    timezone: string;
    pre_buffer_minutes: number;
    post_buffer_minutes: number;
    notes: string | null;
  };
  locations: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState<AppointmentActionResult, FormData>(
    (previousState, formData) =>
      updateAppointmentAction(previousState, formData),
    {},
  );

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.error ? (
        <div className="md:col-span-2">
          <FormAlert
            type="error"
            title="Appointment could not be rescheduled"
            message={state.error}
          />
        </div>
      ) : null}
      <input type="hidden" name="appointmentId" value={appointment.id} />
      <input type="hidden" name="patientId" value={appointment.patient_id} />
      <input
        type="hidden"
        name="practitionerId"
        value={appointment.practitioner_id}
      />
      <label className="grid gap-2 font-medium">
        Location
        <select
          name="locationId"
          defaultValue={appointment.location_id}
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Service
        <select
          name="serviceId"
          defaultValue={appointment.service_id}
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Appointment type
        <select
          name="appointmentType"
          defaultValue={appointment.appointment_type}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="in_person">In person</option>
          <option value="virtual">Virtual</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Start
        <input
          name="scheduledStart"
          type="datetime-local"
          defaultValue={new Date(appointment.scheduled_start)
            .toISOString()
            .slice(0, 16)}
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Duration (minutes)
        <input
          name="durationMinutes"
          type="number"
          min="1"
          max="1440"
          defaultValue={appointment.duration_minutes}
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Timezone
        <input
          name="timezone"
          defaultValue={appointment.timezone}
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Pre-buffer (minutes)
        <input
          name="preBufferMinutes"
          type="number"
          min="0"
          max="1440"
          defaultValue={appointment.pre_buffer_minutes}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Post-buffer (minutes)
        <input
          name="postBufferMinutes"
          type="number"
          min="0"
          max="1440"
          defaultValue={appointment.post_buffer_minutes}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium md:col-span-2">
        Notes
        <textarea
          name="notes"
          maxLength={1000}
          rows={3}
          defaultValue={appointment.notes ?? ''}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <PendingSubmitButton pendingText="Saving appointment...">
        Validate and save
      </PendingSubmitButton>
    </form>
  );
}
