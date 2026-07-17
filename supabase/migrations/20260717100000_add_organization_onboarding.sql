alter table public.organizations
  add column display_name text,
  add column default_currency text not null default 'CAD' check (default_currency = upper(default_currency) and char_length(default_currency) = 3),
  add column default_locale text not null default 'en-CA' check (default_locale ~ '^[a-z]{2,3}-[A-Z]{2}$'),
  add column onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  add column created_by_user_id uuid references public.profiles (id) on delete set null;

update public.organizations
set display_name = name
where display_name is null;

alter table public.locations
  add column code text,
  add column location_type text not null default 'physical' check (location_type in ('physical', 'virtual')),
  add column province_or_state text,
  add column phone text,
  add column email text,
  add column operational_status text not null default 'active' check (operational_status in ('active', 'inactive', 'archived')),
  add column public_booking_enabled boolean not null default false;

create unique index locations_organization_code_idx
  on public.locations (organization_id, code)
  where code is not null;

create table public.organization_onboarding_attempts (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null check (idempotency_key ~ '^[a-zA-Z0-9_-]{16,128}$'),
  requested_by_user_id uuid not null references public.profiles (id) on delete restrict,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_onboarding_attempts_user_key unique (requested_by_user_id, idempotency_key),
  constraint organization_onboarding_attempts_request_unique unique (request_id)
);

create index organization_onboarding_attempts_organization_idx
  on public.organization_onboarding_attempts (organization_id);

