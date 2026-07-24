begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_service_test_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;
select tests.create_service_test_user('00000000-0000-0000-0000-000000000041', 'service-owner@example.test');
insert into public.organizations (id, name, display_name, slug)
values ('67000000-0000-0000-0000-000000000001', 'Service Test Organization', 'Service Test Organization', 'service-test-organization');
insert into public.clinics (id, organization_id, name, slug)
values ('68000000-0000-0000-0000-000000000001', '67000000-0000-0000-0000-000000000001', 'Service Clinic', 'service-clinic');
insert into public.locations (id, organization_id, clinic_id, name)
values ('69000000-0000-0000-0000-000000000001', '67000000-0000-0000-0000-000000000001', '68000000-0000-0000-0000-000000000001', 'Service Location');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values ('6a000000-0000-0000-0000-000000000001', '67000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000041', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id)
select '67000000-0000-0000-0000-000000000001', '6a000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';

select plan(10);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select is((select count(*)::integer from public.services where organization_id = '67000000-0000-0000-0000-000000000001'), 0, 'organization starts without services');
select lives_ok($$select * from public.create_service('67000000-0000-0000-0000-000000000001'::uuid, 'Assessment', 'Initial assessment', 1)$$, 'owner creates the first service');
select lives_ok($$select * from public.create_service('67000000-0000-0000-0000-000000000001'::uuid, 'Follow-up', null, 2)$$, 'owner creates the second service');
select is((select count(*)::integer from public.services where organization_id = '67000000-0000-0000-0000-000000000001'), 2, 'two services persist in the tenant');
select throws_ok($$select * from public.create_service('67000000-0000-0000-0000-000000000001'::uuid, 'Assessment')$$, '23505', 'SERVICE_NAME_ALREADY_EXISTS', 'duplicate service names are rejected');
select lives_ok($$select public.update_service((select id from public.services where name = 'Assessment'), 'Initial Assessment', 'Updated', 0)$$, 'owner updates a service');
select is((select name from public.services where display_order = 0), 'Initial Assessment', 'service update persists');
select lives_ok($$select public.archive_service((select id from public.services where name = 'Follow-up'))$$, 'owner archives a service');
select is((select status from public.services where name = 'Follow-up'), 'archived', 'service archive persists');
select throws_ok($$insert into public.services (organization_id, name) values ('67000000-0000-0000-0000-000000000001', 'Direct Write')$$, '42501', null, 'direct service writes remain denied');

select * from finish();
rollback;
