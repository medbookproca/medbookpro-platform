import { SubmitButton } from '@medbookpro/ui';
import { createAppointmentAction } from './actions';

export function AppointmentForm({
  patients,
  practitioners,
  locations,
  services,
}: {
  patients: Array<{ id: string; label: string }>;
  practitioners: Array<{ id: string; label: string }>;
  locations: Array<{ id: string; label: string }>;
  services: Array<{ id: string; label: string }>;
}) {
  return (
    <form
      action={createAppointmentAction}
      className="grid gap-5 md:grid-cols-2"
    >
      <label className="grid gap-2 font-medium">
        Patient
        <select
          name="patientId"
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {patients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
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
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Location
        <select
          name="locationId"
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Service
        <select
          name="serviceId"
          required
          className="rounded border border-slate-300 px-3 py-2"
        >
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 font-medium">
        Appointment type
        <select
          name="appointmentType"
          defaultValue="in_person"
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
          defaultValue="30"
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium">
        Timezone
        <input
          name="timezone"
          defaultValue="America/Edmonton"
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
          defaultValue="0"
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
          defaultValue="0"
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="grid gap-2 font-medium md:col-span-2">
        Notes
        <textarea
          name="notes"
          maxLength={1000}
          rows={3}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <div className="md:col-span-2">
        <SubmitButton>Check availability and create</SubmitButton>
      </div>
    </form>
  );
}
