begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_practitioner_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_practitioner_test_user('00000000-0000-0000-0000-000000000031', 'practitioner-owner@example.test');
select tests.create_practitioner_test_user('00000000-0000-0000-0000-000000000032', 'practitioner-staff@example.test');

insert into public.organizations (id, name, display_name, slug)
values
  ('61000000-0000-0000-0000-000000000001', 'Practitioner Test Organization', 'Practitioner Test Organization', 'practitioner-test-organization'),
  ('61000000-0000-0000-0000-000000000002', 'Other Practitioner Organization', 'Other Practitioner Organization', 'other-practitioner-organization');
insert into public.clinics (id, organization_id, name, slug)
values
  ('62000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'Practitioner Clinic', 'practitioner-clinic'),
  ('62000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'Other Practitioner Clinic', 'other-practitioner-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values
  ('63000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', 'Primary Practitioner Location'),
  ('63000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000002', 'Other Practitioner Location');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('64000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000031', 'active', timezone('utc', now())),
  ('64000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000032', 'active', timezone('utc', now())),
  ('64000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000032', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '61000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';
insert into public.membership_roles (organization_id, membership_id, role_id)
select '61000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000002', id from public.roles where key = 'receptionist';

insert into public.specialties (id, organization_id, stable_key, name)
values
  ('65000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'physiotherapy', 'Physiotherapy'),
  ('65000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'other-specialty', 'Other Specialty');
insert into public.services (id, organization_id, name, description)
values
  ('66000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', 'Initial consultation', 'Foundation service only'),
  ('66000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'Other service', 'Other organization service');

select plan(34);
set local role anon;
select throws_ok($$select * from public.create_practitioner('61000000-0000-0000-0000-000000000001'::uuid, 'Anonymous Practitioner')$$, '42501', null, 'anonymous users cannot create practitioners');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
create temp table created_practitioner on commit drop as
select * from public.create_practitioner('61000000-0000-0000-0000-000000000001'::uuid, 'Dr. Foundation', 'Physiotherapist', 'active', null, array['63000000-0000-0000-0000-000000000001']::uuid[], '63000000-0000-0000-0000-000000000001'::uuid, array['65000000-0000-0000-0000-000000000001']::uuid[], array['en', 'fr']::text[]);
select is((select count(*)::integer from public.practitioners where organization_id = '61000000-0000-0000-0000-000000000001'), 1, 'owner creates an organization practitioner');
select is((select count(*)::integer from public.practitioner_location_assignments where practitioner_id = (select practitioner_id from created_practitioner) and status = 'active'), 1, 'creation assigns a location');
select is((select count(*)::integer from public.practitioner_location_assignments where practitioner_id = (select practitioner_id from created_practitioner) and is_primary), 1, 'creation assigns one primary location');
select is((select count(*)::integer from public.practitioner_specialty_assignments where practitioner_id = (select practitioner_id from created_practitioner) and status = 'active'), 1, 'creation assigns a specialty');
select is((select count(*)::integer from public.practitioner_languages where practitioner_id = (select practitioner_id from created_practitioner)), 2, 'creation normalizes languages');
select throws_ok($$select * from public.create_practitioner('61000000-0000-0000-0000-000000000001'::uuid, 'Cross Tenant', null, 'draft', null, array['63000000-0000-0000-0000-000000000002']::uuid[])$$, '42501', 'PRACTITIONER_LOCATION_FORBIDDEN', 'cross-tenant location assignment is denied');
select is((select count(*)::integer from public.practitioners), 1, 'tenant owner cannot create a cross-tenant practitioner');
select is((select count(*)::integer from public.practitioners where organization_id = '61000000-0000-0000-0000-000000000002'), 0, 'tenant reads exclude another organization');
select lives_ok($$select public.link_practitioner_membership((select practitioner_id from created_practitioner), '64000000-0000-0000-0000-000000000002'::uuid)$$, 'owner can link same-organization membership');
select throws_ok($$select public.link_practitioner_membership((select practitioner_id from created_practitioner), '64000000-0000-0000-0000-000000000003'::uuid)$$, '42501', 'PRACTITIONER_MEMBERSHIP_FORBIDDEN', 'cross-tenant membership linking is denied');
select throws_ok($$insert into public.practitioners (organization_id, display_name) values ('61000000-0000-0000-0000-000000000001', 'Direct Write')$$, '42501', null, 'direct practitioner writes are denied');
select lives_ok($$select public.change_practitioner_status((select practitioner_id from created_practitioner), 'inactive', 'test pause')$$, 'owner can deactivate a practitioner');
select throws_ok($$select public.set_practitioner_locations((select practitioner_id from created_practitioner), array['63000000-0000-0000-0000-000000000001']::uuid[], '63000000-0000-0000-0000-000000000001'::uuid)$$, '40901', 'PRACTITIONER_NOT_ASSIGNABLE', 'inactive practitioner cannot receive active locations');
select lives_ok($$select public.change_practitioner_status((select practitioner_id from created_practitioner), 'active', null)$$, 'owner can reactivate a practitioner');
select lives_ok($$select public.set_practitioner_locations((select practitioner_id from created_practitioner), array['63000000-0000-0000-0000-000000000001']::uuid[], '63000000-0000-0000-0000-000000000001'::uuid)$$, 'owner can set practitioner locations');
select lives_ok($$select public.add_practitioner_credential((select practitioner_id from created_practitioner), 'provincial_registration', 'Test College', null, 'AB', '2025-01-01'::date, '2030-01-01'::date, null, null, true)$$, 'owner can add a credential without a registration number');
select is((select verification_status from public.practitioner_credentials where practitioner_id = (select practitioner_id from created_practitioner)), 'unverified', 'new credentials are unverified');
select lives_ok($$select public.verify_practitioner_credential((select id from public.practitioner_credentials where practitioner_id = (select practitioner_id from created_practitioner)), 'verified', 'reviewed locally')$$, 'authorized owner can verify a credential');
select is((select verification_status from public.practitioner_credentials where practitioner_id = (select practitioner_id from created_practitioner)), 'verified', 'credential verification state changes');
select throws_ok($$insert into public.practitioner_credentials (organization_id, practitioner_id, credential_type) values ('61000000-0000-0000-0000-000000000001', (select practitioner_id from created_practitioner), 'bypass')$$, '42501', null, 'direct credential writes are denied');
select lives_ok($$select public.set_practitioner_specialties((select practitioner_id from created_practitioner), array['65000000-0000-0000-0000-000000000001']::uuid[])$$, 'owner can set specialties');
select throws_ok($$select public.set_practitioner_specialties((select practitioner_id from created_practitioner), array['65000000-0000-0000-0000-000000000002']::uuid[])$$, '42501', 'PRACTITIONER_SPECIALTY_FORBIDDEN', 'cross-tenant specialty assignment is denied');
select lives_ok($$select public.set_practitioner_services((select practitioner_id from created_practitioner), array['66000000-0000-0000-0000-000000000001']::uuid[], null)$$, 'owner can set a service assignment');
select throws_ok($$select public.set_practitioner_services((select practitioner_id from created_practitioner), array['66000000-0000-0000-0000-000000000002']::uuid[], null)$$, '42501', 'PRACTITIONER_SERVICE_FORBIDDEN', 'cross-tenant service assignment is denied');
select lives_ok($$select public.update_practitioner_public_profile((select practitioner_id from created_practitioner), 'Dr. Foundation', 'Physiotherapist', 'Short profile', null, null, null, false, 'private', 'hidden', 'dr-foundation', null, null)$$, 'owner can prepare a private public profile');
select is((select visibility_status from public.practitioner_public_profiles where practitioner_id = (select practitioner_id from created_practitioner)), 'private', 'public profile defaults to private');
select lives_ok($$select public.update_practitioner_public_profile((select practitioner_id from created_practitioner), null, null, null, null, null, null, true, 'published', 'visible', 'dr-foundation', null, null)$$, 'owner can explicitly publish profile readiness');
select throws_ok($$insert into public.practitioner_public_profiles (organization_id, practitioner_id) values ('61000000-0000-0000-0000-000000000001', (select practitioner_id from created_practitioner))$$, '42501', null, 'direct public profile writes are denied');
select lives_ok($$select public.change_practitioner_status((select practitioner_id from created_practitioner), 'archived', 'retired')$$, 'owner can archive a practitioner');
select throws_ok($$select public.update_practitioner_profile((select practitioner_id from created_practitioner), 'Changed', null, null)$$, '42501', 'PRACTITIONER_UPDATE_FORBIDDEN', 'archived practitioner profile is protected');
select lives_ok($$select public.change_practitioner_status((select practitioner_id from created_practitioner), 'active', 'restored explicitly')$$, 'owner can explicitly restore an archived practitioner');
set local role postgres;
update public.organization_memberships set status = 'suspended', suspended_at = timezone('utc', now()) where id = '64000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000031', true);
select is((select count(*)::integer from public.audit_events where action like 'practitioner.%'), 13, 'practitioner mutations create audit events');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000032', true);
select throws_ok($$select public.update_practitioner_profile((select practitioner_id from created_practitioner), 'Staff Change', null, null)$$, '42501', 'PRACTITIONER_UPDATE_FORBIDDEN', 'suspended membership cannot manage practitioners');

select * from finish();
rollback;
