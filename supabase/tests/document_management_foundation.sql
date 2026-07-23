begin;

select plan(14);
select has_table('document_categories', 'public');
select has_table('documents', 'public');
select has_table('document_versions', 'public');
select has_table('document_access_log', 'public');
select has_table('document_retention_rules', 'public');
select has_table('document_shares_placeholder', 'public');
select has_table('document_events', 'public');
select has_function('public', 'create_document_metadata', array['uuid','text','text','text','uuid','uuid','uuid','uuid','text','bigint','text','text','text']);
select has_function('public', 'list_patient_documents', array['uuid']);
select has_function('public', 'list_encounter_documents', array['uuid']);
select has_function('public', 'create_document_version', array['uuid','text','text','text','bigint','text','text','text']);
select ok((select relrowsecurity from pg_class where oid='public.documents'::regclass), 'documents enable RLS');
select ok(exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='documents_insert_denied'), 'direct document inserts denied');
select ok(exists (select 1 from pg_trigger where tgname='organizations_seed_document_categories'), 'default category trigger exists');

select * from finish();
rollback;
