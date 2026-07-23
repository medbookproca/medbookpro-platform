# Appointment Scheduling Reconciliation

## Existing boundaries

The Practitioner Availability Engine is the reusable source of truth for recurring templates, date overrides, holidays, practitioner time off, breaks, location and service assignments, and active-practitioner eligibility. Appointment transactions call `preview_practitioner_availability`; they do not recreate schedule rules in the UI or appointment tables.

Patient and practitioner records are already organization-scoped and use composite foreign keys. Locations and services follow the same organization boundary. Appointment creation requires all four assignments to resolve inside the same organization.

## Scheduling scope

Appointments are the central scheduling resource for future clinical, billing, telehealth, reminder, analytics, and AI modules. This phase owns appointment timing, type, status, buffers, conflict detection, status history, and audit events. It does not own clinical notes, billing, reminders, external calendar synchronization, video, or patient portal workflows.

## Lifecycle and audit

The lifecycle is `draft → scheduled → confirmed → checked_in → in_progress → completed`. Cancellation and no-show are terminal outcomes from eligible scheduled states. Every creation and transition records status history and an append-oriented audit event. Illegal transitions fail in server-side RPCs.

## Privacy and future integrations

RLS scopes all appointment-owned records by organization and permission. Patient and practitioner identifiers are not expanded in the scheduling list until a future view has an explicit display need. Future billing, clinical, reminders, calendar sync, and AI scheduling modules must reference appointment IDs and must not bypass these transaction boundaries.

## Assumptions and conflicts

- Availability preview returns local-time intervals for one practitioner, location, service, and date range; appointment booking converts the requested instant into that timezone before checking containment.
- Appointments currently reject intervals crossing a local calendar date; split-day booking can be added with a documented timezone design.
- Recurrence and waitlist tables are metadata placeholders only.
- Availability permissions are separate from appointment permissions, but the booking transaction requires both the booking permission and the canonical availability preview.
