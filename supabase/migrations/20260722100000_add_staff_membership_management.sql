alter table public.invitations
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles (id) on delete set null,
  add column resend_count integer not null default 0 check (resend_count >= 0),
  add column last_sent_at timestamptz,
  add column idempotency_key text check (idempotency_key is null or idempotency_key ~ '^[a-zA-Z0-9_-]{16,128}$');

alter table public.invitations drop constraint invitations_status_check;
alter table public.invitations add constraint invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked', 'cancelled'));
alter table public.invitations drop constraint invitations_status_dates_check;
alter table public.invitations add constraint invitations_status_dates_check check (
  (status <> 'accepted' or (accepted_at is not null and accepted_by is not null))
  and (status not in ('revoked', 'cancelled') or (revoked_at is not null or cancelled_at is not null))
);

create unique index invitations_idempotency_idx
  on public.invitations (organization_id, invited_by, idempotency_key)
  where idempotency_key is not null;

alter table public.organization_memberships add column removed_at timestamptz;
alter table public.organization_memberships add column removed_by uuid references public.profiles (id) on delete set null;
alter table public.organization_memberships drop constraint organization_memberships_status_check;
alter table public.organization_memberships add constraint organization_memberships_status_check check (status in ('invited', 'active', 'suspended', 'revoked', 'removed'));
alter table public.organization_memberships drop constraint memberships_status_dates_check;
alter table public.organization_memberships add constraint memberships_status_dates_check check (
  (status <> 'accepted' or accepted_at is not null)
  and (status <> 'suspended' or suspended_at is not null)
  and (status not in ('revoked', 'removed') or (revoked_at is not null or removed_at is not null))
);

alter table public.invitations add constraint invitations_id_organization_unique unique (id, organization_id);

create table public.invitation_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  invitation_id uuid not null,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invitation_role_assignments_unique unique (invitation_id, role_id),
  constraint invitation_role_assignments_invitation_fk foreign key (invitation_id, organization_id)
    references public.invitations (id, organization_id) on delete cascade
);

create table public.invitation_location_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  invitation_id uuid not null,
  clinic_id uuid not null,
  location_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint invitation_location_scopes_unique unique (invitation_id, location_id),
  constraint invitation_location_scopes_invitation_fk foreign key (invitation_id, organization_id)
    references public.invitations (id, organization_id) on delete cascade,
  constraint invitation_location_scopes_location_fk foreign key (location_id, clinic_id, organization_id)
    references public.locations (id, clinic_id, organization_id) on delete restrict
);

create index invitation_role_assignments_invitation_idx on public.invitation_role_assignments (invitation_id);
create index invitation_role_assignments_role_idx on public.invitation_role_assignments (role_id);
create index invitation_location_scopes_invitation_idx on public.invitation_location_scopes (invitation_id);
create index invitation_location_scopes_location_idx on public.invitation_location_scopes (location_id);
create index memberships_removed_idx on public.organization_memberships (organization_id, removed_at) where status = 'removed';

create or replace function public.is_organization_owner(target_organization_id uuid, target_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.membership_roles membership_role on membership_role.membership_id = membership.id
    join public.roles role_record on role_record.id = membership_role.role_id
    where membership.organization_id = target_organization_id
      and membership.profile_id = target_profile_id
      and membership.status = 'active'
      and role_record.organization_id is null
      and role_record.key = 'organization.owner'
      and role_record.status = 'active'
  )
$$;

revoke all on function public.is_organization_owner(uuid, uuid) from public;
grant execute on function public.is_organization_owner(uuid, uuid) to authenticated, service_role;

