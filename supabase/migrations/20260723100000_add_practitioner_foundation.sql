insert into public.permissions (key, domain, action, description)
values
  ('practitioners.read', 'practitioners', 'read', 'Read practitioner profiles and assignments'),
  ('practitioners.create', 'practitioners', 'create', 'Create practitioners'),
  ('practitioners.update', 'practitioners', 'update', 'Update practitioner profiles'),
  ('practitioners.archive', 'practitioners', 'archive', 'Archive and restore practitioners'),
  ('practitioners.manage_credentials', 'practitioners', 'manage_credentials', 'Manage practitioner credentials'),
  ('practitioners.verify_credentials', 'practitioners', 'verify_credentials', 'Verify practitioner credentials'),
  ('practitioners.manage_locations', 'practitioners', 'manage_locations', 'Manage practitioner locations'),
  ('practitioners.manage_services', 'practitioners', 'manage_services', 'Manage practitioner services'),
  ('practitioners.manage_public_profile', 'practitioners', 'manage_public_profile', 'Manage practitioner public-profile readiness'),
  ('practitioners.link_membership', 'practitioners', 'link_membership', 'Link practitioners to organization memberships')
on conflict (key) do update set description = excluded.description, domain = excluded.domain, action = excluded.action, status = 'active';

alter table public.locations add constraint locations_id_organization_unique_practitioner_foundation unique (id, organization_id);

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  linked_membership_id uuid,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 200),
  professional_title text check (professional_title is null or char_length(btrim(professional_title)) between 1 and 200),
  registration_jurisdiction text check (registration_jurisdiction is null or char_length(btrim(registration_jurisdiction)) between 2 and 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive', 'archived')),
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioners_id_organization_unique unique (id, organization_id),
  constraint practitioners_status_archive_check check ((status = 'archived') = (archived_at is not null)),
  constraint practitioners_membership_fk foreign key (linked_membership_id, organization_id)
    references public.organization_memberships (id, organization_id) on delete restrict
);

create unique index practitioners_membership_unique_idx on public.practitioners (linked_membership_id) where linked_membership_id is not null;
create index practitioners_organization_status_idx on public.practitioners (organization_id, status);
create index practitioners_display_name_idx on public.practitioners (organization_id, lower(display_name));

create table public.practitioner_location_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  location_id uuid not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_primary boolean not null default false,
  effective_from date,
  effective_to date,
  booking_visible boolean not null default false,
  internal_notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_location_assignment_unique unique (practitioner_id, location_id),
  constraint practitioner_location_assignment_dates check (effective_to is null or effective_from is null or effective_to >= effective_from),
  constraint practitioner_location_assignment_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_location_assignment_location_fk foreign key (location_id, organization_id)
    references public.locations (id, organization_id) on delete restrict
);

create unique index practitioner_location_primary_idx on public.practitioner_location_assignments (practitioner_id) where status = 'active' and is_primary;
create index practitioner_location_organization_idx on public.practitioner_location_assignments (organization_id, location_id, status);

create table public.practitioner_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  credential_type text not null check (char_length(btrim(credential_type)) between 1 and 120),
  issuing_body text check (issuing_body is null or char_length(btrim(issuing_body)) between 1 and 200),
  registration_number text,
  jurisdiction text check (jurisdiction is null or char_length(btrim(jurisdiction)) between 2 and 100),
  issue_date date,
  expiry_date date,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified', 'rejected', 'expired')),
  verification_date timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  notes text,
  document_reference text,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_credential_dates check (expiry_date is null or issue_date is null or expiry_date >= issue_date),
  constraint practitioner_credential_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade
);

create unique index practitioner_primary_credential_idx on public.practitioner_credentials (practitioner_id) where status = 'active' and is_primary;
create index practitioner_credentials_organization_idx on public.practitioner_credentials (organization_id, practitioner_id, status);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  stable_key text not null check (stable_key = lower(stable_key) and stable_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  public_visible boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint specialties_id_organization_unique unique (id, organization_id),
  constraint specialties_organization_key_unique unique (organization_id, stable_key)
);

create index specialties_organization_status_idx on public.specialties (organization_id, status, display_order);

create table public.practitioner_specialty_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  specialty_id uuid not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_primary boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_specialty_assignment_unique unique (practitioner_id, specialty_id),
  constraint practitioner_specialty_assignment_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_specialty_assignment_specialty_fk foreign key (specialty_id, organization_id)
    references public.specialties (id, organization_id) on delete restrict
);

create unique index practitioner_primary_specialty_idx on public.practitioner_specialty_assignments (practitioner_id) where status = 'active' and is_primary;
create index practitioner_specialty_organization_idx on public.practitioner_specialty_assignments (organization_id, practitioner_id, status);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  display_order integer not null default 0 check (display_order >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_id_organization_unique unique (id, organization_id),
  constraint services_organization_name_unique unique (organization_id, name)
);

