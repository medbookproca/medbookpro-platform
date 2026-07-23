'use client';

import { useState, useTransition } from 'react';
import { Card } from '@medbookpro/ui';
import {
  addAvailabilityOverrideAction,
  createAvailabilityScheduleAction,
  createTimeOffAction,
  previewAvailabilityAction,
  type AvailabilityActionResult,
} from './actions';

const invoke =
  (action: (formData: FormData) => Promise<AvailabilityActionResult>) =>
  async (formData: FormData) => {
    await action(formData);
  };

export function AvailabilityClient({
  practitionerId,
  templates,
  blocks,
  overrides,
  timeOff,
  holidays,
  locations,
  services,
}: {
  practitionerId: string;
  templates: Array<{
    id: string;
    name: string;
    timezone: string;
    status: string;
  }>;
  blocks: Array<{
    weekday: number;
    start_time: string;
    end_time: string;
    mode: string;
  }>;
  overrides: Array<{
    override_date: string;
    kind: string;
    start_time: string | null;
    end_time: string | null;
    reason: string | null;
  }>;
  timeOff: Array<{
    category: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
  }>;
  holidays: Array<{ holiday_date: string; name: string; status: string }>;
  locations: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
}) {
  const [preview, setPreview] = useState<AvailabilityActionResult>({});
  const [isPending, startTransition] = useTransition();
  const runPreview = (formData: FormData) => {
    startTransition(async () =>
      setPreview(await previewAvailabilityAction(formData)),
    );
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Weekly schedule</h2>
        <p className="mt-2 text-sm text-slate-600">
          Recurring local-time availability only. No appointments are created
          here.
        </p>
        <form
          action={invoke(createAvailabilityScheduleAction)}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="practitionerId" value={practitionerId} />
          <label className="block text-sm">
            Schedule name
            <input
              name="name"
              required
              defaultValue="Default schedule"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            IANA time zone
            <input
              name="timezone"
              required
              defaultValue={templates[0]?.timezone ?? 'America/Edmonton'}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Weekday
              <select
                name="weekday"
                defaultValue="1"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                {[
                  'Sunday',
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                ].map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Mode
              <select
                name="mode"
                defaultValue="mixed"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="mixed">Mixed</option>
                <option value="virtual">Virtual</option>
                <option value="in_person">In person</option>
              </select>
            </label>
            <label className="text-sm">
              Start
              <input
                name="startTime"
                type="time"
                required
                defaultValue="09:00"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              End
              <input
                name="endTime"
                type="time"
                required
                defaultValue="17:00"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            Location for in-person blocks
            <select
              name="locationId"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Virtual or mixed without location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">
            Create weekly schedule
          </button>
        </form>
        <div className="mt-6 space-y-2 text-sm">
          <p className="font-medium">Current blocks</p>
          {blocks.length ? (
            blocks.map((block, index) => (
              <p key={`${block.weekday}-${index}`} className="text-slate-600">
                Day {block.weekday}: {block.start_time}–{block.end_time} ·{' '}
                {block.mode}
              </p>
            ))
          ) : (
            <p className="text-slate-500">No recurring blocks configured.</p>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Overrides</h2>
        <p className="mt-2 text-sm text-slate-600">
          Date-specific exceptions take precedence over recurring blocks.
        </p>
        <form
          action={invoke(addAvailabilityOverrideAction)}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="practitionerId" value={practitionerId} />
          <label className="block text-sm">
            Date
            <input
              name="overrideDate"
              type="date"
              required
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Type
              <select
                name="kind"
                defaultValue="unavailable"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="unavailable">Unavailable</option>
                <option value="available">Available</option>
              </select>
            </label>
            <label className="text-sm">
              Mode
              <select
                name="mode"
                defaultValue="mixed"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              >
                <option value="mixed">Mixed</option>
                <option value="virtual">Virtual</option>
                <option value="in_person">In person</option>
              </select>
            </label>
            <label className="text-sm">
              Start
              <input
                name="startTime"
                type="time"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              End
              <input
                name="endTime"
                type="time"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            Reason
            <input
              name="reason"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Add override
          </button>
        </form>
        <div className="mt-6 space-y-2 text-sm">
          {overrides.map((override, index) => (
            <p
              key={`${override.override_date}-${index}`}
              className="text-slate-600"
            >
              {override.override_date} · {override.kind}
              {override.start_time
                ? ` · ${override.start_time}–${override.end_time}`
                : ' · all day'}
            </p>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Vacation and time off</h2>
        <form action={invoke(createTimeOffAction)} className="mt-4 space-y-3">
          <input type="hidden" name="practitionerId" value={practitionerId} />
          <label className="block text-sm">
            Category
            <select
              name="category"
              defaultValue="vacation"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick leave</option>
              <option value="holiday">Practitioner holiday</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Start date
              <input
                name="startDate"
                type="date"
                required
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              End date
              <input
                name="endDate"
                type="date"
                required
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            Reason
            <input
              name="reason"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="rounded border border-slate-300 px-4 py-2 font-medium">
            Add time off
          </button>
        </form>
        <div className="mt-6 space-y-2 text-sm">
          {timeOff.map((item, index) => (
            <p key={`${item.start_date}-${index}`} className="text-slate-600">
              {item.category} · {item.start_date}–{item.end_date} ·{' '}
              {item.status}
            </p>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Preview availability</h2>
        <p className="mt-2 text-sm text-slate-600">
          This previews availability only. It does not reserve time or create
          appointments.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runPreview(new FormData(event.currentTarget));
          }}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="practitionerId" value={practitionerId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Start date
              <input
                name="startDate"
                type="date"
                required
                defaultValue="2026-08-03"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              End date
              <input
                name="endDate"
                type="date"
                required
                defaultValue="2026-08-07"
                className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            Service filter
            <select
              name="serviceId"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">All services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={isPending}
            className="rounded bg-slate-900 px-4 py-2 font-medium text-white"
          >
            {isPending ? 'Previewing…' : 'Preview'}
          </button>
        </form>
        {preview.error ? (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {preview.error}
          </p>
        ) : null}
        {preview.success ? (
          <p className="mt-4 text-sm text-slate-700">{preview.success}</p>
        ) : null}
        <div className="mt-3 space-y-2 text-sm">
          {preview.preview?.map((item, index) => (
            <p
              key={`${item.date}-${item.startTime}-${index}`}
              className="rounded border border-slate-200 p-2"
            >
              {item.date} · {item.startTime}–{item.endTime} · {item.mode} ·{' '}
              {item.timezone} · {item.source}
            </p>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Organization holidays</h2>
        <p className="mt-2 text-sm text-slate-600">
          Organization holidays suppress availability before scheduling
          evaluates practitioner blocks.
        </p>
        {holidays.length ? (
          <div className="mt-4 space-y-2 text-sm">
            {holidays.map((holiday) => (
              <p
                key={`${holiday.holiday_date}-${holiday.name}`}
                className="text-slate-600"
              >
                {holiday.holiday_date} · {holiday.name} · {holiday.status}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No holidays are configured.
          </p>
        )}
      </Card>
    </div>
  );
}