create or replace function public.create_staff_invitation(
  p_organization_id uuid,
  p_email text,
  p_role_keys text[],
  p_access_mode text,
  p_location_ids uuid[] default '{}',
  p_idempotency_key text default null
)
returns table (
  invitation_id uuid,
  organization_name text,
  invited_email text,
  expires_at timestamptz,
  acceptance_token text,
  already_exists boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $$
declare
  caller_id uuid := auth.uid();
  normalized_email text := lower(btrim(p_email));
  organization_record public.organizations%rowtype;
  invitation_record public.invitations%rowtype;
  role_record public.roles%rowtype;
  requested_role_key text;
  raw_token text;
  target_profile_id uuid;
  selected_location_id uuid;
begin
  if caller_id is null then raise exception using errcode = '42501', message = 'STAFF_UNAUTHENTICATED'; end if;
  if not public.has_permission(p_organization_id, 'staff.invite') or not public.has_permission(p_organization_id, 'roles.manage') then
    raise exception using errcode = '42501', message = 'STAFF_INVITE_FORBIDDEN';
  end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'STAFF_INVALID_EMAIL';
  end if;
  if p_access_mode not in ('all', 'selected') or coalesce(array_length(p_role_keys, 1), 0) = 0 then
    raise exception using errcode = '22023', message = 'STAFF_INVALID_ACCESS';
  end if;
  if p_idempotency_key is not null and p_idempotency_key !~ '^[a-zA-Z0-9_-]{16,128}$' then
    raise exception using errcode = '22023', message = 'STAFF_INVALID_REQUEST_KEY';
  end if;

  select * into organization_record from public.organizations where id = p_organization_id and status = 'active' for update;
  if not found then raise exception using errcode = '42501', message = 'STAFF_ORGANIZATION_UNAVAILABLE'; end if;

  if p_idempotency_key is not null then
    select * into invitation_record from public.invitations
    where organization_id = p_organization_id and invited_by = caller_id and idempotency_key = p_idempotency_key;
    if found then
      invitation_id := invitation_record.id;
      organization_name := organization_record.display_name;
      invited_email := invitation_record.email_normalized;
      expires_at := invitation_record.expires_at;
      acceptance_token := null;
      already_exists := true;
      return next;
      return;
    end if;
  end if;

  if exists (select 1 from public.invitations where organization_id = p_organization_id and email_normalized = normalized_email and status = 'pending') then
    raise exception using errcode = '23505', message = 'STAFF_INVITATION_PENDING';
  end if;
  select profile.id into target_profile_id from public.profiles profile join auth.users auth_user on auth_user.id = profile.id where lower(auth_user.email) = normalized_email and profile.status = 'active' limit 1;
  if target_profile_id is not null and exists (select 1 from public.organization_memberships where organization_id = p_organization_id and profile_id = target_profile_id and status in ('active', 'suspended')) then
    raise exception using errcode = '23505', message = 'STAFF_MEMBER_EXISTS';
  end if;

  foreach requested_role_key in array p_role_keys loop
    select * into role_record from public.roles where key = lower(requested_role_key) and status = 'active' and (organization_id is null or organization_id = p_organization_id);
    if not found or role_record.key = 'platform.super_admin' then raise exception using errcode = '42501', message = 'STAFF_ROLE_NOT_ASSIGNABLE'; end if;
    if role_record.key = 'organization.owner' and not public.is_organization_owner(p_organization_id, caller_id) then
      raise exception using errcode = '42501', message = 'STAFF_OWNER_ASSIGNMENT_FORBIDDEN';
    end if;
  end loop;
  if p_access_mode = 'selected' and coalesce(array_length(p_location_ids, 1), 0) = 0 then raise exception using errcode = '22023', message = 'STAFF_LOCATIONS_REQUIRED'; end if;
  foreach selected_location_id in array coalesce(p_location_ids, '{}') loop
    if not exists (select 1 from public.locations location_record where location_record.id = selected_location_id and location_record.organization_id = p_organization_id and location_record.status = 'active') then raise exception using errcode = '42501', message = 'STAFF_LOCATION_FORBIDDEN'; end if;
  end loop;

  raw_token := encode(gen_random_bytes(32), 'hex');
  insert into public.invitations (organization_id, email_normalized, target_profile_id, token_digest, invited_by, expires_at, proposed_access, idempotency_key, last_sent_at)
  values (p_organization_id, normalized_email, target_profile_id, digest(decode(raw_token, 'hex'), 'sha256'), caller_id, timezone('utc', now()) + interval '7 days', jsonb_build_object('access_mode', p_access_mode), p_idempotency_key, timezone('utc', now()))
  returning * into invitation_record;

  foreach requested_role_key in array p_role_keys loop
    insert into public.invitation_role_assignments (organization_id, invitation_id, role_id)
    select p_organization_id, invitation_record.id, id from public.roles where key = lower(requested_role_key) and status = 'active' and (organization_id is null or organization_id = p_organization_id);
  end loop;
  if p_access_mode = 'selected' then
    foreach selected_location_id in array p_location_ids loop
      insert into public.invitation_location_scopes (organization_id, invitation_id, clinic_id, location_id)
      select p_organization_id, invitation_record.id, clinic_id, id from public.locations where id = selected_location_id;
    end loop;
  end if;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata)
  values (caller_id, p_organization_id, 'staff_invitation.created', 'invitation', invitation_record.id, true, jsonb_build_object('email', normalized_email, 'access_mode', p_access_mode, 'expires_at', invitation_record.expires_at));
  invitation_id := invitation_record.id; organization_name := organization_record.display_name; invited_email := normalized_email; expires_at := invitation_record.expires_at; acceptance_token := raw_token; already_exists := false;
  return next;
