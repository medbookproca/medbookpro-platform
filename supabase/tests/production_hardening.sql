begin;

create extension if not exists pgtap;

select plan(23);
select has_function('public','prevent_audit_event_mutation',array[]::text[]);
select is((select count(*)::integer from pg_proc where prosecdef and pronamespace='public'::regnamespace and (proconfig is null or not exists(select 1 from unnest(proconfig) c where c like 'search_path=%'))),0,'all public security-definer functions pin search_path');
select ok((select relrowsecurity from pg_class where oid='public.audit_events'::regclass),'audit events enable RLS');
select ok(exists(select 1 from pg_trigger where tgrelid='public.audit_events'::regclass and tgname='audit_events_append_only' and not tgenabled = 'D'),'audit events have an enabled append-only trigger');
select is((select count(*)::integer from pg_class where relnamespace='public'::regnamespace and relname in ('patients_organization_status_updated_idx','appointments_organization_schedule_idx','appointments_patient_schedule_idx','notification_queue_organization_status_schedule_idx','invoices_organization_status_issued_idx','documents_organization_patient_created_idx','telehealth_sessions_organization_schedule_idx','integration_jobs_organization_status_run_after_idx','integration_events_organization_occurred_idx','ai_requests_organization_requested_idx','ai_events_organization_occurred_idx')),11,'targeted pilot indexes exist');
select ok((select relrowsecurity from pg_class where oid='public.organizations'::regclass),'organizations enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.organization_memberships'::regclass),'memberships enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.patients'::regclass),'patients enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.appointments'::regclass),'appointments enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.encounters'::regclass),'encounters enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.documents'::regclass),'documents enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.telehealth_sessions'::regclass),'telehealth sessions enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.integration_connections'::regclass),'integrations enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.ai_requests'::regclass),'AI requests enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.notification_queue'::regclass),'notifications enable RLS');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_events' and policyname='audit_events_insert_denied'),'direct audit inserts are denied');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_events' and policyname='audit_events_update_denied'),'direct audit updates are denied');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_events' and policyname='audit_events_delete_denied'),'direct audit deletes are denied');
select has_function('public','append_audit_event',array['uuid','uuid','uuid','uuid','text','text','uuid','text','boolean','text','inet','text','jsonb','jsonb','jsonb']);
select ok(has_function_privilege('authenticated','public.append_audit_event(uuid,uuid,uuid,uuid,text,text,uuid,text,boolean,text,inet,text,jsonb,jsonb,jsonb)','execute') = false,'authenticated users cannot call the audit append helper');

set local role postgres;
create temp table hardening_audit_row on commit drop as
select public.append_audit_event(null,null,null,null,'hardening.test','hardening',null,'hardening-test',true,'success',null,null,null,null,'{}'::jsonb) as id;
select throws_ok($$update public.audit_events set metadata = '{"changed":true}'::jsonb where id = (select id from hardening_audit_row)$$,'42501','AUDIT_EVENTS_APPEND_ONLY','privileged audit updates are blocked');
select throws_ok($$delete from public.audit_events where id = (select id from hardening_audit_row)$$,'42501','AUDIT_EVENTS_APPEND_ONLY','privileged audit deletes are blocked');
select is((select count(*)::integer from public.audit_events where id = (select id from hardening_audit_row)),1,'audit row remains after blocked mutations');

select * from finish();
rollback;
