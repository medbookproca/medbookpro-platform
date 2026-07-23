begin;

select plan(17);
select has_table('telehealth_sessions','public');
select has_table('telehealth_participants','public');
select has_table('telehealth_waiting_room','public');
select has_table('telehealth_chat_placeholder','public');
select has_table('telehealth_provider_settings','public');
select has_table('telehealth_session_events','public');
select has_function('public','create_telehealth_session',array['uuid','uuid','uuid','uuid','uuid','timestamp with time zone','timestamp with time zone','text']);
select has_function('public','get_telehealth_session',array['uuid']);
select has_function('public','join_waiting_room',array['uuid']);
select has_function('public','admit_patient',array['uuid']);
select has_function('public','start_session',array['uuid']);
select has_function('public','end_session',array['uuid']);
select has_function('public','cancel_session',array['uuid','text']);
select has_function('public','update_telehealth_provider_settings',array['text','text','boolean']);
select has_function('public','list_upcoming_sessions',array['timestamp with time zone','timestamp with time zone']);
select ok((select relrowsecurity from pg_class where oid='public.telehealth_sessions'::regclass),'telehealth sessions enable RLS');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='telehealth_sessions' and policyname='telehealth_sessions_insert_denied'),'direct telehealth writes denied');

select * from finish();
rollback;