end;
$$;

create or replace function public.resend_staff_invitation(p_invitation_id uuid)
returns table (invitation_id uuid, expires_at timestamptz, acceptance_token text)
language plpgsql security definer set search_path = pg_catalog, public, auth, extensions
as $$
declare caller_id uuid := auth.uid(); invitation_record public.invitations%rowtype; raw_token text;
begin
  select * into invitation_record from public.invitations where id = p_invitation_id for update;
  if not found or not public.has_permission(invitation_record.organization_id, 'staff.invite') then raise exception using errcode = '42501', message = 'STAFF_INVITATION_FORBIDDEN'; end if;
  if invitation_record.status <> 'pending' or invitation_record.expires_at <= timezone('utc', now()) then raise exception using errcode = '40901', message = 'STAFF_INVITATION_NOT_RESENDABLE'; end if;
  raw_token := encode(gen_random_bytes(32), 'hex');
  update public.invitations set token_digest = digest(decode(raw_token, 'hex'), 'sha256'), expires_at = timezone('utc', now()) + interval '7 days', resend_count = resend_count + 1, last_sent_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = invitation_record.id returning id, invitations.expires_at into invitation_id, expires_at;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invitation_record.organization_id, 'staff_invitation.resent', 'invitation', invitation_record.id, true, jsonb_build_object('resend_count', invitation_record.resend_count + 1));
  acceptance_token := raw_token; return next;
end;
$$;

create or replace function public.cancel_staff_invitation(p_invitation_id uuid, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); invitation_record public.invitations%rowtype;
begin
  select * into invitation_record from public.invitations where id = p_invitation_id for update;
  if not found or not public.has_permission(invitation_record.organization_id, 'staff.invite') then raise exception using errcode = '42501', message = 'STAFF_INVITATION_FORBIDDEN'; end if;
  if invitation_record.status <> 'pending' then return false; end if;
  update public.invitations set status = 'cancelled', cancelled_at = timezone('utc', now()), cancelled_by = caller_id, revoked_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = invitation_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invitation_record.organization_id, 'staff_invitation.cancelled', 'invitation', invitation_record.id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

create or replace function public.get_staff_invitation_preview(p_token text)
returns table (invitation_id uuid, organization_name text, invited_email text, expires_at timestamptz, role_names text[], access_mode text)
language plpgsql security definer set search_path = pg_catalog, public, auth, extensions
as $$
declare caller_id uuid := auth.uid(); caller_email text; invitation_record public.invitations%rowtype;
begin
  if caller_id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception using errcode = '40401', message = 'STAFF_INVITATION_UNAVAILABLE'; end if;
  select lower(email) into caller_email from auth.users where id = caller_id;
  select * into invitation_record from public.invitations where token_digest = digest(decode(p_token, 'hex'), 'sha256') for update;
  if not found or invitation_record.status <> 'pending' or invitation_record.expires_at <= timezone('utc', now()) or caller_email <> invitation_record.email_normalized then raise exception using errcode = '40401', message = 'STAFF_INVITATION_UNAVAILABLE'; end if;
  invitation_id := invitation_record.id; organization_name := (select org.display_name from public.organizations org where org.id = invitation_record.organization_id); invited_email := invitation_record.email_normalized; expires_at := invitation_record.expires_at; access_mode := invitation_record.proposed_access ->> 'access_mode';
  select array_agg(role_record.name order by role_record.name) into role_names from public.invitation_role_assignments assignment join public.roles role_record on role_record.id = assignment.role_id where assignment.invitation_id = invitation_record.id;
  return next;
