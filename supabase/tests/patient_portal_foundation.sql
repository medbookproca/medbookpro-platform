begin;

select plan(6);

select has_function('public', 'patient_login_placeholder', array['text']);
select has_function('public', 'get_patient_dashboard', array[]::text[]);
select has_function('public', 'request_appointment', array['uuid','uuid','uuid','uuid','text','timestamp with time zone','integer','text','text']);
select has_table('patient_portal_accounts', 'public');
select has_table('patient_portal_events', 'public');
select ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'patient_portal_accounts' and policyname = 'patient_portal_accounts_self'), 'patient portal self policy exists');

select * from finish();
rollback;
