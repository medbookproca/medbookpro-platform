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

select plan(20);

select tests.create_supabase_user('00000000-0000-0000-0000-000000000011', 'owner@example.test');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000012', 'second@example.test');

set local role anon;
select throws_ok($$select * from public.create_organization_with_first_location('anonymous-key-123456', '{}'::jsonb, '{}'::jsonb)$$, '42501', null, 'anonymous callers cannot invoke onboarding');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);

select is((select count(*)::integer from public.organizations), 0, 'test starts with no organizations');
select lives_ok($$select * from public.create_organization_with_first_location(
  'onboarding-key-123456',
  '{"legalName":"Northstar Wellness Test Organization","displayName":"Northstar Wellness","countryCode":"CA","timezone":"America/Edmonton","currency":"CAD","locale":"en-CA"}'::jsonb,
  '{"name":"Downtown Test Location","locationType":"physical","addressLine1":"100 Test Street","city":"Edmonton","provinceOrState":"AB","postalCode":"T5J 1N3","countryCode":"CA","timezone":"America/Edmonton","publicBookingEnabled":false}'::jsonb
)$$, 'authenticated owner can complete onboarding');

select is((select count(*)::integer from public.organizations), 1, 'one organization is created');
select is((select count(*)::integer from public.locations), 1, 'one first location is created');
select is((select count(*)::integer from public.clinics), 1, 'one compatibility clinic is created');
select is((select count(*)::integer from public.organization_memberships where profile_id = auth.uid() and status = 'active'), 1, 'initial membership is active');
select is((select r.key from public.membership_roles mr join public.roles r on r.id = mr.role_id), 'organization.owner', 'trusted owner role is assigned');
select is((select onboarding_status from public.organizations limit 1), 'completed', 'onboarding completes after provisioning');
select is(public.has_location_access((select id from public.locations limit 1)), true, 'owner can access the first location');
select is(public.has_location_access((select id from public.locations limit 1)), true, 'owner has future-location access semantics');
select is((select count(*)::integer from public.audit_events where action in ('organization.created', 'location.created', 'membership.created', 'role.assigned', 'onboarding.completed')), 5, 'five safe audit events are written');
select is((select count(*)::integer from public.audit_events where metadata::text ~* '(token|cookie|password|secret|access_token|refresh_token)'), 0, 'audit metadata contains no prohibited secret fields');

select is((select count(*)::integer from public.create_organization_with_first_location(
  'onboarding-key-123456',
  '{"legalName":"Different Organization","displayName":"Different Organization","countryCode":"CA","timezone":"America/Edmonton","currency":"CAD","locale":"en-CA"}'::jsonb,
  '{"name":"Different Location","locationType":"virtual","countryCode":"CA","timezone":"America/Edmonton","publicBookingEnabled":false}'::jsonb
)), 1, 'replayed idempotency key returns the original result');
select is((select count(*)::integer from public.organizations), 1, 'replay does not create a duplicate organization');

select throws_ok($$select * from public.create_organization_with_first_location(
  'invalid-key',
  '{"legalName":"Invalid","displayName":"Invalid","countryCode":"CA","timezone":"America/Edmonton","currency":"CAD","locale":"en-CA"}'::jsonb,
  '{"name":"Invalid Location","locationType":"physical","countryCode":"CA","timezone":"America/Edmonton"}'::jsonb
)$$, '22023', 'ONBOARDING_INVALID_IDEMPOTENCY_KEY', 'invalid idempotency input is rejected');
select is((select count(*)::integer from public.organizations), 1, 'invalid input creates no organization');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select lives_ok($$select * from public.create_organization_with_first_location(
  'second-user-key-123456',
  '{"legalName":"Second Test Organization","displayName":"Second Test Organization","countryCode":"CA","timezone":"America/Edmonton","currency":"CAD","locale":"en-CA"}'::jsonb,
  '{"name":"Virtual Test Location","locationType":"virtual","countryCode":"CA","timezone":"America/Edmonton","publicBookingEnabled":false}'::jsonb
)$$, 'second user can create a separate organization');
set local role postgres;
select is((select count(*)::integer from public.organizations), 2, 'users are not globally limited to one organization');

select hasnt_column('public', 'organization_onboarding_attempts', 'access_token', 'idempotency records have no token fields');
select * from finish();
rollback;