end;
$$;

create or replace function public.accept_staff_invitation(p_token text)
returns table (organization_id uuid, organization_name text, membership_id uuid)
language plpgsql security definer set search_path = pg_catalog, public, auth, extensions
as $$
declare caller_id uuid := auth.uid(); caller_email text; invitation_record public.invitations%rowtype; membership_record public.organization_memberships%rowtype;
begin
  if caller_id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception using errcode = '40401', message = 'STAFF_INVITATION_UNAVAILABLE'; end if;
  select lower(email) into caller_email from auth.users where id = caller_id;
  select * into invitation_record from public.invitations where token_digest = digest(decode(p_token, 'hex'), 'sha256') for update;
  if not found or caller_email <> invitation_record.email_normalized then raise exception using errcode = '40401', message = 'STAFF_INVITATION_UNAVAILABLE'; end if;
  if invitation_record.status = 'accepted' and invitation_record.accepted_by = caller_id then
    organization_id := invitation_record.organization_id; organization_name := (select org.display_name from public.organizations org where org.id = invitation_record.organization_id); membership_id := (select member.id from public.organization_memberships member where member.organization_id = invitation_record.organization_id and member.profile_id = caller_id and member.status in ('active', 'suspended') order by member.created_at limit 1); return next; return;
  end if;
  if invitation_record.status <> 'pending' then raise exception using errcode = '40901', message = 'STAFF_INVITATION_NOT_ACCEPTABLE'; end if;
  if invitation_record.expires_at <= timezone('utc', now()) then update public.invitations set status = 'expired', updated_at = timezone('utc', now()) where id = invitation_record.id; raise exception using errcode = '40901', message = 'STAFF_INVITATION_EXPIRED'; end if;
  select member.* into membership_record from public.organization_memberships member where member.organization_id = invitation_record.organization_id and member.profile_id = caller_id and member.status in ('active', 'suspended', 'invited') for update;
  if found and membership_record.status = 'suspended' then raise exception using errcode = '40901', message = 'STAFF_MEMBERSHIP_SUSPENDED'; end if;
  if found then update public.organization_memberships set status = 'active', accepted_at = coalesce(accepted_at, timezone('utc', now())), updated_at = timezone('utc', now()), removed_at = null, removed_by = null where id = membership_record.id returning * into membership_record;
  else insert into public.organization_memberships (organization_id, profile_id, status, accepted_at) values (invitation_record.organization_id, caller_id, 'active', timezone('utc', now())) returning * into membership_record; end if;
  insert into public.membership_roles (organization_id, membership_id, role_id, assigned_by) select invitation_record.organization_id, membership_record.id, role_id, caller_id from public.invitation_role_assignments where invitation_id = invitation_record.id on conflict do nothing;
  insert into public.membership_location_scopes (organization_id, membership_id, clinic_id, location_id, created_by) select invitation_record.organization_id, membership_record.id, clinic_id, location_id, caller_id from public.invitation_location_scopes where invitation_id = invitation_record.id on conflict do nothing;
  update public.invitations set status = 'accepted', accepted_by = caller_id, accepted_at = timezone('utc', now()), target_profile_id = caller_id, updated_at = timezone('utc', now()) where id = invitation_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invitation_record.organization_id, 'staff_invitation.accepted', 'invitation', invitation_record.id, true, jsonb_build_object('membership_id', membership_record.id));
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invitation_record.organization_id, 'membership.activated', 'membership', membership_record.id, true, '{}'::jsonb);
  organization_id := invitation_record.organization_id; organization_name := (select org.display_name from public.organizations org where org.id = invitation_record.organization_id); membership_id := membership_record.id; return next;
end;
$$;

