begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_clinical_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_clinical_test_user('00000000-0000-0000-0000-000000000071', 'clinical-owner@example.test');
select tests.create_clinical_test_user('00000000-0000-0000-0000-000000000072', 'clinical-other@example.test');

insert into public.organizations (id, name, display_name, slug)
values
  ('a1000000-0000-0000-0000-000000000001', 'Clinical Organization', 'Clinical Organization', 'clinical-organization'),
  ('a1000000-0000-0000-0000-000000000002', 'Other Clinical Organization', 'Other Clinical Organization', 'other-clinical-organization');
insert into public.clinics (id, organization_id, name, slug)
values
  ('a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Clinical Clinic', 'clinical-clinic'),
  ('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Other Clinical Clinic', 'other-clinical-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values
  ('a3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'Clinical Location'),
  ('a3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Other Clinical Location');
insert into public.services (id, organization_id, name)
values
  ('a4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Clinical Consultation'),
  ('a4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Other Consultation');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('a5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000071', 'active', timezone('utc', now())),
  ('a5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000072', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';
insert into public.membership_roles (organization_id, membership_id, role_id)
select 'a1000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000002', id from public.roles where key = 'organization.owner';

select plan(29);
set local role anon;
select throws_ok($$select * from public.create_encounter('a1000000-0000-0000-0000-000000000001'::uuid, gen_random_uuid(), gen_random_uuid())$$, '42501', null, 'anonymous encounter creation is denied');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
create temp table clinical_practitioner on commit drop as
select * from public.create_practitioner('a1000000-0000-0000-0000-000000000001'::uuid, 'Dr. Clinical', 'Physician', 'active', null, array['a3000000-0000-0000-0000-000000000001']::uuid[], 'a3000000-0000-0000-0000-000000000001'::uuid);
select lives_ok($$select public.set_practitioner_services((select practitioner_id from clinical_practitioner), array['a4000000-0000-0000-0000-000000000001']::uuid[], null)$$, 'practitioner is assigned the clinical service');
select lives_ok($$select public.create_practitioner_availability_schedule('a1000000-0000-0000-0000-000000000001'::uuid, (select practitioner_id from clinical_practitioner), 'Clinical schedule', 'America/Edmonton', '[{"weekday":1,"startTime":"09:00","endTime":"17:00","mode":"mixed","locationId":"a3000000-0000-0000-0000-000000000001","serviceId":"a4000000-0000-0000-0000-000000000001"}]'::jsonb)$$, 'availability is configured through the existing engine');
create temp table clinical_patient on commit drop as
select * from public.create_patient('a1000000-0000-0000-0000-000000000001'::uuid, 'CL-001', 'Clinical', null, 'Patient', null, null, '1980-01-01', 'undisclosed', null, null, 'undisclosed', null, 'en', false, null, null, null, 'active', null, null);
create temp table clinical_appointment on commit drop as
select * from public.create_appointment('a1000000-0000-0000-0000-000000000001'::uuid, (select patient_id from clinical_patient), (select practitioner_id from clinical_practitioner), 'a3000000-0000-0000-0000-000000000001'::uuid, 'a4000000-0000-0000-0000-000000000001'::uuid, 'in_person', '2026-08-03 15:00+00'::timestamptz, 30, 'America/Edmonton');
select lives_ok($$select public.confirm_appointment((select appointment_id from clinical_appointment))$$, 'appointment is confirmed before clinical linkage');
select lives_ok($$select public.check_in_patient((select appointment_id from clinical_appointment))$$, 'appointment is checked in before clinical linkage');
select lives_ok($$select public.start_appointment((select appointment_id from clinical_appointment))$$, 'appointment is moved in progress before clinical linkage');

create temp table created_encounter on commit drop as
select * from public.create_encounter('a1000000-0000-0000-0000-000000000001'::uuid, (select patient_id from clinical_patient), (select practitioner_id from clinical_practitioner), (select appointment_id from clinical_appointment), 'visit', 'draft');
select is((select count(*)::integer from public.encounters where organization_id = 'a1000000-0000-0000-0000-000000000001'), 1, 'encounter is tenant scoped');
select is((select appointment_id from public.encounters limit 1), (select appointment_id from clinical_appointment), 'encounter retains appointment linkage');
select throws_ok($$insert into public.encounters (organization_id, patient_id, practitioner_id, encounter_type) values ('a1000000-0000-0000-0000-000000000001', (select patient_id from clinical_patient), (select practitioner_id from clinical_practitioner), 'direct')$$, '42501', null, 'direct encounter writes are denied');
select is((select count(*)::integer from public.encounters where organization_id = 'a1000000-0000-0000-0000-000000000002'), 0, 'tenant reads exclude another organization');
select lives_ok($$select public.update_soap_note((select encounter_id from created_encounter), 'Subjective', 'Objective', 'Assessment', 'Plan')$$, 'SOAP note is persisted');
select is((select subjective from public.soap_notes), 'Subjective', 'SOAP subjective section is structured');
select lives_ok($$select public.update_care_plan(null, (select encounter_id from created_encounter), 'Goals', 'Interventions', 'Follow up', 'active', '2026-09-01')$$, 'care plan is persisted');
select lives_ok($$select public.update_forms(null, (select encounter_id from created_encounter), 'intake', 'Clinical intake', '1', 'draft', '{"reviewed":false}'::jsonb)$$, 'clinical form placeholder is persisted');
select lives_ok($$select public.add_attachment_metadata((select encounter_id from created_encounter), 'referral.pdf', 'application/pdf', 1024, 'placeholder://clinical/referral.pdf')$$, 'attachment metadata is persisted without upload');
select lives_ok($$select public.update_diagnoses(null, (select encounter_id from created_encounter), 'ICD-10-CA', 'Z00.00', 'Encounter placeholder', true)$$, 'diagnosis placeholder is persisted');
select lives_ok($$select public.update_procedures(null, (select encounter_id from created_encounter), 'PROC-001', 'Procedure placeholder', '2026-08-03', (select practitioner_id from clinical_practitioner))$$, 'procedure placeholder is persisted');
select lives_ok($$select public.change_encounter_status((select encounter_id from created_encounter), 'in_progress', null)$$, 'draft encounter can start');
select lives_ok($$select public.complete_encounter((select encounter_id from created_encounter))$$, 'in-progress encounter can complete');
select is((select status from public.encounters limit 1), 'completed', 'completed state is stored');
select throws_ok($$select public.update_soap_note((select encounter_id from created_encounter), 'Denied', 'O', 'A', 'P')$$, '42501', 'CLINICAL_SOAP_FORBIDDEN', 'completed SOAP is immutable before amendment');
select lives_ok($$select public.amend_encounter((select encounter_id from created_encounter), 'Correction')$$, 'completed encounter can be amended');
select lives_ok($$select public.update_soap_note((select encounter_id from created_encounter), 'Amended', 'O', 'A', 'P')$$, 'amended SOAP can be updated');
select lives_ok($$select public.archive_encounter((select encounter_id from created_encounter), 'Historical archive')$$, 'amended encounter can be archived');
select throws_ok($$select public.change_encounter_status((select encounter_id from created_encounter), 'in_progress', null)$$, '42501', 'CLINICAL_TRANSITION_FORBIDDEN', 'archived encounter cannot transition');
select throws_ok($$select public.create_encounter('a1000000-0000-0000-0000-000000000002'::uuid, (select patient_id from clinical_patient), (select practitioner_id from clinical_practitioner))$$, '42501', null, 'cross-tenant encounter creation is denied');
select lives_ok($$select public.create_encounter('a1000000-0000-0000-0000-000000000001'::uuid, (select patient_id from clinical_patient), (select practitioner_id from clinical_practitioner), null, 'administrative', 'draft')$$, 'unlinked draft encounter remains supported');
select is((select count(*)::integer from public.encounter_status_history where encounter_id = (select encounter_id from created_encounter)), 5, 'encounter lifecycle transitions are recorded');
set local role postgres;
select ok((select count(*) from public.audit_events where organization_id = 'a1000000-0000-0000-0000-000000000001' and (action like 'encounter.%' or action in ('soap.updated', 'care_plan.updated', 'clinical_form.updated', 'attachment_metadata.added', 'diagnosis.updated', 'procedure.updated'))) >= 12, 'clinical mutations create audit events');

select * from finish();
rollback;
