begin;

select plan(19);
select has_table('integration_providers','public');
select has_table('integration_connections','public');
select has_table('integration_credentials_placeholder','public');
select has_table('integration_webhooks','public');
select has_table('integration_events','public');
select has_table('integration_jobs','public');
select has_table('integration_logs','public');
select has_table('api_keys','public');
select has_table('api_clients','public');
select has_table('oauth_connections_placeholder','public');
select has_function('public','create_api_key',array['text','jsonb','timestamp with time zone']);
select has_function('public','revoke_api_key',array['uuid']);
select has_function('public','list_integrations',array[]::text[]);
select has_function('public','create_connection_placeholder',array['text','text','text']);
select has_function('public','record_webhook',array['uuid','text','text','text','jsonb']);
select has_function('public','queue_job',array['text','jsonb','uuid','timestamp with time zone']);
select has_function('public','retry_job',array['uuid']);
select ok((select relrowsecurity from pg_class where oid='public.api_keys'::regclass),'API keys enable RLS');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='api_keys' and policyname='api_keys_insert_denied'),'direct API key writes denied');

select * from finish();
rollback;