create or replace function public.normalize_organization_slug(input_name text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select coalesce(nullif(trim(both '-' from regexp_replace(lower(trim(input_name)), '[^a-z0-9]+', '-', 'g')), ''), 'organization')
$$;

create or replace function public.create_organization_with_first_location(
  p_idempotency_key text,
  p_organization jsonb,
  p_location jsonb
)
returns table (
  organization_id uuid,
  location_id uuid,
  membership_id uuid,
  request_id uuid,
  organization_display_name text,
  location_name text
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  caller_id uuid := auth.uid();
  attempt public.organization_onboarding_attempts%rowtype;
  organization_record public.organizations%rowtype;
  clinic_id uuid;
  location_record public.locations%rowtype;
  provisioned_membership_id uuid;
  owner_role_id uuid;
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  provisioning_request_id uuid;
  normalized_org_name text;
  normalized_display_name text;
  normalized_location_name text;
  requested_country text;
  location_type text;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'ONBOARDING_UNAUTHENTICATED';
  end if;

  if not exists (select 1 from public.profiles p where p.id = caller_id and p.status = 'active') then
    raise exception using errcode = '42501', message = 'ONBOARDING_PROFILE_INACTIVE';
  end if;

  if p_idempotency_key is null or p_idempotency_key !~ '^[a-zA-Z0-9_-]{16,128}$' then
    raise exception using errcode = '22023', message = 'ONBOARDING_INVALID_IDEMPOTENCY_KEY';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller_id::text || ':' || p_idempotency_key, 0));

  select * into attempt
  from public.organization_onboarding_attempts
  where requested_by_user_id = caller_id and idempotency_key = p_idempotency_key
  for update;

  if found then
    select o.display_name, l.name into organization_display_name, location_name
    from public.organizations o
    join public.locations l on l.id = attempt.location_id
    where o.id = attempt.organization_id;
    organization_id := attempt.organization_id;
    location_id := attempt.location_id;
    membership_id := (select m.id from public.organization_memberships m where m.organization_id = attempt.organization_id and m.profile_id = caller_id and m.status = 'active' limit 1);
    request_id := attempt.request_id;
    return next;
    return;
  end if;

  normalized_org_name := nullif(left(trim(coalesce(p_organization ->> 'legalName', '')), 200), '');
  normalized_display_name := nullif(left(trim(coalesce(p_organization ->> 'displayName', '')), 200), '');
  normalized_location_name := nullif(left(trim(coalesce(p_location ->> 'name', '')), 200), '');
  requested_country := upper(coalesce(nullif(p_organization ->> 'countryCode', ''), 'CA'));
  location_type := coalesce(nullif(p_location ->> 'locationType', ''), 'physical');

  if normalized_org_name is null or normalized_display_name is null or normalized_location_name is null then
    raise exception using errcode = '22023', message = 'ONBOARDING_REQUIRED_NAME';
  end if;
  if requested_country !~ '^[A-Z]{2}$' then
    raise exception using errcode = '22023', message = 'ONBOARDING_INVALID_COUNTRY';
  end if;
  if location_type not in ('physical', 'virtual') then
    raise exception using errcode = '22023', message = 'ONBOARDING_INVALID_LOCATION_TYPE';
  end if;
  if location_type = 'physical' and nullif(trim(coalesce(p_location ->> 'addressLine1', '')), '') is null then
    raise exception using errcode = '22023', message = 'ONBOARDING_PHYSICAL_ADDRESS_REQUIRED';
  end if;

  provisioning_request_id := gen_random_uuid();

  perform pg_advisory_xact_lock(hashtextextended(public.normalize_organization_slug(normalized_display_name), 0));
  base_slug := public.normalize_organization_slug(normalized_display_name);
  candidate_slug := base_slug;
  while exists (select 1 from public.organizations o where o.slug = candidate_slug) loop
    suffix := suffix + 1;
    candidate_slug := left(base_slug, 200 - length(suffix::text) - 1) || '-' || suffix::text;
  end loop;

  insert into public.organizations (
    name, display_name, legal_name, slug, default_timezone, default_country_code,
    default_currency, default_locale, onboarding_status, created_by_user_id
  ) values (
    normalized_display_name, normalized_display_name, normalized_org_name, candidate_slug,
    coalesce(nullif(p_organization ->> 'timezone', ''), 'America/Edmonton'), requested_country,
    upper(coalesce(nullif(p_organization ->> 'currency', ''), case when requested_country = 'CA' then 'CAD' else 'USD' end)),
    coalesce(nullif(p_organization ->> 'locale', ''), case when requested_country = 'CA' then 'en-CA' else 'en-US' end),
    'in_progress', caller_id
  ) returning * into organization_record;

  insert into public.clinics (organization_id, name, slug, timezone)
  values (organization_record.id, normalized_display_name, candidate_slug, organization_record.default_timezone)
  returning id into clinic_id;

  insert into public.locations (
    organization_id, clinic_id, name, code, location_type, timezone, address_line_1,
    address_line_2, city, province, province_or_state, postal_code, country_code,
    phone, email, operational_status, public_booking_enabled
  ) values (
    organization_record.id, clinic_id, normalized_location_name,
    nullif(lower(trim(coalesce(p_location ->> 'code', ''))), ''), location_type,
    coalesce(nullif(p_location ->> 'timezone', ''), organization_record.default_timezone),
    nullif(trim(p_location ->> 'addressLine1'), ''), nullif(trim(p_location ->> 'addressLine2'), ''),
    nullif(trim(p_location ->> 'city'), ''), nullif(trim(p_location ->> 'provinceOrState'), ''),
    nullif(trim(p_location ->> 'provinceOrState'), ''), nullif(trim(p_location ->> 'postalCode'), ''),
    requested_country, nullif(trim(p_location ->> 'phone'), ''), nullif(lower(trim(p_location ->> 'email')), ''),
    'active', coalesce((p_location ->> 'publicBookingEnabled')::boolean, false)
  ) returning * into location_record;

  insert into public.organization_memberships (
    organization_id, profile_id, status, accepted_at
  ) values (organization_record.id, caller_id, 'active', timezone('utc', now()))
  returning id into provisioned_membership_id;

  select r.id into owner_role_id
  from public.roles r
  where r.organization_id is null and r.key = 'organization.owner' and r.kind = 'system' and r.status = 'active';
  if owner_role_id is null then
    raise exception using errcode = 'P0001', message = 'ONBOARDING_OWNER_ROLE_UNAVAILABLE';
  end if;

  insert into public.membership_roles (organization_id, membership_id, role_id, assigned_by)
  values (organization_record.id, provisioned_membership_id, owner_role_id, caller_id);

  insert into public.audit_events (actor_profile_id, organization_id, clinic_id, location_id, action, entity_type, entity_id, request_id, security_event, metadata)
  values
    (caller_id, organization_record.id, null, null, 'organization.created', 'organization', organization_record.id, provisioning_request_id, false, jsonb_build_object('display_name', organization_record.display_name, 'country_code', requested_country, 'timezone', organization_record.default_timezone)),
    (caller_id, organization_record.id, clinic_id, location_record.id, 'location.created', 'location', location_record.id, provisioning_request_id, false, jsonb_build_object('name', location_record.name, 'country_code', requested_country)),
    (caller_id, organization_record.id, null, null, 'membership.created', 'organization_membership', provisioned_membership_id, provisioning_request_id, true, jsonb_build_object('status', 'active')),
    (caller_id, organization_record.id, null, null, 'role.assigned', 'membership_role', provisioned_membership_id, provisioning_request_id, true, jsonb_build_object('role_key', 'organization.owner'));

  update public.organizations
  set onboarding_status = 'completed'
  where id = organization_record.id;

  insert into public.audit_events (actor_profile_id, organization_id, clinic_id, location_id, action, entity_type, entity_id, request_id, security_event, metadata)
  values (caller_id, organization_record.id, clinic_id, location_record.id, 'onboarding.completed', 'organization', organization_record.id, provisioning_request_id, true, jsonb_build_object('location_id', location_record.id));

  insert into public.organization_onboarding_attempts (idempotency_key, requested_by_user_id, organization_id, location_id, request_id)
  values (p_idempotency_key, caller_id, organization_record.id, location_record.id, provisioning_request_id);

  organization_id := organization_record.id;
  location_id := location_record.id;
  membership_id := provisioned_membership_id;
  request_id := provisioning_request_id;
  organization_display_name := organization_record.display_name;
  location_name := location_record.name;
  return next;
