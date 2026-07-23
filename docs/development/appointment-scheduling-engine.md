# Appointment Scheduling Engine

The appointment engine provides a tenant-scoped scheduling resource without implementing clinical documentation, billing, reminders, external calendars, video, or AI scheduling.

## Architecture

Appointments reference organization, patient, practitioner, location, and service through composite organization-aware foreign keys. Server-side RPCs own creation, updates, conflict previews, and lifecycle changes. The browser never decides whether a slot is bookable.

## Availability and conflicts

`create_appointment` and `update_appointment` call `preview_practitioner_availability`, which applies recurring availability, overrides, holidays, time off, and breaks. Practitioner and patient overlaps are rejected transactionally. Pre- and post-buffers expand the conflict window, and advisory locks serialize competing bookings for the practitioner and patient.

## RLS and permissions

Appointment tables enable RLS and allow reads only through organization membership plus `appointments.read`. Direct writes are denied. Mutations require the specific appointment permission and are performed by security-definer RPCs with explicit search paths.

## Lifecycle

The supported state machine is `draft`, `scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, and `no_show`. Status history and audit events are written for every transition. Completed, cancelled, and no-show appointments are terminal.

## Future boundaries

Waitlist and recurrence tables are placeholders. Future reminders, billing, clinical records, external calendar synchronization, and AI scheduling must consume appointment IDs and preserve the existing transaction and tenant boundaries.

## Rollback and limitations

Rollback is a reviewed migration operation in a controlled environment; shared migrations are not edited in place. The current engine does not generate recurrence occurrences, manage waitlists, send reminders, integrate calendars, or support cross-local-date appointments.
