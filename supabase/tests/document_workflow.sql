begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_document_workflow_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_document_workflow_user('00000000-0000-0000-0000-000000000071', 'documents-owner@example.test');
insert into public.organizations (id, name, display_name, slug)
values ('97000000-0000-0000-0000-000000000001', 'Documents Organization', 'Documents Organization', 'documents-organization');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values ('98000000-0000-0000-0000-000000000001', '97000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000071', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '97000000-0000-0000-0000-000000000001', '98000000-0000-0000-0000-000000000001', id
from public.roles where key = 'organization.owner';

select plan(9);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
select is((select count(*)::integer from public.documents where organization_id = '97000000-0000-0000-0000-000000000001'), 0, 'empty document list starts empty');
create temp table created_documents on commit drop as
select public.create_document_metadata('97000000-0000-0000-0000-000000000001', 'Referral One', 'First document', 'referral');
select lives_ok($$select public.create_document_metadata('97000000-0000-0000-0000-000000000001', 'Referral Two', 'Second document', 'referral')$$, 'second document metadata can be created');
select is((select count(*)::integer from public.documents where organization_id = '97000000-0000-0000-0000-000000000001'), 2, 'populated document list contains both rows');
select is((select count(*)::integer from public.document_versions where organization_id = '97000000-0000-0000-0000-000000000001'), 2, 'document versions are created');
select throws_ok($$select public.create_document_metadata('97000000-0000-0000-0000-000000000001', 'Invalid Category', null, 'missing-category')$$, '22023', 'DOCUMENT_CATEGORY_NOT_FOUND', 'invalid category returns a safe domain error');
select lives_ok($$select public.archive_document((select id from public.documents order by created_at limit 1), 'workflow test')$$, 'document archive succeeds');
select is((select count(*)::integer from public.documents where organization_id = '97000000-0000-0000-0000-000000000001' and archived), 1, 'archived metadata persists');
select lives_ok($$select public.restore_document((select id from public.documents order by created_at limit 1))$$, 'document restore succeeds');
select is((select count(*)::integer from public.documents where organization_id = '97000000-0000-0000-0000-000000000001' and not archived), 1, 'restored metadata is visible');

select * from finish();
rollback;
