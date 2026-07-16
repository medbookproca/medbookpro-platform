begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_supabase_user(user_id uuid, user_email text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select plan(15);

-- Synthetic local-only identities and tenants. The transaction is rolled back at the end.
select tests.create_supabase_user('00000000-0000-0000-0000-000000000001', 'identity-a@example.invalid');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000002', 'identity-b@example.invalid');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000003', 'identity-c@example.invalid');

insert into public.organizations (id, name, slug)
values
  ('10000000-0000-0000-0000-000000000001', 'Local Organization One', 'local-organization-one'),
  ('10000000-0000-0000-0000-000000000002', 'Local Organization Two', 'local-organization-two');

insert into public.clinics (id, organization_id, name, slug)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Local Clinic One', 'local-clinic-one'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Local Clinic Two', 'local-clinic-two');

insert into public.locations (id, organization_id, clinic_id, name)
values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Local Location One'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Local Location Two');

insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'active', timezone('utc', now())),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'active', timezone('utc', now())),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'active', timezone('utc', now()));

insert into public.membership_clinic_scopes (organization_id, membership_id, clinic_id)
values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001');

insert into public.membership_location_scopes (organization_id, membership_id, clinic_id, location_id)
values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001');

insert into public.membership_roles (organization_id, membership_id, role_id)
select '10000000-0000-0000-0000-000000000001'::uuid, '40000000-0000-0000-0000-000000000001'::uuid, id from public.roles where key = 'organization.owner'
union all
select '10000000-0000-0000-0000-000000000002'::uuid, '40000000-0000-0000-0000-000000000002'::uuid, id from public.roles where key = 'organization.owner'
union all
select '10000000-0000-0000-0000-000000000001'::uuid, '40000000-0000-0000-0000-000000000003'::uuid, id from public.roles where key = 'receptionist';

insert into public.audit_events (id, action, entity_type)
values ('50000000-0000-0000-0000-000000000001', 'local.test', 'test');

set local role authenticated;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.organizations), 1, 'active member sees one organization');
select is((select count(*)::integer from public.organizations where id = '10000000-0000-0000-0000-000000000002'), 0, 'member cannot see another organization');
select is(public.has_permission('10000000-0000-0000-0000-000000000001', 'organizations.manage'), true, 'owner permission resolves');
select is(public.has_permission('10000000-0000-0000-0000-000000000001', 'billing.refund'), true, 'documented owner permission resolves');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is((select count(*)::integer from public.clinics), 1, 'clinic scope restricts clinic visibility');
select is((select count(*)::integer from public.locations), 1, 'location scope restricts location visibility');
select is(public.has_permission('10000000-0000-0000-0000-000000000001', 'organizations.manage'), false, 'receptionist lacks organization management');
select throws_ok($$insert into public.clinics (organization_id, name, slug) values ('10000000-0000-0000-0000-000000000002', 'Cross Tenant', 'cross-tenant')$$, '42501', null, 'tenant administrator cannot cross organization boundary');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
update public.organization_memberships set status = 'suspended', suspended_at = timezone('utc', now()) where id = '40000000-0000-0000-0000-000000000001';
select is((select count(*)::integer from public.organizations), 0, 'suspended membership loses access');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
update public.organization_memberships set status = 'revoked', revoked_at = timezone('utc', now()) where id = '40000000-0000-0000-0000-000000000002';
select is((select count(*)::integer from public.organizations), 0, 'revoked membership loses access');

select has_column('public', 'invitations', 'token_digest', 'invitations store a digest field');
select hasnt_column('public', 'invitations', 'raw_token', 'invitations do not store a raw token');
select throws_ok($$insert into public.audit_events (action, entity_type) values ('test', 'test')$$, '42501', null, 'ordinary users cannot insert audit events directly');
delete from public.audit_events where id = '50000000-0000-0000-0000-000000000001';
set local role postgres;
select is((select count(*)::integer from public.audit_events where id = '50000000-0000-0000-0000-000000000001'), 1, 'ordinary users cannot delete audit events');
select hasnt_column('public', 'profiles', 'role', 'profiles cannot self-assign a role');

select * from finish();
rollback;
