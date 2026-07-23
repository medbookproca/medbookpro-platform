begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_appointment_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_appointment_test_user('00000000-0000-0000-0000-000000000061', 'appointment-owner@example.test');
select tests.create_appointment_test_user('00000000-0000-0000-0000-000000000062', 'appointment-other@example.test');

insert into public.organizations (id, name, display_name, slug)
values
  ('91000000-0000-0000-0000-000000000001', 'Appointment Organization', 'Appointment Organization', 'appointment-organization'),
  ('91000000-0000-0000-0000-000000000002', 'Other Appointment Organization', 'Other Appointment Organization', 'other-appointment-organization');
insert into public.clinics (id, organization_id, name, slug)
values
  ('92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Appointment Clinic', 'appointment-clinic'),
  ('92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'Other Appointment Clinic', 'other-appointment-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values
  ('93000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'Appointment Location'),
  ('93000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000002', 'Other Appointment Location');
insert into public.services (id, organization_id, name)
values
  ('94000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Appointment Consultation'),
  ('94000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'Other Consultation');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('95000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000061', 'active', timezone('utc', now())),
  ('95000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000062', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '91000000-0000-0000-0000-000000000001', '95000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';
insert into public.membership_roles (organization_id, membership_id, role_id)
select '91000000-0000-0000-0000-000000000002', '95000000-0000-0000-0000-000000000002', id from public.roles where key = 'organization.owner';

select plan(31);
set local role anon;
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, gen_random_uuid(), gen_random_uuid(), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:00+00'::timestamptz, 30, 'America/Edmonton')$$, '42501', null, 'anonymous appointment creation is denied');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000061', true);
create temp table created_practitioners on commit drop as
select * from public.create_practitioner('91000000-0000-0000-0000-000000000001'::uuid, 'Dr. Appointment One', 'Physician', 'active', null, array['93000000-0000-0000-0000-000000000001']::uuid[], '93000000-0000-0000-0000-000000000001'::uuid);
select public.create_practitioner('91000000-0000-0000-0000-000000000001'::uuid, 'Dr. Appointment Two', 'Physician', 'active', null, array['93000000-0000-0000-0000-000000000001']::uuid[], '93000000-0000-0000-0000-000000000001'::uuid);
select lives_ok($$select public.set_practitioner_services((select practitioner_id from created_practitioners), array['94000000-0000-0000-0000-000000000001']::uuid[], null)$$, 'owner assigns the first practitioner service');
select lives_ok($$select public.create_practitioner_availability_schedule('91000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioners), 'Default schedule', 'America/Edmonton', '[{"weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed","locationId":"93000000-0000-0000-0000-000000000001","serviceId":"94000000-0000-0000-0000-000000000001"}]'::jsonb)$$, 'owner creates availability consumed by appointments');
select lives_ok($$select public.set_practitioner_services((select id from practitioners where display_name = 'Dr. Appointment Two'), array['94000000-0000-0000-0000-000000000001']::uuid[], null)$$, 'owner assigns the second practitioner service');
select lives_ok($$select public.create_practitioner_availability_schedule('91000000-0000-0000-0000-000000000001'::uuid, (select id from practitioners where display_name = 'Dr. Appointment Two'), 'Second schedule', 'America/Edmonton', '[{"weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed","locationId":"93000000-0000-0000-0000-000000000001","serviceId":"94000000-0000-0000-0000-000000000001"}]'::jsonb)$$, 'owner creates second practitioner availability');
create temp table patients on commit drop as
select * from public.create_patient('91000000-0000-0000-0000-000000000001'::uuid, 'AP-001', 'Appointment', null, 'Patient', null, null, '1980-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'active', null, null);
select public.create_patient('91000000-0000-0000-0000-000000000001'::uuid, 'AP-002', 'Second', null, 'Patient', null, null, '1981-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'active', null, null);

create temp table first_appointment on commit drop as
select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:00+00'::timestamptz, 30, 'America/Edmonton', 5, 5);
select is((select count(*)::integer from public.appointments), 1, 'appointment is created in the tenant');
select is((select status from public.appointments limit 1), 'scheduled', 'appointment starts scheduled');
select is((select count(*)::integer from public.appointment_buffers), 2, 'pre and post buffers are persisted');
select is((select count(*)::integer from public.appointment_status_history), 1, 'initial appointment state is audited');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:20+00'::timestamptz, 30, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PRACTITIONER_CONFLICT', 'overlapping practitioner appointments are rejected');
select is((select conflict_type from public.preview_conflicts('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:20+00'::timestamptz, 30, 'America/Edmonton') limit 1), 'practitioner', 'conflict preview identifies practitioner conflicts');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients limit 1), (select id from practitioners order by display_name desc limit 1), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:20+00'::timestamptz, 30, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PATIENT_CONFLICT', 'overlapping patient appointments are rejected');
select lives_ok($$select public.update_organization_holiday('91000000-0000-0000-0000-000000000001'::uuid, null, '2026-08-10', 'Local holiday')$$, 'owner creates a holiday before booking');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients limit 1), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-10 15:00+00'::timestamptz, 30, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PRACTITIONER_UNAVAILABLE', 'holiday or missing availability is rejected');
select lives_ok($$select public.update_organization_holiday('91000000-0000-0000-0000-000000000001'::uuid, null, '2026-08-17', 'Local holiday')$$, 'owner creates a holiday');
select lives_ok($$select public.create_practitioner_time_off('91000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioners), 'vacation', '2026-08-24', '2026-08-24', 'Vacation')$$, 'owner creates practitioner time off');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients limit 1), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-17 15:00+00'::timestamptz, 30, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PRACTITIONER_UNAVAILABLE', 'holiday rejection is enforced by availability engine');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients limit 1), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-24 15:00+00'::timestamptz, 30, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PRACTITIONER_UNAVAILABLE', 'vacation rejection is enforced by availability engine');
select lives_ok($$select public.add_practitioner_break('91000000-0000-0000-0000-000000000001'::uuid, (select id from public.practitioner_availability_blocks limit 1), '12:00', '13:00', 'Lunch')$$, 'owner adds a break');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000001'::uuid, (select patient_id from patients limit 1), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-31 18:30+00'::timestamptz, 60, 'America/Edmonton')$$, '23P01', 'APPOINTMENT_PRACTITIONER_UNAVAILABLE', 'break or unavailable interval is rejected');
select throws_ok($$insert into public.appointments (organization_id, patient_id, practitioner_id, location_id, service_id, scheduled_start, scheduled_end, timezone, duration_minutes) select '91000000-0000-0000-0000-000000000001', patient_id, (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000001', '2026-09-07 15:00+00', '2026-09-07 15:30+00', 'America/Edmonton', 30 from patients limit 1$$, '42501', null, 'direct appointment writes are denied');
select lives_ok($$select public.confirm_appointment((select appointment_id from first_appointment))$$, 'scheduled appointment can be confirmed');
select lives_ok($$select public.check_in_patient((select appointment_id from first_appointment))$$, 'confirmed appointment can be checked in');
select lives_ok($$select public.start_appointment((select appointment_id from first_appointment))$$, 'checked-in appointment can start');
select lives_ok($$select public.complete_appointment((select appointment_id from first_appointment))$$, 'in-progress appointment can complete');
select is((select status from public.appointments limit 1), 'completed', 'completed lifecycle state is stored');
select throws_ok($$select public.cancel_appointment((select appointment_id from first_appointment), 'too late')$$, '42501', 'APPOINTMENT_TRANSITION_FORBIDDEN', 'completed appointment cannot be cancelled');
select is((select count(*)::integer from public.appointment_status_history), 5, 'every lifecycle transition is audited');
select is((select count(*)::integer from public.appointments where organization_id = '91000000-0000-0000-0000-000000000002'), 0, 'tenant isolation excludes another organization');
select throws_ok($$select * from public.create_appointment('91000000-0000-0000-0000-000000000002'::uuid, (select patient_id from patients), (select practitioner_id from created_practitioners), '93000000-0000-0000-0000-000000000001'::uuid, '94000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:00+00'::timestamptz, 30, 'America/Edmonton')$$, '42501', null, 'cross-tenant booking is denied');
set local role postgres;
select is((select count(*)::integer from public.audit_events where action like 'appointment.%'), 5, 'appointment creation and transitions create audit events');

select * from finish();
rollback;
