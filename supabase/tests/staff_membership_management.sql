begin;

create extension if not exists pgtap;
create schema if not exists tests;
create or replace function tests.create_supabase_user(user_id uuid, user_email text)
returns void language plpgsql security definer set search_path = pg_catalog, auth
as $$
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
  values (user_id, 'authenticated', 'authenticated', user_email, 'local-test-only', timezone('utc', now()))
  on conflict (id) do nothing;
end;
$$;

select tests.create_supabase_user('00000000-0000-0000-0000-000000000021', 'owner@example.test');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000022', 'staff@example.test');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000023', 'cancel@example.test');
select tests.create_supabase_user('00000000-0000-0000-0000-000000000024', 'expire@example.test');

insert into public.organizations (id, name, display_name, slug) values ('11000000-0000-0000-0000-000000000001', 'Staff Test Organization', 'Staff Test Organization', 'staff-test-organization');
insert into public.clinics (id, organization_id, name, slug) values ('22000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Staff Test Clinic', 'staff-test-clinic');
insert into public.locations (id, organization_id, clinic_id, name) values ('33000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Staff Test Location');
insert into public.organizations (id, name, display_name, slug) values ('11000000-0000-0000-0000-000000000002', 'Other Test Organization', 'Other Test Organization', 'other-test-organization');
insert into public.clinics (id, organization_id, name, slug) values ('22000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'Other Test Clinic', 'other-test-clinic');
insert into public.locations (id, organization_id, clinic_id, name) values ('33000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'Other Test Location');
insert into public.organization_memberships (id, organization_id, profile_id, status, accepted_at) values ('44000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'active', timezone('utc', now()));
insert into public.membership_roles (organization_id, membership_id, role_id) select '11000000-0000-0000-0000-000000000001', '44000000-0000-0000-0000-000000000001', id from public.roles where key = 'organization.owner';

select plan(28);
set local role anon;
select throws_ok($$select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'staff@example.test'::text, array['receptionist']::text[], 'all'::text, array[]::uuid[], 'anonymous-key-123456'::text)$$, '42501', null, 'anonymous users cannot create invitations');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
create temp table owner_invitation on commit drop as
select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'staff@example.test'::text, array['receptionist']::text[], 'selected'::text, array['33000000-0000-0000-0000-000000000001']::uuid[], 'owner-invite-key-1234'::text);
select is((select count(*)::integer from public.invitations where status = 'pending'), 1, 'authorized owner creates one pending invitation');
select ok((select token_digest is not null from public.invitations limit 1), 'invitation stores a token digest');
select hasnt_column('public', 'invitations', 'raw_token', 'invitations do not store raw tokens');
select is((select count(*)::integer from public.invitation_role_assignments), 1, 'invitation role assignment is structured');
select is((select count(*)::integer from public.invitation_location_scopes), 1, 'selected invitation location is structured');
select is((select count(*)::integer from public.invitations where organization_id = '11000000-0000-0000-0000-000000000002'), 0, 'invitation is tenant-owned');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', true);
select lives_ok($$select * from public.get_staff_invitation_preview((select acceptance_token from owner_invitation))$$, 'matching authenticated invitee can preview safely');
select lives_ok($$select * from public.accept_staff_invitation((select acceptance_token from owner_invitation))$$, 'matching invitee can accept once');
select is((select count(*)::integer from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000022' and status = 'active'), 1, 'acceptance creates an active membership');
select is((select count(*)::integer from public.membership_roles roles join public.organization_memberships memberships on memberships.id = roles.membership_id where memberships.profile_id = '00000000-0000-0000-0000-000000000022'), 1, 'acceptance assigns the invited role');
select is((select count(*)::integer from public.membership_location_scopes scopes join public.organization_memberships memberships on memberships.id = scopes.membership_id where memberships.profile_id = '00000000-0000-0000-0000-000000000022'), 1, 'acceptance assigns selected location access');
select lives_ok($$select * from public.accept_staff_invitation((select acceptance_token from owner_invitation))$$, 'acceptance is idempotent for the same authenticated user');
select is((select status from public.invitations where id = (select invitation_id from owner_invitation)), 'accepted', 'accepted invitation cannot return to pending');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
select throws_ok($$select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'staff@example.test'::text, array['receptionist']::text[], 'all'::text, array[]::uuid[], 'duplicate-invite-key'::text)$$, '23505', 'STAFF_MEMBER_EXISTS', 'active membership prevents duplicate invitation');
create temp table cancelled_invitation on commit drop as select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'cancel@example.test'::text, array['receptionist']::text[], 'all'::text, array[]::uuid[], 'cancel-invite-key-123'::text);
select public.cancel_staff_invitation((select invitation_id from cancelled_invitation), 'test cancellation');
select is((select status from public.invitations where id = (select invitation_id from cancelled_invitation)), 'cancelled', 'cancellation changes invitation state');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000023', true);
select throws_ok($$select * from public.accept_staff_invitation((select acceptance_token from cancelled_invitation))$$, '40901', 'STAFF_INVITATION_NOT_ACCEPTABLE', 'cancelled invitation cannot be accepted');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
create temp table expired_invitation on commit drop as select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'expire@example.test'::text, array['receptionist']::text[], 'all'::text, array[]::uuid[], 'expire-invite-key-123'::text);
set local role postgres;
update public.invitations set expires_at = timezone('utc', now()) - interval '1 minute' where id = (select invitation_id from expired_invitation);
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000024', true);
select throws_ok($$select * from public.accept_staff_invitation((select acceptance_token from expired_invitation))$$, '40901', 'STAFF_INVITATION_EXPIRED', 'expired invitation cannot be accepted');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
select lives_ok($$select public.update_membership_roles_and_access('44000000-0000-0000-0000-000000000001'::uuid, array['organization.owner']::text[], 'all'::text, array[]::uuid[])$$, 'owner can update own compatible role/access');
select throws_ok($$select public.update_membership_roles_and_access((select id from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000021'), array['receptionist']::text[], 'all'::text, array[]::uuid[])$$, '40901', 'STAFF_LAST_OWNER_PROTECTED', 'last owner cannot lose owner role');
select throws_ok($$select * from public.create_staff_invitation('11000000-0000-0000-0000-000000000001'::uuid, 'cross@example.test'::text, array['receptionist']::text[], 'selected'::text, array['33000000-0000-0000-0000-000000000002']::uuid[], 'cross-location-key'::text)$$, '42501', 'STAFF_LOCATION_FORBIDDEN', 'cross-organization location assignment is denied');
select lives_ok($$select public.update_membership_status((select id from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000022'), 'suspended', 'test suspension')$$, 'owner can suspend a member');
select lives_ok($$select public.update_membership_status((select id from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000022'), 'active', null)$$, 'owner can reactivate a member');
select lives_ok($$select public.update_membership_status((select id from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000022'), 'removed', 'test removal')$$, 'owner can remove a member without deleting history');
select throws_ok($$select public.update_membership_status((select id from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000021'), 'suspended', 'self suspension')$$, '40901', 'STAFF_LAST_OWNER_PROTECTED', 'last owner self-management is blocked');
select is((select count(*)::integer from public.audit_events where action like 'staff_invitation.%' or action like 'membership.%'), 11, 'sensitive invitation and membership actions are audited');
select throws_ok($$insert into public.invitations (organization_id, email_normalized, token_digest, invited_by, expires_at) values ('11000000-0000-0000-0000-000000000001', 'bypass@example.test', decode('00','hex'), '00000000-0000-0000-0000-000000000021', timezone('utc', now()) + interval '1 day')$$, '42501', null, 'direct invitation insert is denied');
select is((select count(*)::integer from public.organization_memberships where profile_id = '00000000-0000-0000-0000-000000000022' and status = 'removed'), 1, 'removed membership retains history');

select * from finish();
rollback;
