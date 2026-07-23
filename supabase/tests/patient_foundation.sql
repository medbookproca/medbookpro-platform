begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_patient_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_patient_test_user('00000000-0000-0000-0000-000000000051', 'patient-owner@example.test');
select tests.create_patient_test_user('00000000-0000-0000-0000-000000000052', 'patient-practitioner@example.test');

insert into public.organizations (id, name, display_name, slug)
values
  ('81000000-0000-0000-0000-000000000001', 'Patient Organization', 'Patient Organization', 'patient-organization'),
  ('81000000-0000-0000-0000-000000000002', 'Other Patient Organization', 'Other Patient Organization', 'other-patient-organization');
insert into public.clinics (id, organization_id, name, slug)
values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'Patient Clinic', 'patient-clinic'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', 'Other Patient Clinic', 'other-patient-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values
  ('83000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', 'Patient Location'),
  ('83000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000002', 'Other Patient Location');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('84000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000051', 'active', timezone('utc', now())),
  ('84000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000052', 'active', timezone('utc', now())),
  ('84000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000052', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '81000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';
insert into public.membership_roles (organization_id, membership_id, role_id)
select '81000000-0000-0000-0000-000000000001', '84000000-0000-0000-0000-000000000003', id from public.roles where key = 'practitioner';

select plan(30);
set local role anon;
select throws_ok($$select * from public.create_patient('81000000-0000-0000-0000-000000000001'::uuid, null, 'Anonymous', null, 'Patient', null, null, '1980-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'draft', null, null)$$, '42501', null, 'anonymous users cannot create patients');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
create temp table first_patient on commit drop as
select * from public.create_patient('81000000-0000-0000-0000-000000000001'::uuid, 'MRN-100', 'Jane', null, 'Doe', 'Janey', 'Jane Doe', '1985-04-01', 'female', null, 'she/her', 'single', 'Teacher', 'en', false, null, null, 'Non-clinical intake placeholder', 'active', 'jane@example.test', '+1 780 555 0100');
select is((select duplicate_count from first_patient), 0, 'first patient has no duplicate match');
select is((select count(*)::integer from public.patients where organization_id = '81000000-0000-0000-0000-000000000001'), 1, 'owner creates an organization patient');
select is((select count(*)::integer from public.patient_contacts where patient_id = (select patient_id from first_patient)), 1, 'patient contact record is created');
select is((select count(*)::integer from public.patients where organization_id = '81000000-0000-0000-0000-000000000002'), 0, 'tenant reads exclude other organizations');
select throws_ok($$insert into public.patients (organization_id, patient_number, first_name, last_name, normalized_name, date_of_birth, biological_sex, marital_status, preferred_language) values ('81000000-0000-0000-0000-000000000001', 'DIRECT', 'Direct', 'Write', 'directwrite', '1980-01-01', 'undisclosed', 'undisclosed', 'en')$$, '42501', null, 'direct patient writes are denied');
select throws_ok($$select * from public.create_patient('81000000-0000-0000-0000-000000000001'::uuid, 'MRN-101', 'Future', null, 'Patient', null, null, '2999-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'draft', null, null)$$, '22023', 'PATIENT_INVALID_PROFILE', 'future dates of birth are denied');
create temp table duplicate_patient on commit drop as
select * from public.create_patient('81000000-0000-0000-0000-000000000001'::uuid, 'MRN-101', 'Jane', null, 'Doe', null, 'Jane Doe', '1985-04-01', 'female', null, null, 'single', null, 'en', false, null, null, null, 'draft', 'jane@example.test', '+1 780 555 0100');
select is((select duplicate_count from duplicate_patient), 1, 'duplicate detection flags a matching patient');
select is(jsonb_array_length(public.preview_duplicate_matches('81000000-0000-0000-0000-000000000001'::uuid, 'Jane', null, 'Doe', '1985-04-01', 'jane@example.test', '+1 780 555 0100')), 2, 'duplicate preview returns same-organization candidates');
select is((select count(*)::integer from public.patient_duplicate_flags), 1, 'potential duplicate flag is persisted');
select lives_ok($$select public.add_patient_identifier((select patient_id from first_patient), 'internal_mrn', 'MRN-200', 'AB', true)$$, 'authorized owner adds an identifier');
select is((select identifier_last4 from public.patient_identifiers where patient_id = (select patient_id from first_patient)), '-200', 'identifier last four metadata is stored');
select throws_ok($$insert into public.patient_identifiers (organization_id, patient_id, identifier_type, identifier_value, identifier_last4) values ('81000000-0000-0000-0000-000000000001', (select patient_id from first_patient), 'passport', 'BYPASS', 'PASS')$$, '42501', null, 'direct identifier writes are denied');
select lives_ok($$select public.update_patient_contact((select patient_id from first_patient), 'updated@example.test', '+1 780 555 0101', null, '100 Main Street', 'Edmonton', 'AB', 'T5J 1N1', 'Canada', true, true, true, false, 'standard', 'phone')$$, 'authorized owner updates contact and preferences');
select is((select preferred_contact_method from public.patient_contacts where patient_id = (select patient_id from first_patient)), 'phone', 'communication preference is stored');
select lives_ok($$select public.add_patient_emergency_contact((select patient_id from first_patient), 'Alex Doe', 'caregiver', '+1 780 555 0111', null, 'alex@example.test', '100 Main Street', true)$$, 'authorized owner adds an emergency contact');
select throws_ok($$insert into public.patient_emergency_contacts (organization_id, patient_id, name, relationship, phone) values ('81000000-0000-0000-0000-000000000001', (select patient_id from first_patient), 'Bypass', 'caregiver', '7805550199')$$, '42501', null, 'direct emergency contact writes are denied');
select lives_ok($$select public.update_patient_consents((select patient_id from first_patient), '[{"consentType":"privacy_acknowledgement","consentDate":"2026-01-01","version":"v1","withdrawn":false},{"consentType":"communication","consentDate":"2026-01-01","version":"v1","withdrawn":false}]'::jsonb)$$, 'authorized owner updates consent readiness');
select is((select count(*)::integer from public.patient_consents where patient_id = (select patient_id from first_patient)), 2, 'consent records are versioned');
select throws_ok($$insert into public.patient_consents (organization_id, patient_id, consent_type, consent_date, version) values ('81000000-0000-0000-0000-000000000001', (select patient_id from first_patient), 'treatment', '2026-01-01', 'bypass')$$, '42501', null, 'direct consent writes are denied');
select lives_ok($$select public.add_patient_relationship((select patient_id from first_patient), (select patient_id from duplicate_patient), 'caregiver', 'Future-ready relationship only')$$, 'authorized owner adds a relationship');
select throws_ok($$select public.add_patient_relationship((select patient_id from first_patient), '00000000-0000-0000-0000-000000000000'::uuid, 'parent', null)$$, '42501', 'PATIENT_RELATIONSHIP_FORBIDDEN', 'cross-tenant relationship references are denied');
select lives_ok($$select public.change_patient_status((select patient_id from first_patient), 'archived', 'test archive')$$, 'owner archives a patient');
select throws_ok($$select public.update_patient((select patient_id from first_patient), 'Changed', null, 'Name', null, null, '1985-04-01', 'female', null, null, 'single', null, 'en', false, null, null, null)$$, '42501', 'PATIENT_UPDATE_FORBIDDEN', 'archived patient updates are denied');
select lives_ok($$select public.change_patient_status((select patient_id from first_patient), 'active', 'explicit restore')$$, 'owner restores an archived patient');
select is((select status from public.patients where id = (select patient_id from first_patient)), 'active', 'restored patient remains historically referenced');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000052', true);
select is((select count(*)::integer from public.patients where organization_id = '81000000-0000-0000-0000-000000000001'), 2, 'practitioner can read same-organization patients');
select is((select count(*)::integer from public.patient_identifiers where organization_id = '81000000-0000-0000-0000-000000000001'), 0, 'practitioner cannot read protected identifiers without permission');
select throws_ok($$select * from public.create_patient('81000000-0000-0000-0000-000000000001'::uuid, 'MRN-300', 'Practitioner', null, 'Denied', null, null, '1980-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'draft', null, null)$$, '42501', null, 'practitioner without create permission cannot create patients');
set local role postgres;
select is((select count(*)::integer from public.audit_events where action like 'patient.%'), 11, 'patient mutations create audit events');

select * from finish();
rollback;