end;
$$;

revoke all on function public.normalize_organization_slug(text) from public;
revoke all on function public.create_organization_with_first_location(text, jsonb, jsonb) from public, anon;
grant execute on function public.create_organization_with_first_location(text, jsonb, jsonb) to authenticated;

alter table public.organization_onboarding_attempts enable row level security;
revoke all on public.organization_onboarding_attempts from public, anon, authenticated;

drop policy if exists organizations_insert_authenticated on public.organizations;
create policy organizations_insert_denied on public.organizations for insert to authenticated with check (false);

drop policy if exists memberships_insert_staff on public.organization_memberships;
create policy memberships_insert_denied on public.organization_memberships for insert to authenticated with check (false);

drop policy if exists clinic_scopes_insert_staff on public.membership_clinic_scopes;
create policy clinic_scopes_insert_denied on public.membership_clinic_scopes for insert to authenticated with check (false);
drop policy if exists clinic_scopes_update_staff on public.membership_clinic_scopes;
create policy clinic_scopes_update_denied on public.membership_clinic_scopes for update to authenticated using (false) with check (false);
drop policy if exists clinic_scopes_delete_staff on public.membership_clinic_scopes;
create policy clinic_scopes_delete_denied_onboarding on public.membership_clinic_scopes for delete to authenticated using (false);

drop policy if exists location_scopes_insert_staff on public.membership_location_scopes;
create policy location_scopes_insert_denied on public.membership_location_scopes for insert to authenticated with check (false);
drop policy if exists location_scopes_update_staff on public.membership_location_scopes;
create policy location_scopes_update_denied on public.membership_location_scopes for update to authenticated using (false) with check (false);
drop policy if exists location_scopes_delete_staff on public.membership_location_scopes;
create policy location_scopes_delete_denied_onboarding on public.membership_location_scopes for delete to authenticated using (false);

drop policy if exists membership_roles_insert_manager on public.membership_roles;
create policy membership_roles_insert_denied on public.membership_roles for insert to authenticated with check (false);
drop policy if exists membership_roles_update_manager on public.membership_roles;
create policy membership_roles_update_denied on public.membership_roles for update to authenticated using (false) with check (false);
drop policy if exists membership_roles_delete_manager on public.membership_roles;
create policy membership_roles_delete_denied_onboarding on public.membership_roles for delete to authenticated using (false);

comment on table public.organization_onboarding_attempts is 'Trusted onboarding idempotency records. Access is restricted to the security-definer onboarding function.';
comment on column public.organizations.onboarding_status is 'Provisioning lifecycle: not_started, in_progress, completed.';
comment on function public.create_organization_with_first_location(text, jsonb, jsonb) is 'Atomic authenticated onboarding. Empty location scopes mean organization-wide access, including future locations.';
