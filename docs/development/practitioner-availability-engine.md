# Practitioner Availability Engine

## Architecture

The availability engine is an availability-only foundation for future scheduling. It stores recurring weekly templates, blocks, breaks, date overrides, practitioner time off, organization holidays, location availability, and service availability. It does not store appointments, bookings, patient allocations, reminders, waitlists, or calendar-provider data.

The server-side preview RPC and `apps/web/src/lib/availability/service.ts` are the reusable consumption boundary. UI components submit inputs and render returned intervals; they do not calculate availability.

## Data model

- `practitioner_availability_templates` stores an organization-scoped IANA time zone and lifecycle.
- `practitioner_availability_blocks` stores multiple non-overlapping weekly local-time blocks with virtual, in-person, or mixed mode.
- `practitioner_breaks` stores breaks constrained inside a recurring block.
- `practitioner_schedule_overrides` stores date-specific available or unavailable exceptions.
- `practitioner_time_off` stores vacation, sick leave, practitioner holidays, and other time off.
- `organization_holidays` stores organization-wide or location-specific holidays.
- `practitioner_location_availability` and `practitioner_service_availability` provide future narrowing filters.

All references are organization-scoped. Location and service rows must already be assigned to the practitioner. In-person rows require a location; virtual rows do not.

## Precedence and calculation flow

1. Reject an invalid preview range or unauthorized tenant access.
2. Exclude inactive or archived practitioners.
3. Suppress organization holidays and active practitioner time off.
4. Apply all-day unavailable overrides.
5. If available overrides exist, use those intervals instead of recurring blocks.
6. Otherwise select the active recurring template and matching weekday blocks.
7. Apply optional location and service filters.
8. Subtract breaks.
9. Return local date/time intervals with source and IANA time zone metadata.

Appointment conflicts, concurrent capacity, booking, and UTC slot allocation are deliberately future scheduling responsibilities.

## Future integration hooks

- Scheduling consumes `preview_practitioner_availability` and then applies appointment conflicts and capacity.
- Calendar adapters may translate external busy intervals into reviewed temporary overrides later; no provider is connected.
- AI scheduling may consume normalized preview intervals but must preserve tenant permissions and cannot write availability directly.
- Telehealth and room scheduling can use the mode/location/service fields without changing the recurrence model.

## Security and privacy

Every availability table has RLS. Authenticated direct writes are denied. Security-definer RPCs validate the authenticated profile, active organization membership, availability permission, practitioner lifecycle, and composite location/service ownership. Audit metadata contains dates, categories, counts, and identifiers only; it does not store credentials, patient information, or provider secrets.

## Testing

Coverage includes pgTAP tenant isolation, anonymous/direct-write denial, overlap rejection, break boundaries, vacation and override precedence, location/service ownership, audit events, and preview behavior. Unit tests cover input schemas, break subtraction, and Alberta time-zone conversion across the spring DST transition. The protected Playwright route is covered by the existing authentication smoke-test convention.

## Known limitations

- Time-specific unavailable overrides are stored and overlap-validated; the initial preview path applies all-day unavailable overrides and available overrides. Fine-grained subtraction of unavailable override intervals belongs in the next scheduling iteration.
- DST output is local wall-clock data plus an IANA zone. Ambiguous/nonexistent local times are not materialized into bookable UTC slots until the future scheduling engine.
- Capacity is a hint only; no concurrency or appointment conflict logic exists.
- Holiday administration UI is read-only in this phase.
- No Google, Microsoft, Apple, Twilio, OpenAI, Stripe, telehealth, or room provider is integrated.

## Rollback

The migration is additive and can be rolled back before shared-environment application by removing the availability migration and its dependent application code. Shared-environment migrations remain immutable; any correction must be a follow-up migration. No hosted Supabase project was modified during this work.
