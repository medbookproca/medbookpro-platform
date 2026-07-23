begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_availability_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_availability_test_user('00000000-0000-0000-0000-000000000041', 'availability-owner@example.test');
select tests.create_availability_test_user('00000000-0000-0000-0000-000000000042', 'availability-other@example.test');

insert into public.organizations (id, name, display_name, slug)
values
  ('71000000-0000-0000-0000-000000000001', 'Availability Organization', 'Availability Organization', 'availability-organization'),
  ('71000000-0000-0000-0000-000000000002', 'Other Availability Organization', 'Other Availability Organization', 'other-availability-organization');
insert into public.clinics (id, organization_id, name, slug)
values
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Availability Clinic', 'availability-clinic'),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Other Availability Clinic', 'other-availability-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values
  ('73000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000001', 'Availability Location'),
  ('73000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', '72000000-0000-0000-0000-000000000002', 'Other Availability Location');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('74000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000041', 'active', timezone('utc', now())),
  ('74000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000042', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '71000000-0000-0000-0000-000000000001', '74000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';
insert into public.membership_roles (organization_id, membership_id, role_id)
select '71000000-0000-0000-0000-000000000002', '74000000-0000-0000-0000-000000000002', id from public.roles where key = 'organization.owner';
insert into public.services (id, organization_id, name)
values
  ('76000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'Availability Consultation'),
  ('76000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', 'Other Consultation');

select plan(35);
set local role anon;
select throws_ok($$select public.preview_practitioner_availability('00000000-0000-0000-0000-000000000001'::uuid, '2026-08-03'::date, '2026-08-03'::date)$$, '42501', null, 'anonymous preview is denied');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
create temp table created_practitioner on commit drop as
select * from public.create_practitioner('71000000-0000-0000-0000-000000000001'::uuid, 'Dr. Availability', 'Physiotherapist', 'active', null, array['73000000-0000-0000-0000-000000000001']::uuid[], '73000000-0000-0000-0000-000000000001'::uuid);
select lives_ok($$select public.set_practitioner_services((select practitioner_id from created_practitioner), array['76000000-0000-0000-0000-000000000001']::uuid[], null)$$, 'owner assigns the service before narrowing availability');
select lives_ok($$select public.create_practitioner_availability_schedule('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), 'Default schedule', 'America/Edmonton', '[{"weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed","locationId":"73000000-0000-0000-0000-000000000001","serviceId":"76000000-0000-0000-0000-000000000001"},{"weekday":2,"startTime":"09:00","endTime":"17:00","mode":"mixed"}]'::jsonb)$$, 'owner creates a recurring schedule');
select is((select count(*)::integer from public.practitioner_availability_blocks), 2, 'multiple weekly blocks are stored');
select is((select count(*)::integer from public.practitioner_availability_templates where organization_id = '71000000-0000-0000-0000-000000000002'), 0, 'tenant reads exclude another organization');
select throws_ok($$insert into public.practitioner_availability_templates (organization_id, practitioner_id, name, timezone) values ('71000000-0000-0000-0000-000000000001', (select practitioner_id from created_practitioner), 'Direct write', 'America/Edmonton')$$, '42501', null, 'direct template writes are denied');
select throws_ok($$insert into public.practitioner_availability_blocks (organization_id, template_id, practitioner_id, weekday, start_time, end_time) select organization_id, id, practitioner_id, 1, '10:00', '11:00' from public.practitioner_availability_templates limit 1$$, '42501', null, 'direct block writes are denied');
select lives_ok($$select public.add_practitioner_break('71000000-0000-0000-0000-000000000001'::uuid, (select id from public.practitioner_availability_blocks where weekday = 1), '12:00', '13:00', 'Lunch')$$, 'owner adds a break inside a block');
select throws_ok($$select public.add_practitioner_break('71000000-0000-0000-0000-000000000001'::uuid, (select id from public.practitioner_availability_blocks where weekday = 1), '08:00', '09:30', 'Invalid')$$, '23514', 'BREAK_OUTSIDE_BLOCK', 'breaks cannot escape their block');
select throws_ok($$select public.add_practitioner_break('71000000-0000-0000-0000-000000000001'::uuid, (select id from public.practitioner_availability_blocks where weekday = 1), '12:30', '13:30', 'Overlap')$$, '23P01', 'BREAK_OVERLAP', 'breaks cannot overlap');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03')), 2, 'preview subtracts breaks from recurring availability');
select is((public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03')->0->>'startTime'), '09:00:00', 'preview starts before the break');
select is((public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03')->1->>'startTime'), '13:00:00', 'preview resumes after the break');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03', '73000000-0000-0000-0000-000000000001'::uuid, null)), 2, 'preview filters to an assigned location');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03', '73000000-0000-0000-0000-000000000002'::uuid, null)), 0, 'preview rejects a different organization location');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03', null, '76000000-0000-0000-0000-000000000001'::uuid)), 2, 'preview filters to an assigned service');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03', null, '76000000-0000-0000-0000-000000000002'::uuid)), 0, 'preview rejects a different organization service');
select lives_ok($$select public.add_practitioner_schedule_override('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '2026-08-03', 'available', '10:00', '11:00')$$, 'owner creates a timed available override');
select throws_ok($$select public.add_practitioner_schedule_override('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '2026-08-03', 'available', '10:30', '11:30')$$, '23P01', 'AVAILABILITY_OVERRIDE_OVERLAP', 'overlapping overrides are rejected');
select lives_ok($$select public.add_practitioner_schedule_override('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '2026-08-04', 'unavailable')$$, 'owner creates an all-day unavailable override');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-04', '2026-08-04')), 0, 'unavailable override takes precedence');
select lives_ok($$select public.create_practitioner_time_off('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), 'vacation', '2026-08-03', '2026-08-03', 'Annual leave')$$, 'owner creates vacation');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-03', '2026-08-03')), 0, 'vacation takes precedence over recurring availability');
select lives_ok($$select public.update_organization_holiday('71000000-0000-0000-0000-000000000001'::uuid, null, '2026-08-10', 'Civic holiday')$$, 'owner creates an organization holiday');
select is(jsonb_array_length(public.preview_practitioner_availability((select practitioner_id from created_practitioner), '2026-08-10', '2026-08-10')), 0, 'organization holiday takes precedence');
select throws_ok($$select public.create_practitioner_availability_schedule('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), 'Overlap schedule', 'America/Edmonton', '[{"weekday":1,"startTime":"16:00","endTime":"18:00","mode":"mixed"},{"weekday":1,"startTime":"17:00","endTime":"19:00","mode":"mixed"}]'::jsonb)$$, '23P01', 'AVAILABILITY_BLOCK_OVERLAP', 'overlapping recurring blocks are rejected');
select lives_ok($$select public.set_practitioner_location_availability('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '[{"locationId":"73000000-0000-0000-0000-000000000001","weekday":1,"startTime":"09:00","endTime":"17:00"}]'::jsonb)$$, 'owner assigns location availability');
select lives_ok($$select public.set_practitioner_service_availability('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '[{"serviceId":"76000000-0000-0000-0000-000000000001","weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed"}]'::jsonb)$$, 'owner assigns service availability');
select throws_ok($$select public.set_practitioner_service_availability('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), '[{"serviceId":"76000000-0000-0000-0000-000000000002","weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed"}]'::jsonb)$$, '23503', 'AVAILABILITY_SERVICE_NOT_ASSIGNED', 'cross-tenant service availability is denied');
select throws_ok($$select public.create_practitioner_availability_schedule('71000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from created_practitioner), 'Cross tenant block', 'America/Edmonton', '[{"weekday":3,"startTime":"09:00","endTime":"10:00","mode":"in_person","locationId":"73000000-0000-0000-0000-000000000002"}]'::jsonb)$$, '23503', 'AVAILABILITY_LOCATION_NOT_ASSIGNED', 'cross-tenant locations are denied');
select lives_ok($$select public.cancel_practitioner_time_off((select id from public.practitioner_time_off limit 1))$$, 'owner cancels vacation');
select lives_ok($$select public.remove_practitioner_schedule_override((select id from public.practitioner_schedule_overrides limit 1))$$, 'owner removes an override');
select lives_ok($$select public.remove_practitioner_availability_schedule((select id from public.practitioner_availability_templates limit 1))$$, 'owner removes a recurring schedule');
select is((select count(*)::integer from public.audit_events where action like 'practitioner.availability_%'), 11, 'availability mutations create audit events');

set local role postgres;
select is((select count(*)::integer from public.practitioner_availability_templates where organization_id = '71000000-0000-0000-0000-000000000002'), 0, 'tenant fixture has no cross-organization schedule');

select * from finish();
rollback;