create index services_organization_status_idx on public.services (organization_id, status, display_order);

create table public.practitioner_service_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  service_id uuid not null,
  location_id uuid,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_order integer not null default 0 check (display_order >= 0),
  internal_notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_service_assignment_unique unique (practitioner_id, service_id, location_id),
  constraint practitioner_service_assignment_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_service_assignment_service_fk foreign key (service_id, organization_id)
    references public.services (id, organization_id) on delete restrict,
  constraint practitioner_service_assignment_location_fk foreign key (location_id, organization_id)
    references public.locations (id, organization_id) on delete restrict
);

create index practitioner_service_organization_idx on public.practitioner_service_assignments (organization_id, practitioner_id, status);
create unique index practitioner_service_active_unique_idx on public.practitioner_service_assignments (practitioner_id, service_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid)) where status = 'active';

create table public.practitioner_languages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  language_code text not null check (language_code = lower(language_code) and language_code ~ '^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$'),
  is_primary boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_language_unique unique (practitioner_id, language_code),
  constraint practitioner_language_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade
);

create unique index practitioner_primary_language_idx on public.practitioner_languages (practitioner_id) where is_primary;
create index practitioner_languages_organization_idx on public.practitioner_languages (organization_id, practitioner_id);

create table public.practitioner_public_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  display_name text,
  professional_title text,
  short_biography text check (short_biography is null or char_length(short_biography) <= 500),
  full_biography text check (full_biography is null or char_length(full_biography) <= 5000),
  pronouns text,
  profile_image_reference text,
  accepting_new_clients boolean not null default false,
  visibility_status text not null default 'private' check (visibility_status in ('private', 'published')),
  booking_visibility text not null default 'hidden' check (booking_visibility in ('hidden', 'visible')),
  profile_slug text check (profile_slug is null or profile_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  seo_title text,
  seo_description text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_public_profile_unique unique (practitioner_id),
  constraint practitioner_public_profile_id_organization_unique unique (id, organization_id),
  constraint practitioner_public_profile_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade
);

create unique index practitioner_public_profile_slug_idx on public.practitioner_public_profiles (organization_id, profile_slug) where profile_slug is not null;
create index practitioner_public_profile_visibility_idx on public.practitioner_public_profiles (organization_id, visibility_status, booking_visibility);

do $$
declare
  permission_key text;
begin
  foreach permission_key in array array[
    'practitioners.read', 'practitioners.create', 'practitioners.update', 'practitioners.archive',
    'practitioners.manage_credentials', 'practitioners.verify_credentials', 'practitioners.manage_locations',
    'practitioners.manage_services', 'practitioners.manage_public_profile', 'practitioners.link_membership'
  ] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'organization.owner' and r.organization_id is null
    on conflict do nothing;
  end loop;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r cross join public.permissions p
  where r.key = 'organization.admin' and r.organization_id is null
    and p.key in ('practitioners.read', 'practitioners.create', 'practitioners.update', 'practitioners.archive', 'practitioners.manage_credentials', 'practitioners.verify_credentials', 'practitioners.manage_locations', 'practitioners.manage_services', 'practitioners.manage_public_profile', 'practitioners.link_membership')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r cross join public.permissions p
  where r.key = 'clinic.admin' and r.organization_id is null
    and p.key in ('practitioners.read', 'practitioners.create', 'practitioners.update', 'practitioners.manage_locations', 'practitioners.manage_services', 'practitioners.manage_public_profile', 'practitioners.link_membership')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r cross join public.permissions p
  where r.key = 'location.manager' and r.organization_id is null
    and p.key in ('practitioners.read', 'practitioners.manage_locations')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id
  from public.roles r cross join public.permissions p
  where r.key = 'practitioner' and r.organization_id is null
    and p.key = 'practitioners.read'
  on conflict do nothing;
end $$;

create trigger practitioners_set_updated_at before update on public.practitioners for each row execute function public.set_updated_at();
create trigger practitioner_location_assignments_set_updated_at before update on public.practitioner_location_assignments for each row execute function public.set_updated_at();
create trigger practitioner_credentials_set_updated_at before update on public.practitioner_credentials for each row execute function public.set_updated_at();
create trigger specialties_set_updated_at before update on public.specialties for each row execute function public.set_updated_at();
create trigger practitioner_specialty_assignments_set_updated_at before update on public.practitioner_specialty_assignments for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger practitioner_service_assignments_set_updated_at before update on public.practitioner_service_assignments for each row execute function public.set_updated_at();
create trigger practitioner_languages_set_updated_at before update on public.practitioner_languages for each row execute function public.set_updated_at();
create trigger practitioner_public_profiles_set_updated_at before update on public.practitioner_public_profiles for each row execute function public.set_updated_at();

