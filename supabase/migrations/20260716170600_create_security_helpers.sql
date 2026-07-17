create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.id
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'active'
$$;

create or replace function public.has_active_membership(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.profile_id = public.current_profile_id()
      and m.status = 'active'
  )
$$;

create or replace function public.has_organization_access(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.has_active_membership(target_organization_id)
$$;

create or replace function public.has_clinic_access(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.clinics c
    join public.organization_memberships m
      on m.organization_id = c.organization_id
     and m.profile_id = public.current_profile_id()
     and m.status = 'active'
    where c.id = target_clinic_id
      and c.status = 'active'
      and (
        (
          not exists (select 1 from public.membership_clinic_scopes cs where cs.membership_id = m.id)
          and not exists (select 1 from public.membership_location_scopes ls where ls.membership_id = m.id)
        )
        or exists (select 1 from public.membership_clinic_scopes cs where cs.membership_id = m.id and cs.clinic_id = c.id)
        or exists (
          select 1
          from public.membership_location_scopes ls
          where ls.membership_id = m.id and ls.clinic_id = c.id
        )
      )
  )
$$;

create or replace function public.has_location_access(target_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.locations l
    join public.organization_memberships m
      on m.organization_id = l.organization_id
     and m.profile_id = public.current_profile_id()
     and m.status = 'active'
    where l.id = target_location_id
      and l.status = 'active'
      and public.has_clinic_access(l.clinic_id)
      and (
        not exists (select 1 from public.membership_location_scopes ls where ls.membership_id = m.id)
        or exists (select 1 from public.membership_location_scopes ls where ls.membership_id = m.id and ls.location_id = l.id)
      )
  )
$$;

create or replace function public.has_permission(target_organization_id uuid, required_permission text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.roles r on r.id = mr.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = target_organization_id
      and m.profile_id = public.current_profile_id()
      and m.status = 'active'
      and (mr.expires_at is null or mr.expires_at > timezone('utc', now()))
      and r.status = 'active'
      and (r.organization_id is null or r.organization_id = m.organization_id)
      and p.status = 'active'
      and p.key = required_permission
  )
$$;

comment on function public.has_permission(uuid, text) is 'RLS helper. Evaluates active membership roles with allow-based permissions; no explicit deny model.';
comment on function public.has_clinic_access(uuid) is 'RLS helper. Empty scopes are organization-wide; clinic and location scopes restrict access.';
comment on function public.has_location_access(uuid) is 'RLS helper. Location access is bounded by active clinic and membership scope.';

revoke all on function public.current_profile_id() from public;
revoke all on function public.has_active_membership(uuid) from public;
revoke all on function public.has_organization_access(uuid) from public;
revoke all on function public.has_clinic_access(uuid) from public;
revoke all on function public.has_location_access(uuid) from public;
revoke all on function public.has_permission(uuid, text) from public;
grant execute on function public.current_profile_id() to authenticated, service_role;
grant execute on function public.has_active_membership(uuid) to authenticated, service_role;
grant execute on function public.has_organization_access(uuid) to authenticated, service_role;
grant execute on function public.has_clinic_access(uuid) to authenticated, service_role;
grant execute on function public.has_location_access(uuid) to authenticated, service_role;
grant execute on function public.has_permission(uuid, text) to authenticated, service_role;

create or replace function public.append_audit_event(
  actor_profile_id uuid,
  organization_id uuid,
  clinic_id uuid,
  location_id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  request_id text,
  security_event boolean,
  outcome text,
  ip_address inet,
  user_agent text,
  before_metadata jsonb,
  after_metadata jsonb,
  metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  inserted_id uuid;
begin
  insert into public.audit_events (
    actor_profile_id, organization_id, clinic_id, location_id, action, entity_type,
    entity_id, request_id, security_event, outcome, ip_address, user_agent,
    before_metadata, after_metadata, metadata
  )
  values (
    actor_profile_id, organization_id, clinic_id, location_id, action, entity_type,
    entity_id, request_id, security_event, outcome, ip_address, user_agent,
    before_metadata, after_metadata, coalesce(metadata, '{}'::jsonb)
  )
  returning id into inserted_id;
  return inserted_id;
end;
$$;

revoke all on function public.append_audit_event(uuid, uuid, uuid, uuid, text, text, uuid, text, boolean, text, inet, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.append_audit_event(uuid, uuid, uuid, uuid, text, text, uuid, text, boolean, text, inet, text, jsonb, jsonb, jsonb) to service_role;