create or replace function public.update_membership_roles_and_access(p_membership_id uuid, p_role_keys text[], p_access_mode text, p_location_ids uuid[] default '{}')
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); membership_record public.organization_memberships%rowtype; role_record public.roles%rowtype; requested_role_key text; selected_location_id uuid; owner_before boolean; owner_after boolean; active_owner_count integer;
begin
  select * into membership_record from public.organization_memberships where id = p_membership_id for update;
  if not found or not public.has_permission(membership_record.organization_id, 'staff.manage') or not public.has_permission(membership_record.organization_id, 'roles.manage') then raise exception using errcode = '42501', message = 'STAFF_MEMBERSHIP_FORBIDDEN'; end if;
  select public.is_organization_owner(membership_record.organization_id, membership_record.profile_id) into owner_before;
  foreach requested_role_key in array p_role_keys loop
    select * into role_record from public.roles where key = lower(requested_role_key) and status = 'active' and (organization_id is null or organization_id = membership_record.organization_id);
    if not found or role_record.key = 'platform.super_admin' then raise exception using errcode = '42501', message = 'STAFF_ROLE_NOT_ASSIGNABLE'; end if;
    if role_record.key = 'organization.owner' and not public.is_organization_owner(membership_record.organization_id, caller_id) then raise exception using errcode = '42501', message = 'STAFF_OWNER_ASSIGNMENT_FORBIDDEN'; end if;
  end loop;
  select exists (select 1 from unnest(p_role_keys) key_value where lower(key_value) = 'organization.owner') into owner_after;
  if owner_before and not owner_after then select count(*) into active_owner_count from public.organization_memberships member where member.organization_id = membership_record.organization_id and member.status = 'active' and public.is_organization_owner(membership_record.organization_id, member.profile_id); if active_owner_count <= 1 then raise exception using errcode = '40901', message = 'STAFF_LAST_OWNER_PROTECTED'; end if; end if;
  if p_access_mode = 'selected' and coalesce(array_length(p_location_ids, 1), 0) = 0 then raise exception using errcode = '22023', message = 'STAFF_LOCATIONS_REQUIRED'; end if;
  foreach selected_location_id in array coalesce(p_location_ids, '{}') loop if not exists (select 1 from public.locations where id = selected_location_id and organization_id = membership_record.organization_id and status = 'active') then raise exception using errcode = '42501', message = 'STAFF_LOCATION_FORBIDDEN'; end if; end loop;
  delete from public.membership_roles where membership_id = membership_record.id;
  delete from public.membership_location_scopes where membership_id = membership_record.id;
  foreach requested_role_key in array p_role_keys loop insert into public.membership_roles (organization_id, membership_id, role_id, assigned_by) select membership_record.organization_id, membership_record.id, id, caller_id from public.roles where key = lower(requested_role_key) and status = 'active' and (organization_id is null or organization_id = membership_record.organization_id); end loop;
  if p_access_mode = 'selected' then foreach selected_location_id in array p_location_ids loop insert into public.membership_location_scopes (organization_id, membership_id, clinic_id, location_id, created_by) select membership_record.organization_id, membership_record.id, clinic_id, id, caller_id from public.locations where id = selected_location_id; end loop; end if;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, membership_record.organization_id, 'membership.roles_changed', 'membership', membership_record.id, true, jsonb_build_object('role_keys', p_role_keys));
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, membership_record.organization_id, 'membership.location_access_changed', 'membership', membership_record.id, true, jsonb_build_object('access_mode', p_access_mode, 'location_count', coalesce(array_length(p_location_ids, 1), 0)));
  return true;
end;
$$;