create or replace function public.create_practitioner(
  p_organization_id uuid,
  p_display_name text,
  p_professional_title text default null,
  p_status text default 'draft',
  p_membership_id uuid default null,
  p_location_ids uuid[] default '{}',
  p_primary_location_id uuid default null,
  p_specialty_ids uuid[] default '{}',
  p_language_codes text[] default '{}'
)
returns table (practitioner_id uuid)
language plpgsql security definer set search_path = pg_catalog, public, auth, extensions
as $$
declare
  caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; location_id uuid; specialty_id uuid; language_code text;
begin
  if caller_id is null or not public.has_permission(p_organization_id, 'practitioners.create') then raise exception using errcode = '42501', message = 'PRACTITIONER_CREATE_FORBIDDEN'; end if;
  if p_status not in ('draft', 'active', 'inactive') or btrim(coalesce(p_display_name, '')) = '' then raise exception using errcode = '22023', message = 'PRACTITIONER_INVALID_PROFILE'; end if;
  if p_membership_id is not null and not exists (select 1 from public.organization_memberships m where m.id = p_membership_id and m.organization_id = p_organization_id and m.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_MEMBERSHIP_FORBIDDEN'; end if;
  if p_primary_location_id is not null and not p_primary_location_id = any(coalesce(p_location_ids, '{}')) then raise exception using errcode = '22023', message = 'PRACTITIONER_PRIMARY_LOCATION_INVALID'; end if;
  foreach location_id in array coalesce(p_location_ids, '{}') loop
    if not exists (select 1 from public.locations l where l.id = location_id and l.organization_id = p_organization_id and l.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_LOCATION_FORBIDDEN'; end if;
  end loop;
  foreach specialty_id in array coalesce(p_specialty_ids, '{}') loop
    if not exists (select 1 from public.specialties s where s.id = specialty_id and s.organization_id = p_organization_id and s.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_SPECIALTY_FORBIDDEN'; end if;
  end loop;
  foreach language_code in array coalesce(p_language_codes, '{}') loop
    if lower(language_code) !~ '^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$' then raise exception using errcode = '22023', message = 'PRACTITIONER_LANGUAGE_INVALID'; end if;
  end loop;
  insert into public.practitioners (organization_id, linked_membership_id, display_name, professional_title, status, created_by, updated_by, archived_at)
  values (p_organization_id, p_membership_id, btrim(p_display_name), nullif(btrim(p_professional_title), ''), p_status, caller_id, caller_id, null)
  returning * into practitioner_record;
  foreach location_id in array coalesce(p_location_ids, '{}') loop
    insert into public.practitioner_location_assignments (organization_id, practitioner_id, location_id, is_primary, created_by, updated_by)
    values (p_organization_id, practitioner_record.id, location_id, location_id = p_primary_location_id, caller_id, caller_id);
  end loop;
  foreach specialty_id in array coalesce(p_specialty_ids, '{}') loop
    insert into public.practitioner_specialty_assignments (organization_id, practitioner_id, specialty_id, is_primary, created_by, updated_by)
    values (p_organization_id, practitioner_record.id, specialty_id, specialty_id = p_specialty_ids[1], caller_id, caller_id);
  end loop;
  foreach language_code in array coalesce(p_language_codes, '{}') loop
    insert into public.practitioner_languages (organization_id, practitioner_id, language_code, is_primary, created_by, updated_by)
    values (p_organization_id, practitioner_record.id, lower(language_code), language_code = p_language_codes[1], caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata)
  values (caller_id, p_organization_id, 'practitioner.created', 'practitioner', practitioner_record.id, true, jsonb_build_object('status', p_status, 'linked_membership', p_membership_id is not null));
  practitioner_id := practitioner_record.id; return next;
end;
$$;

create or replace function public.update_practitioner_profile(p_practitioner_id uuid, p_display_name text, p_professional_title text default null, p_registration_jurisdiction text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.update') or practitioner_record.status = 'archived' then raise exception using errcode = '42501', message = 'PRACTITIONER_UPDATE_FORBIDDEN'; end if;
  if btrim(coalesce(p_display_name, '')) = '' then raise exception using errcode = '22023', message = 'PRACTITIONER_INVALID_PROFILE'; end if;
  update public.practitioners set display_name = btrim(p_display_name), professional_title = nullif(btrim(p_professional_title), ''), registration_jurisdiction = nullif(btrim(p_registration_jurisdiction), ''), updated_by = caller_id where id = practitioner_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.updated', 'practitioner', practitioner_record.id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.change_practitioner_status(p_practitioner_id uuid, p_status text, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; action_name text;
begin
  if p_status not in ('draft', 'active', 'inactive', 'archived') then raise exception using errcode = '22023', message = 'PRACTITIONER_STATUS_INVALID'; end if;
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, case when p_status = 'archived' or practitioner_record.status = 'archived' then 'practitioners.archive' else 'practitioners.update' end) then raise exception using errcode = '42501', message = 'PRACTITIONER_STATUS_FORBIDDEN'; end if;
  if practitioner_record.status = 'archived' and p_status <> 'active' then raise exception using errcode = '40901', message = 'PRACTITIONER_ARCHIVED_PROTECTED'; end if;
  update public.practitioners set status = p_status, archived_at = case when p_status = 'archived' then timezone('utc', now()) else null end, archived_by = case when p_status = 'archived' then caller_id else null end, updated_by = caller_id where id = practitioner_record.id;
  action_name := case p_status when 'active' then case when practitioner_record.status = 'draft' then 'practitioner.activated' else 'practitioner.restored' end when 'inactive' then 'practitioner.deactivated' when 'archived' then 'practitioner.archived' else 'practitioner.updated' end;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, action_name, 'practitioner', practitioner_record.id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

create or replace function public.link_practitioner_membership(p_practitioner_id uuid, p_membership_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.link_membership') then raise exception using errcode = '42501', message = 'PRACTITIONER_LINK_FORBIDDEN'; end if;
  if practitioner_record.status = 'archived' or not exists (select 1 from public.organization_memberships m where m.id = p_membership_id and m.organization_id = practitioner_record.organization_id and m.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_MEMBERSHIP_FORBIDDEN'; end if;
  if exists (select 1 from public.practitioners p where p.linked_membership_id = p_membership_id and p.id <> practitioner_record.id) then raise exception using errcode = '23505', message = 'PRACTITIONER_MEMBERSHIP_ALREADY_LINKED'; end if;
  update public.practitioners set linked_membership_id = p_membership_id, updated_by = caller_id where id = practitioner_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.membership_linked', 'practitioner', practitioner_record.id, true, jsonb_build_object('membership_id', p_membership_id));
  return true;
end;
$$;

create or replace function public.unlink_practitioner_membership(p_practitioner_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; old_membership_id uuid;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.link_membership') then raise exception using errcode = '42501', message = 'PRACTITIONER_LINK_FORBIDDEN'; end if;
  old_membership_id := practitioner_record.linked_membership_id;
  update public.practitioners set linked_membership_id = null, updated_by = caller_id where id = practitioner_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.membership_unlinked', 'practitioner', practitioner_record.id, true, jsonb_build_object('membership_id', old_membership_id));
  return true;
end;
$$;

create or replace function public.set_practitioner_locations(p_practitioner_id uuid, p_location_ids uuid[] default '{}', p_primary_location_id uuid default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; requested_location_id uuid;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.manage_locations') then raise exception using errcode = '42501', message = 'PRACTITIONER_LOCATION_FORBIDDEN'; end if;
  if practitioner_record.status in ('inactive', 'archived') and coalesce(array_length(p_location_ids, 1), 0) > 0 then raise exception using errcode = '40901', message = 'PRACTITIONER_NOT_ASSIGNABLE'; end if;
  if p_primary_location_id is not null and not p_primary_location_id = any(coalesce(p_location_ids, '{}')) then raise exception using errcode = '22023', message = 'PRACTITIONER_PRIMARY_LOCATION_INVALID'; end if;
  foreach requested_location_id in array coalesce(p_location_ids, '{}') loop
    if not exists (select 1 from public.locations l where l.id = requested_location_id and l.organization_id = practitioner_record.organization_id and l.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_LOCATION_FORBIDDEN'; end if;
  end loop;
  update public.practitioner_location_assignments assignment set status = 'inactive', is_primary = false, effective_to = coalesce(assignment.effective_to, current_date), updated_by = caller_id where assignment.practitioner_id = practitioner_record.id and assignment.status = 'active';
  foreach requested_location_id in array coalesce(p_location_ids, '{}') loop
    insert into public.practitioner_location_assignments (organization_id, practitioner_id, location_id, status, is_primary, effective_from, effective_to, created_by, updated_by)
    values (practitioner_record.organization_id, practitioner_record.id, requested_location_id, 'active', requested_location_id = p_primary_location_id, current_date, null, caller_id, caller_id)
    on conflict (practitioner_id, location_id) do update set status = 'active', is_primary = excluded.is_primary, effective_to = null, updated_by = caller_id, updated_at = timezone('utc', now());
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.locations_changed', 'practitioner', practitioner_record.id, true, jsonb_build_object('location_count', coalesce(array_length(p_location_ids, 1), 0), 'primary_location_id', p_primary_location_id));
  return true;
end;
$$;

create or replace function public.add_practitioner_credential(p_practitioner_id uuid, p_credential_type text, p_issuing_body text default null, p_registration_number text default null, p_jurisdiction text default null, p_issue_date date default null, p_expiry_date date default null, p_notes text default null, p_document_reference text default null, p_is_primary boolean default false)
returns table (credential_id uuid)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.manage_credentials') or practitioner_record.status = 'archived' then raise exception using errcode = '42501', message = 'PRACTITIONER_CREDENTIAL_FORBIDDEN'; end if;
  if btrim(coalesce(p_credential_type, '')) = '' or (p_expiry_date is not null and p_issue_date is not null and p_expiry_date < p_issue_date) then raise exception using errcode = '22023', message = 'PRACTITIONER_CREDENTIAL_INVALID'; end if;
  if p_is_primary then update public.practitioner_credentials set is_primary = false, updated_by = caller_id where practitioner_id = practitioner_record.id and status = 'active'; end if;
  insert into public.practitioner_credentials (organization_id, practitioner_id, credential_type, issuing_body, registration_number, jurisdiction, issue_date, expiry_date, notes, document_reference, is_primary, created_by, updated_by)
  values (practitioner_record.organization_id, practitioner_record.id, btrim(p_credential_type), nullif(btrim(p_issuing_body), ''), nullif(btrim(p_registration_number), ''), nullif(btrim(p_jurisdiction), ''), p_issue_date, p_expiry_date, p_notes, p_document_reference, p_is_primary, caller_id, caller_id)
  returning id into credential_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.credential_added', 'practitioner_credential', credential_id, true, jsonb_build_object('credential_type', p_credential_type, 'jurisdiction', p_jurisdiction, 'has_registration_number', p_registration_number is not null));
  return next;
end;
$$;

create or replace function public.update_practitioner_credential(p_credential_id uuid, p_credential_type text, p_issuing_body text default null, p_registration_number text default null, p_jurisdiction text default null, p_issue_date date default null, p_expiry_date date default null, p_notes text default null, p_document_reference text default null, p_is_primary boolean default false)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); credential_record public.practitioner_credentials%rowtype;
begin
  select c.* into credential_record from public.practitioner_credentials c where c.id = p_credential_id for update;
  if not found or not public.has_permission(credential_record.organization_id, 'practitioners.manage_credentials') then raise exception using errcode = '42501', message = 'PRACTITIONER_CREDENTIAL_FORBIDDEN'; end if;
  if p_expiry_date is not null and p_issue_date is not null and p_expiry_date < p_issue_date then raise exception using errcode = '22023', message = 'PRACTITIONER_CREDENTIAL_INVALID'; end if;
  if p_is_primary then update public.practitioner_credentials set is_primary = false, updated_by = caller_id where practitioner_id = credential_record.practitioner_id and id <> credential_record.id and status = 'active'; end if;
  update public.practitioner_credentials set credential_type = btrim(p_credential_type), issuing_body = nullif(btrim(p_issuing_body), ''), registration_number = nullif(btrim(p_registration_number), ''), jurisdiction = nullif(btrim(p_jurisdiction), ''), issue_date = p_issue_date, expiry_date = p_expiry_date, notes = p_notes, document_reference = p_document_reference, is_primary = p_is_primary, updated_by = caller_id where id = credential_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, credential_record.organization_id, 'practitioner.credential_updated', 'practitioner_credential', credential_record.id, true, jsonb_build_object('credential_type', p_credential_type));
  return true;
end;
$$;

create or replace function public.verify_practitioner_credential(p_credential_id uuid, p_verification_status text, p_notes text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); credential_record public.practitioner_credentials%rowtype; effective_status text := p_verification_status;
begin
  if p_verification_status not in ('unverified', 'pending', 'verified', 'rejected', 'expired') then raise exception using errcode = '22023', message = 'PRACTITIONER_VERIFICATION_INVALID'; end if;
  select c.* into credential_record from public.practitioner_credentials c where c.id = p_credential_id for update;
  if not found or not public.has_permission(credential_record.organization_id, 'practitioners.verify_credentials') then raise exception using errcode = '42501', message = 'PRACTITIONER_VERIFICATION_FORBIDDEN'; end if;
  if effective_status = 'verified' and credential_record.expiry_date is not null and credential_record.expiry_date < current_date then effective_status := 'expired'; end if;
  update public.practitioner_credentials set verification_status = effective_status, verification_date = timezone('utc', now()), verified_by = caller_id, notes = coalesce(p_notes, notes), updated_by = caller_id where id = credential_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, credential_record.organization_id, 'practitioner.credential_verification_changed', 'practitioner_credential', credential_record.id, true, jsonb_build_object('verification_status', effective_status));
  return true;
end;
$$;

create or replace function public.set_practitioner_specialties(p_practitioner_id uuid, p_specialty_ids uuid[] default '{}')
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; requested_specialty_id uuid; specialty_order integer := 0;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.update') or practitioner_record.status = 'archived' then raise exception using errcode = '42501', message = 'PRACTITIONER_SPECIALTY_FORBIDDEN'; end if;
  update public.practitioner_specialty_assignments set status = 'inactive', is_primary = false, updated_by = caller_id where practitioner_id = practitioner_record.id and status = 'active';
  foreach requested_specialty_id in array coalesce(p_specialty_ids, '{}') loop
    if not exists (select 1 from public.specialties s where s.id = requested_specialty_id and s.organization_id = practitioner_record.organization_id and s.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_SPECIALTY_FORBIDDEN'; end if;
    specialty_order := specialty_order + 1;
    insert into public.practitioner_specialty_assignments (organization_id, practitioner_id, specialty_id, status, is_primary, display_order, created_by, updated_by)
    values (practitioner_record.organization_id, practitioner_record.id, requested_specialty_id, 'active', specialty_order = 1, specialty_order, caller_id, caller_id)
    on conflict (practitioner_id, specialty_id) do update set status = 'active', is_primary = excluded.is_primary, display_order = excluded.display_order, updated_by = caller_id, updated_at = timezone('utc', now());
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.specialties_changed', 'practitioner', practitioner_record.id, true, jsonb_build_object('specialty_count', coalesce(array_length(p_specialty_ids, 1), 0)));
  return true;
end;
$$;

create or replace function public.set_practitioner_services(p_practitioner_id uuid, p_service_ids uuid[] default '{}', p_location_id uuid default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; requested_service_id uuid;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.manage_services') or practitioner_record.status in ('inactive', 'archived') then raise exception using errcode = '42501', message = 'PRACTITIONER_SERVICE_FORBIDDEN'; end if;
  if p_location_id is not null and not exists (select 1 from public.locations l where l.id = p_location_id and l.organization_id = practitioner_record.organization_id and l.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_LOCATION_FORBIDDEN'; end if;
  update public.practitioner_service_assignments assignment set status = 'inactive', updated_by = caller_id where assignment.practitioner_id = practitioner_record.id and assignment.location_id is not distinct from p_location_id and assignment.status = 'active';
  foreach requested_service_id in array coalesce(p_service_ids, '{}') loop
    if not exists (select 1 from public.services s where s.id = requested_service_id and s.organization_id = practitioner_record.organization_id and s.status = 'active') then raise exception using errcode = '42501', message = 'PRACTITIONER_SERVICE_FORBIDDEN'; end if;
    update public.practitioner_service_assignments assignment set status = 'active', updated_by = caller_id, updated_at = timezone('utc', now()) where assignment.practitioner_id = practitioner_record.id and assignment.service_id = requested_service_id and assignment.location_id is not distinct from p_location_id;
    if not found then
      insert into public.practitioner_service_assignments (organization_id, practitioner_id, service_id, location_id, status, created_by, updated_by)
      values (practitioner_record.organization_id, practitioner_record.id, requested_service_id, p_location_id, 'active', caller_id, caller_id);
    end if;
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.services_changed', 'practitioner', practitioner_record.id, true, jsonb_build_object('service_count', coalesce(array_length(p_service_ids, 1), 0), 'location_id', p_location_id));
  return true;
end;
$$;

create or replace function public.set_practitioner_languages(p_practitioner_id uuid, p_language_codes text[] default '{}')
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; language_code text; language_order integer := 0;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.update') or practitioner_record.status = 'archived' then raise exception using errcode = '42501', message = 'PRACTITIONER_LANGUAGE_FORBIDDEN'; end if;
  delete from public.practitioner_languages where practitioner_id = practitioner_record.id;
  foreach language_code in array coalesce(p_language_codes, '{}') loop
    if lower(language_code) !~ '^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$' then raise exception using errcode = '22023', message = 'PRACTITIONER_LANGUAGE_INVALID'; end if;
    language_order := language_order + 1;
    insert into public.practitioner_languages (organization_id, practitioner_id, language_code, is_primary, created_by, updated_by) values (practitioner_record.organization_id, practitioner_record.id, lower(language_code), language_order = 1, caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.languages_changed', 'practitioner', practitioner_record.id, true, jsonb_build_object('language_count', coalesce(array_length(p_language_codes, 1), 0)));
  return true;
end;
$$;

create or replace function public.update_practitioner_public_profile(p_practitioner_id uuid, p_display_name text default null, p_professional_title text default null, p_short_biography text default null, p_full_biography text default null, p_pronouns text default null, p_profile_image_reference text default null, p_accepting_new_clients boolean default false, p_visibility_status text default 'private', p_booking_visibility text default 'hidden', p_profile_slug text default null, p_seo_title text default null, p_seo_description text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype;
begin
  select p.* into practitioner_record from public.practitioners p where p.id = p_practitioner_id for update;
  if not found or not public.has_permission(practitioner_record.organization_id, 'practitioners.manage_public_profile') or practitioner_record.status = 'archived' then raise exception using errcode = '42501', message = 'PRACTITIONER_PUBLIC_PROFILE_FORBIDDEN'; end if;
  if p_visibility_status not in ('private', 'published') or p_booking_visibility not in ('hidden', 'visible') or (p_profile_slug is not null and p_profile_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') then raise exception using errcode = '22023', message = 'PRACTITIONER_PUBLIC_PROFILE_INVALID'; end if;
  insert into public.practitioner_public_profiles (organization_id, practitioner_id, display_name, professional_title, short_biography, full_biography, pronouns, profile_image_reference, accepting_new_clients, visibility_status, booking_visibility, profile_slug, seo_title, seo_description, created_by, updated_by)
  values (practitioner_record.organization_id, practitioner_record.id, p_display_name, p_professional_title, p_short_biography, p_full_biography, p_pronouns, p_profile_image_reference, p_accepting_new_clients, p_visibility_status, p_booking_visibility, p_profile_slug, p_seo_title, p_seo_description, caller_id, caller_id)
  on conflict (practitioner_id) do update set display_name = excluded.display_name, professional_title = excluded.professional_title, short_biography = excluded.short_biography, full_biography = excluded.full_biography, pronouns = excluded.pronouns, profile_image_reference = excluded.profile_image_reference, accepting_new_clients = excluded.accepting_new_clients, visibility_status = excluded.visibility_status, booking_visibility = excluded.booking_visibility, profile_slug = excluded.profile_slug, seo_title = excluded.seo_title, seo_description = excluded.seo_description, updated_by = caller_id, updated_at = timezone('utc', now());
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, practitioner_record.organization_id, 'practitioner.public_profile_updated', 'practitioner_public_profile', practitioner_record.id, true, jsonb_build_object('visibility_status', p_visibility_status, 'booking_visibility', p_booking_visibility));
  return true;
end;
$$;

revoke all on function public.create_practitioner(uuid, text, text, text, uuid, uuid[], uuid, uuid[], text[]) from public;
revoke all on function public.update_practitioner_profile(uuid, text, text, text) from public;
revoke all on function public.change_practitioner_status(uuid, text, text) from public;
revoke all on function public.link_practitioner_membership(uuid, uuid) from public;
revoke all on function public.unlink_practitioner_membership(uuid) from public;
revoke all on function public.set_practitioner_locations(uuid, uuid[], uuid) from public;
revoke all on function public.add_practitioner_credential(uuid, text, text, text, text, date, date, text, text, boolean) from public;
revoke all on function public.update_practitioner_credential(uuid, text, text, text, text, date, date, text, text, boolean) from public;
revoke all on function public.verify_practitioner_credential(uuid, text, text) from public;
revoke all on function public.set_practitioner_specialties(uuid, uuid[]) from public;
revoke all on function public.set_practitioner_services(uuid, uuid[], uuid) from public;
revoke all on function public.set_practitioner_languages(uuid, text[]) from public;
revoke all on function public.update_practitioner_public_profile(uuid, text, text, text, text, text, text, boolean, text, text, text, text, text) from public;
grant execute on function public.create_practitioner(uuid, text, text, text, uuid, uuid[], uuid, uuid[], text[]) to authenticated;
grant execute on function public.update_practitioner_profile(uuid, text, text, text) to authenticated;
grant execute on function public.change_practitioner_status(uuid, text, text) to authenticated;
grant execute on function public.link_practitioner_membership(uuid, uuid) to authenticated;
grant execute on function public.unlink_practitioner_membership(uuid) to authenticated;
grant execute on function public.set_practitioner_locations(uuid, uuid[], uuid) to authenticated;
grant execute on function public.add_practitioner_credential(uuid, text, text, text, text, date, date, text, text, boolean) to authenticated;
grant execute on function public.update_practitioner_credential(uuid, text, text, text, text, date, date, text, text, boolean) to authenticated;
grant execute on function public.verify_practitioner_credential(uuid, text, text) to authenticated;
grant execute on function public.set_practitioner_specialties(uuid, uuid[]) to authenticated;
grant execute on function public.set_practitioner_services(uuid, uuid[], uuid) to authenticated;
grant execute on function public.set_practitioner_languages(uuid, text[]) to authenticated;
grant execute on function public.update_practitioner_public_profile(uuid, text, text, text, text, text, text, boolean, text, text, text, text, text) to authenticated;

alter table public.practitioners enable row level security;
alter table public.practitioner_location_assignments enable row level security;
alter table public.practitioner_credentials enable row level security;
alter table public.specialties enable row level security;
alter table public.practitioner_specialty_assignments enable row level security;
alter table public.services enable row level security;
alter table public.practitioner_service_assignments enable row level security;
alter table public.practitioner_languages enable row level security;
alter table public.practitioner_public_profiles enable row level security;

grant select on public.practitioners, public.practitioner_location_assignments, public.practitioner_credentials, public.specialties, public.practitioner_specialty_assignments, public.services, public.practitioner_service_assignments, public.practitioner_languages, public.practitioner_public_profiles to authenticated;

create policy practitioners_select_read on public.practitioners for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioners_insert_denied on public.practitioners for insert to authenticated with check (false);
create policy practitioners_update_denied on public.practitioners for update to authenticated using (false) with check (false);
create policy practitioners_delete_denied on public.practitioners for delete to authenticated using (false);
create policy practitioner_location_select_read on public.practitioner_location_assignments for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_location_insert_denied on public.practitioner_location_assignments for insert to authenticated with check (false);
create policy practitioner_location_update_denied on public.practitioner_location_assignments for update to authenticated using (false) with check (false);
create policy practitioner_location_delete_denied on public.practitioner_location_assignments for delete to authenticated using (false);
create policy practitioner_credentials_select_read on public.practitioner_credentials for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_credentials_insert_denied on public.practitioner_credentials for insert to authenticated with check (false);
create policy practitioner_credentials_update_denied on public.practitioner_credentials for update to authenticated using (false) with check (false);
create policy practitioner_credentials_delete_denied on public.practitioner_credentials for delete to authenticated using (false);
create policy specialties_select_read on public.specialties for select to authenticated using (public.has_permission(organization_id, 'practitioners.read') or public.has_permission(organization_id, 'practitioners.update'));
create policy specialties_insert_denied on public.specialties for insert to authenticated with check (false);
create policy specialties_update_denied on public.specialties for update to authenticated using (false) with check (false);
create policy specialties_delete_denied on public.specialties for delete to authenticated using (false);
create policy practitioner_specialty_select_read on public.practitioner_specialty_assignments for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_specialty_insert_denied on public.practitioner_specialty_assignments for insert to authenticated with check (false);
create policy practitioner_specialty_update_denied on public.practitioner_specialty_assignments for update to authenticated using (false) with check (false);
create policy practitioner_specialty_delete_denied on public.practitioner_specialty_assignments for delete to authenticated using (false);
create policy services_select_read on public.services for select to authenticated using (public.has_permission(organization_id, 'services.read') or public.has_permission(organization_id, 'practitioners.read'));
create policy services_insert_denied on public.services for insert to authenticated with check (false);
create policy services_update_denied on public.services for update to authenticated using (false) with check (false);
create policy services_delete_denied on public.services for delete to authenticated using (false);
create policy practitioner_service_select_read on public.practitioner_service_assignments for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_service_insert_denied on public.practitioner_service_assignments for insert to authenticated with check (false);
create policy practitioner_service_update_denied on public.practitioner_service_assignments for update to authenticated using (false) with check (false);
create policy practitioner_service_delete_denied on public.practitioner_service_assignments for delete to authenticated using (false);
create policy practitioner_languages_select_read on public.practitioner_languages for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_languages_insert_denied on public.practitioner_languages for insert to authenticated with check (false);
create policy practitioner_languages_update_denied on public.practitioner_languages for update to authenticated using (false) with check (false);
create policy practitioner_languages_delete_denied on public.practitioner_languages for delete to authenticated using (false);
create policy practitioner_public_profile_select_read on public.practitioner_public_profiles for select to authenticated using (public.has_permission(organization_id, 'practitioners.read'));
create policy practitioner_public_profile_insert_denied on public.practitioner_public_profiles for insert to authenticated with check (false);
create policy practitioner_public_profile_update_denied on public.practitioner_public_profiles for update to authenticated using (false) with check (false);
create policy practitioner_public_profile_delete_denied on public.practitioner_public_profiles for delete to authenticated using (false);

comment on table public.practitioners is 'Organization-owned professional profile; separate from Auth identity and organization membership.';
comment on table public.practitioner_credentials is 'Sensitive credential metadata; verification changes require a protected RPC.';
comment on function public.verify_practitioner_credential(uuid, text, text) is 'Protected manual credential verification; never accepts document contents or logs credential numbers.';
comment on function public.update_practitioner_public_profile(uuid, text, text, text, text, text, text, boolean, text, text, text, text, text) is 'Private-by-default public-profile readiness; publication is not a public route in this phase.';