create or replace function public.update_membership_status(p_membership_id uuid, p_status text, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); membership_record public.organization_memberships%rowtype; owner_target boolean; active_owner_count integer; audit_action text;
begin
  if p_status not in ('active', 'suspended', 'removed') then raise exception using errcode = '22023', message = 'STAFF_INVALID_MEMBERSHIP_STATUS'; end if;
  select * into membership_record from public.organization_memberships where id = p_membership_id for update;
  if not found or not public.has_permission(membership_record.organization_id, case when p_status = 'suspended' then 'staff.suspend' else 'staff.manage' end) then raise exception using errcode = '42501', message = 'STAFF_MEMBERSHIP_FORBIDDEN'; end if;
  if membership_record.status = 'removed' and p_status <> 'removed' then raise exception using errcode = '40901', message = 'STAFF_MEMBERSHIP_REMOVED'; end if;
  select public.is_organization_owner(membership_record.organization_id, membership_record.profile_id) into owner_target;
  if owner_target and membership_record.status = 'active' and p_status in ('suspended', 'removed') then select count(*) into active_owner_count from public.organization_memberships member where member.organization_id = membership_record.organization_id and member.status = 'active' and public.is_organization_owner(membership_record.organization_id, member.profile_id); if active_owner_count <= 1 then insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, outcome, metadata) values (caller_id, membership_record.organization_id, 'membership.last_owner_blocked', 'membership', membership_record.id, true, 'denied', jsonb_build_object('requested_status', p_status)); raise exception using errcode = '40901', message = 'STAFF_LAST_OWNER_PROTECTED'; end if; end if;
  if p_status = 'active' then update public.organization_memberships set status = 'active', suspended_at = null, status_reason = null, updated_at = timezone('utc', now()) where id = membership_record.id; audit_action := 'membership.reactivated';
  elsif p_status = 'suspended' then update public.organization_memberships set status = 'suspended', suspended_at = timezone('utc', now()), status_reason = left(p_reason, 500), updated_at = timezone('utc', now()) where id = membership_record.id; audit_action := 'membership.suspended';
  else update public.organization_memberships set status = 'removed', removed_at = timezone('utc', now()), removed_by = caller_id, status_reason = left(p_reason, 500), updated_at = timezone('utc', now()) where id = membership_record.id; audit_action := 'membership.removed'; end if;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, membership_record.organization_id, audit_action, 'membership', membership_record.id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

revoke all on function public.create_staff_invitation(uuid, text, text[], text, uuid[], text) from public;
revoke all on function public.resend_staff_invitation(uuid) from public;
revoke all on function public.cancel_staff_invitation(uuid, text) from public;
revoke all on function public.get_staff_invitation_preview(text) from public;
revoke all on function public.accept_staff_invitation(text) from public;
revoke all on function public.update_membership_roles_and_access(uuid, text[], text, uuid[]) from public;
revoke all on function public.update_membership_status(uuid, text, text) from public;
grant execute on function public.create_staff_invitation(uuid, text, text[], text, uuid[], text) to authenticated;
grant execute on function public.resend_staff_invitation(uuid) to authenticated;
grant execute on function public.cancel_staff_invitation(uuid, text) to authenticated;
grant execute on function public.get_staff_invitation_preview(text) to authenticated;
grant execute on function public.accept_staff_invitation(text) to authenticated;
grant execute on function public.update_membership_roles_and_access(uuid, text[], text, uuid[]) to authenticated;
grant execute on function public.update_membership_status(uuid, text, text) to authenticated;

alter table public.invitation_role_assignments enable row level security;
alter table public.invitation_location_scopes enable row level security;
revoke all on public.invitation_role_assignments, public.invitation_location_scopes from public, anon, authenticated;
grant select on public.invitation_role_assignments, public.invitation_location_scopes to authenticated;

drop policy if exists invitations_select_staff on public.invitations;
drop policy if exists invitations_insert_staff on public.invitations;
drop policy if exists invitations_update_staff on public.invitations;
drop policy if exists invitations_delete_denied on public.invitations;
create policy invitations_select_staff on public.invitations for select to authenticated using (public.has_permission(organization_id, 'staff.read'));
create policy invitations_insert_denied_staff on public.invitations for insert to authenticated with check (false);
create policy invitations_update_denied_staff on public.invitations for update to authenticated using (false) with check (false);
create policy invitations_delete_denied_staff on public.invitations for delete to authenticated using (false);

drop policy if exists memberships_update_staff on public.organization_memberships;
create policy memberships_update_denied_staff on public.organization_memberships for update to authenticated using (false) with check (false);

create policy profiles_select_staff on public.profiles for select to authenticated
using (exists (select 1 from public.organization_memberships target_membership where target_membership.profile_id = profiles.id and public.has_permission(target_membership.organization_id, 'staff.read')));

create policy invitation_role_assignments_select_staff on public.invitation_role_assignments for select to authenticated using (public.has_permission(organization_id, 'staff.read'));
create policy invitation_location_scopes_select_staff on public.invitation_location_scopes for select to authenticated using (public.has_permission(organization_id, 'staff.read'));

comment on function public.accept_staff_invitation(text) is 'Authenticated, token-digest based invitation acceptance. Never logs or returns raw token material.';
comment on function public.update_membership_status(uuid, text, text) is 'Transactional membership lifecycle with organization lock semantics and last-owner protection.';
