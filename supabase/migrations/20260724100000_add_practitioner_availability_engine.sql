insert into public.permissions (key, domain, action, description)
values
  ('availability.read', 'availability', 'read', 'Read practitioner availability'),
  ('availability.manage', 'availability', 'manage', 'Manage practitioner availability'),
  ('availability.preview', 'availability', 'preview', 'Preview practitioner availability')
on conflict (key) do update set description = excluded.description, status = 'active';

do $$
declare
  permission_key text;
begin
  foreach permission_key in array array['availability.read', 'availability.manage', 'availability.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key in ('organization.owner', 'organization.admin') and r.organization_id is null
    on conflict do nothing;
  end loop;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'clinic.admin' and r.organization_id is null
    and p.key in ('availability.read', 'availability.manage', 'availability.preview')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'location.manager' and r.organization_id is null
    and p.key in ('availability.read', 'availability.manage', 'availability.preview')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'practitioner' and r.organization_id is null
    and p.key in ('availability.read', 'availability.preview')
  on conflict do nothing;
end $$;

create table public.practitioner_availability_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  timezone text not null check (char_length(btrim(timezone)) between 1 and 64),
  status text not null default 'active' check (status in ('active', 'inactive')),
  effective_from date,
  effective_to date,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint availability_template_dates check (effective_to is null or effective_from is null or effective_to >= effective_from),
  constraint availability_template_practitioner_fk foreign key (practitioner_id, organization_id)
    references public.practitioners (id, organization_id) on delete cascade
);

create table public.practitioner_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  template_id uuid not null references public.practitioner_availability_templates (id) on delete cascade,
  practitioner_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  mode text not null default 'mixed' check (mode in ('virtual', 'in_person', 'mixed')),
  location_id uuid,
  service_id uuid,
  capacity_hint integer not null default 1 check (capacity_hint between 1 and 100),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint availability_block_time_check check (end_time > start_time),
  constraint availability_block_template_fk foreign key (template_id) references public.practitioner_availability_templates (id) on delete cascade,
  constraint availability_block_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade,
  constraint availability_block_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict,
  constraint availability_block_service_fk foreign key (service_id, organization_id) references public.services (id, organization_id) on delete restrict
);

create table public.practitioner_breaks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  block_id uuid not null references public.practitioner_availability_blocks (id) on delete cascade,
  practitioner_id uuid not null,
  start_time time not null,
  end_time time not null,
  label text not null check (char_length(btrim(label)) between 1 and 160),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_break_time_check check (end_time > start_time),
  constraint practitioner_break_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade
);

create table public.practitioner_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  override_date date not null,
  kind text not null check (kind in ('available', 'unavailable')),
  start_time time,
  end_time time,
  mode text not null default 'mixed' check (mode in ('virtual', 'in_person', 'mixed')),
  location_id uuid,
  service_id uuid,
  reason text check (reason is null or char_length(reason) <= 500),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_override_time_check check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time > start_time)),
  constraint practitioner_override_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_override_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict,
  constraint practitioner_override_service_fk foreign key (service_id, organization_id) references public.services (id, organization_id) on delete restrict
);

create table public.practitioner_time_off (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  category text not null check (category in ('vacation', 'sick', 'holiday', 'other')),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  all_day boolean not null default true,
  reason text check (reason is null or char_length(reason) <= 500),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_time_off_dates check (end_date >= start_date),
  constraint practitioner_time_off_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade
);

create table public.organization_holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  holiday_date date not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  location_id uuid,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_holiday_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict,
  constraint organization_holiday_unique unique (organization_id, holiday_date, location_id)
);

create table public.practitioner_location_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  location_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  mode text not null default 'in_person' check (mode in ('in_person', 'mixed')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_location_availability_time_check check (end_time > start_time),
  constraint practitioner_location_availability_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_location_availability_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict
);

create table public.practitioner_service_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  practitioner_id uuid not null,
  service_id uuid not null,
  location_id uuid,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  mode text not null default 'mixed' check (mode in ('virtual', 'in_person', 'mixed')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint practitioner_service_availability_time_check check (end_time > start_time),
  constraint practitioner_service_availability_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete cascade,
  constraint practitioner_service_availability_service_fk foreign key (service_id, organization_id) references public.services (id, organization_id) on delete restrict,
  constraint practitioner_service_availability_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict
);

create index practitioner_availability_templates_scope_idx on public.practitioner_availability_templates (organization_id, practitioner_id, status);
create index practitioner_availability_blocks_scope_idx on public.practitioner_availability_blocks (organization_id, practitioner_id, weekday);
create index practitioner_breaks_block_idx on public.practitioner_breaks (organization_id, block_id);
create index practitioner_overrides_scope_idx on public.practitioner_schedule_overrides (organization_id, practitioner_id, override_date);
create index practitioner_time_off_scope_idx on public.practitioner_time_off (organization_id, practitioner_id, start_date, end_date, status);
create index organization_holidays_scope_idx on public.organization_holidays (organization_id, holiday_date, status);
create index practitioner_location_availability_scope_idx on public.practitioner_location_availability (organization_id, practitioner_id, location_id, weekday);
create index practitioner_service_availability_scope_idx on public.practitioner_service_availability (organization_id, practitioner_id, service_id, weekday);

create or replace function public.validate_practitioner_availability_row()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare existing_row record; block_row public.practitioner_availability_blocks%rowtype;
begin
  if tg_table_name = 'practitioner_availability_blocks' then
    if not exists (select 1 from public.practitioner_availability_templates t where t.id = new.template_id and t.organization_id = new.organization_id and t.practitioner_id = new.practitioner_id) then raise exception using errcode = '23514', message = 'AVAILABILITY_TEMPLATE_MISMATCH'; end if;
    if new.mode = 'in_person' and new.location_id is null then raise exception using errcode = '23514', message = 'IN_PERSON_LOCATION_REQUIRED'; end if;
    if new.location_id is not null and not exists (select 1 from public.practitioner_location_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.location_id = new.location_id and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_LOCATION_NOT_ASSIGNED'; end if;
    if new.service_id is not null and not exists (select 1 from public.practitioner_service_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.service_id = new.service_id and (a.location_id is null or a.location_id = new.location_id) and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_SERVICE_NOT_ASSIGNED'; end if;
    if exists (select 1 from public.practitioner_availability_blocks b where b.template_id = new.template_id and b.id <> new.id and b.weekday = new.weekday and new.start_time < b.end_time and new.end_time > b.start_time) then raise exception using errcode = '23P01', message = 'AVAILABILITY_BLOCK_OVERLAP'; end if;
  elsif tg_table_name = 'practitioner_breaks' then
    select * into block_row from public.practitioner_availability_blocks where id = new.block_id and organization_id = new.organization_id and practitioner_id = new.practitioner_id;
    if not found or new.start_time < block_row.start_time or new.end_time > block_row.end_time then raise exception using errcode = '23514', message = 'BREAK_OUTSIDE_BLOCK'; end if;
    if exists (select 1 from public.practitioner_breaks b where b.block_id = new.block_id and b.id <> new.id and new.start_time < b.end_time and new.end_time > b.start_time) then raise exception using errcode = '23P01', message = 'BREAK_OVERLAP'; end if;
  elsif tg_table_name = 'practitioner_schedule_overrides' then
    if new.mode = 'in_person' and new.location_id is null then raise exception using errcode = '23514', message = 'IN_PERSON_LOCATION_REQUIRED'; end if;
    if new.location_id is not null and not exists (select 1 from public.practitioner_location_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.location_id = new.location_id and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_LOCATION_NOT_ASSIGNED'; end if;
    if new.service_id is not null and not exists (select 1 from public.practitioner_service_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.service_id = new.service_id and (a.location_id is null or a.location_id = new.location_id) and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_SERVICE_NOT_ASSIGNED'; end if;
    if exists (select 1 from public.practitioner_schedule_overrides o where o.practitioner_id = new.practitioner_id and o.id <> new.id and o.override_date = new.override_date and (new.start_time is null or o.start_time is null or (new.start_time < o.end_time and new.end_time > o.start_time))) then raise exception using errcode = '23P01', message = 'AVAILABILITY_OVERRIDE_OVERLAP'; end if;
  elsif tg_table_name = 'practitioner_location_availability' then
    if not exists (select 1 from public.practitioner_location_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.location_id = new.location_id and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_LOCATION_NOT_ASSIGNED'; end if;
    if exists (select 1 from public.practitioner_location_availability a where a.practitioner_id = new.practitioner_id and a.location_id = new.location_id and a.id <> new.id and a.weekday = new.weekday and new.start_time < a.end_time and new.end_time > a.start_time) then raise exception using errcode = '23P01', message = 'LOCATION_AVAILABILITY_OVERLAP'; end if;
  elsif tg_table_name = 'practitioner_service_availability' then
    if not exists (select 1 from public.practitioner_service_assignments a where a.practitioner_id = new.practitioner_id and a.organization_id = new.organization_id and a.service_id = new.service_id and (a.location_id is null or a.location_id = new.location_id) and a.status = 'active') then raise exception using errcode = '23503', message = 'AVAILABILITY_SERVICE_NOT_ASSIGNED'; end if;
    if exists (select 1 from public.practitioner_service_availability a where a.practitioner_id = new.practitioner_id and a.service_id = new.service_id and a.id <> new.id and a.weekday = new.weekday and coalesce(a.location_id, new.location_id) is not distinct from coalesce(new.location_id, a.location_id) and new.start_time < a.end_time and new.end_time > a.start_time) then raise exception using errcode = '23P01', message = 'SERVICE_AVAILABILITY_OVERLAP'; end if;
  end if;
  return new;
end;
$$;

create trigger validate_availability_blocks before insert or update on public.practitioner_availability_blocks for each row execute function public.validate_practitioner_availability_row();
create trigger validate_practitioner_breaks before insert or update on public.practitioner_breaks for each row execute function public.validate_practitioner_availability_row();
create trigger validate_availability_overrides before insert or update on public.practitioner_schedule_overrides for each row execute function public.validate_practitioner_availability_row();
create trigger validate_location_availability before insert or update on public.practitioner_location_availability for each row execute function public.validate_practitioner_availability_row();
create trigger validate_service_availability before insert or update on public.practitioner_service_availability for each row execute function public.validate_practitioner_availability_row();

create trigger practitioner_availability_templates_set_updated_at before update on public.practitioner_availability_templates for each row execute function public.set_updated_at();
create trigger practitioner_availability_blocks_set_updated_at before update on public.practitioner_availability_blocks for each row execute function public.set_updated_at();
create trigger practitioner_breaks_set_updated_at before update on public.practitioner_breaks for each row execute function public.set_updated_at();
create trigger practitioner_schedule_overrides_set_updated_at before update on public.practitioner_schedule_overrides for each row execute function public.set_updated_at();
create trigger practitioner_time_off_set_updated_at before update on public.practitioner_time_off for each row execute function public.set_updated_at();
create trigger organization_holidays_set_updated_at before update on public.organization_holidays for each row execute function public.set_updated_at();
create trigger practitioner_location_availability_set_updated_at before update on public.practitioner_location_availability for each row execute function public.set_updated_at();
create trigger practitioner_service_availability_set_updated_at before update on public.practitioner_service_availability for each row execute function public.set_updated_at();

create or replace function public.availability_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select public.has_permission(target_organization_id, 'availability.' || required_action) $$;

create or replace function public.create_practitioner_availability_schedule(p_organization_id uuid, p_practitioner_id uuid, p_name text, p_timezone text, p_blocks jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); template_id uuid; block jsonb;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_MANAGE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'AVAILABILITY_PRACTITIONER_FORBIDDEN'; end if;
  insert into public.practitioner_availability_templates (organization_id, practitioner_id, name, timezone, created_by, updated_by) values (p_organization_id, p_practitioner_id, btrim(p_name), btrim(p_timezone), caller_id, caller_id) returning id into template_id;
  for block in select * from jsonb_array_elements(coalesce(p_blocks, '[]'::jsonb)) loop
    insert into public.practitioner_availability_blocks (organization_id, template_id, practitioner_id, weekday, start_time, end_time, mode, location_id, service_id, capacity_hint, created_by, updated_by)
    values (p_organization_id, template_id, p_practitioner_id, (block->>'weekday')::smallint, (block->>'startTime')::time, (block->>'endTime')::time, coalesce(block->>'mode', 'mixed'), nullif(block->>'locationId', '')::uuid, nullif(block->>'serviceId', '')::uuid, coalesce((block->>'capacityHint')::integer, 1), caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_schedule_created', 'availability_template', template_id, true, jsonb_build_object('block_count', jsonb_array_length(coalesce(p_blocks, '[]'::jsonb)), 'timezone', p_timezone));
  return template_id;
end;
$$;

create or replace function public.update_practitioner_availability_schedule(p_template_id uuid, p_name text, p_timezone text, p_blocks jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); template_record public.practitioner_availability_templates%rowtype; block jsonb;
begin
  select * into template_record from public.practitioner_availability_templates where id = p_template_id for update;
  if not found or not public.availability_permission(template_record.organization_id, 'manage') or template_record.status = 'inactive' then raise exception using errcode = '42501', message = 'AVAILABILITY_UPDATE_FORBIDDEN'; end if;
  update public.practitioner_availability_templates set name = btrim(p_name), timezone = btrim(p_timezone), updated_by = caller_id where id = p_template_id;
  delete from public.practitioner_availability_blocks where template_id = p_template_id;
  for block in select * from jsonb_array_elements(coalesce(p_blocks, '[]'::jsonb)) loop
    insert into public.practitioner_availability_blocks (organization_id, template_id, practitioner_id, weekday, start_time, end_time, mode, location_id, service_id, capacity_hint, created_by, updated_by)
    values (template_record.organization_id, p_template_id, template_record.practitioner_id, (block->>'weekday')::smallint, (block->>'startTime')::time, (block->>'endTime')::time, coalesce(block->>'mode', 'mixed'), nullif(block->>'locationId', '')::uuid, nullif(block->>'serviceId', '')::uuid, coalesce((block->>'capacityHint')::integer, 1), caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, template_record.organization_id, 'practitioner.availability_schedule_updated', 'availability_template', p_template_id, true, jsonb_build_object('block_count', jsonb_array_length(coalesce(p_blocks, '[]'::jsonb)), 'timezone', p_timezone));
  return true;
end;
$$;

create or replace function public.remove_practitioner_availability_schedule(p_template_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); template_record public.practitioner_availability_templates%rowtype;
begin
  select * into template_record from public.practitioner_availability_templates where id = p_template_id for update;
  if not found or not public.availability_permission(template_record.organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_REMOVE_FORBIDDEN'; end if;
  update public.practitioner_availability_templates set status = 'inactive', updated_by = caller_id where id = p_template_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, template_record.organization_id, 'practitioner.availability_schedule_removed', 'availability_template', p_template_id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.add_practitioner_schedule_override(p_organization_id uuid, p_practitioner_id uuid, p_override_date date, p_kind text, p_start_time time default null, p_end_time time default null, p_mode text default 'mixed', p_location_id uuid default null, p_service_id uuid default null, p_reason text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); override_id uuid;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_MANAGE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'AVAILABILITY_PRACTITIONER_FORBIDDEN'; end if;
  insert into public.practitioner_schedule_overrides (organization_id, practitioner_id, override_date, kind, start_time, end_time, mode, location_id, service_id, reason, created_by, updated_by) values (p_organization_id, p_practitioner_id, p_override_date, p_kind, p_start_time, p_end_time, p_mode, p_location_id, p_service_id, nullif(btrim(p_reason), ''), caller_id, caller_id) returning id into override_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_override_created', 'availability_override', override_id, true, jsonb_build_object('override_date', p_override_date, 'kind', p_kind));
  return override_id;
end;
$$;

create or replace function public.remove_practitioner_schedule_override(p_override_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); override_record public.practitioner_schedule_overrides%rowtype;
begin
  select * into override_record from public.practitioner_schedule_overrides where id = p_override_id for update;
  if not found or not public.availability_permission(override_record.organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_REMOVE_FORBIDDEN'; end if;
  delete from public.practitioner_schedule_overrides where id = p_override_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, override_record.organization_id, 'practitioner.availability_override_removed', 'availability_override', p_override_id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.add_practitioner_break(p_organization_id uuid, p_block_id uuid, p_start_time time, p_end_time time, p_label text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); block_record public.practitioner_availability_blocks%rowtype; break_id uuid;
begin
  select * into block_record from public.practitioner_availability_blocks where id = p_block_id and organization_id = p_organization_id;
  if not found or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_BREAK_FORBIDDEN'; end if;
  insert into public.practitioner_breaks (organization_id, block_id, practitioner_id, start_time, end_time, label, created_by, updated_by) values (p_organization_id, p_block_id, block_record.practitioner_id, p_start_time, p_end_time, btrim(p_label), caller_id, caller_id) returning id into break_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_break_created', 'availability_break', break_id, true, '{}'::jsonb);
  return break_id;
end;
$$;

create or replace function public.remove_practitioner_break(p_break_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); break_record public.practitioner_breaks%rowtype;
begin
  select * into break_record from public.practitioner_breaks where id = p_break_id for update;
  if not found or not public.availability_permission(break_record.organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_BREAK_FORBIDDEN'; end if;
  delete from public.practitioner_breaks where id = p_break_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, break_record.organization_id, 'practitioner.availability_break_removed', 'availability_break', p_break_id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.create_practitioner_time_off(p_organization_id uuid, p_practitioner_id uuid, p_category text, p_start_date date, p_end_date date, p_reason text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); time_off_id uuid;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_MANAGE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'AVAILABILITY_PRACTITIONER_FORBIDDEN'; end if;
  insert into public.practitioner_time_off (organization_id, practitioner_id, category, start_date, end_date, reason, created_by, updated_by) values (p_organization_id, p_practitioner_id, p_category, p_start_date, p_end_date, nullif(btrim(p_reason), ''), caller_id, caller_id) returning id into time_off_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_vacation_created', 'practitioner_time_off', time_off_id, true, jsonb_build_object('category', p_category, 'start_date', p_start_date, 'end_date', p_end_date));
  return time_off_id;
end;
$$;

create or replace function public.cancel_practitioner_time_off(p_time_off_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); time_off_record public.practitioner_time_off%rowtype;
begin
  select * into time_off_record from public.practitioner_time_off where id = p_time_off_id for update;
  if not found or not public.availability_permission(time_off_record.organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_TIME_OFF_FORBIDDEN'; end if;
  update public.practitioner_time_off set status = 'cancelled', updated_by = caller_id where id = p_time_off_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, time_off_record.organization_id, 'practitioner.availability_vacation_cancelled', 'practitioner_time_off', p_time_off_id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.set_practitioner_location_availability(p_organization_id uuid, p_practitioner_id uuid, p_rows jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); row_value jsonb;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_MANAGE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'AVAILABILITY_PRACTITIONER_FORBIDDEN'; end if;
  delete from public.practitioner_location_availability where organization_id = p_organization_id and practitioner_id = p_practitioner_id;
  for row_value in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into public.practitioner_location_availability (organization_id, practitioner_id, location_id, weekday, start_time, end_time, mode, created_by, updated_by) values (p_organization_id, p_practitioner_id, (row_value->>'locationId')::uuid, (row_value->>'weekday')::smallint, (row_value->>'startTime')::time, (row_value->>'endTime')::time, coalesce(row_value->>'mode', 'in_person'), caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_locations_changed', 'practitioner_location_availability', p_practitioner_id, true, jsonb_build_object('row_count', jsonb_array_length(coalesce(p_rows, '[]'::jsonb))));
  return true;
end;
$$;

create or replace function public.set_practitioner_service_availability(p_organization_id uuid, p_practitioner_id uuid, p_rows jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); row_value jsonb;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_MANAGE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'AVAILABILITY_PRACTITIONER_FORBIDDEN'; end if;
  delete from public.practitioner_service_availability where organization_id = p_organization_id and practitioner_id = p_practitioner_id;
  for row_value in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into public.practitioner_service_availability (organization_id, practitioner_id, service_id, location_id, weekday, start_time, end_time, mode, created_by, updated_by) values (p_organization_id, p_practitioner_id, (row_value->>'serviceId')::uuid, nullif(row_value->>'locationId', '')::uuid, (row_value->>'weekday')::smallint, (row_value->>'startTime')::time, (row_value->>'endTime')::time, coalesce(row_value->>'mode', 'mixed'), caller_id, caller_id);
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_services_changed', 'practitioner_service_availability', p_practitioner_id, true, jsonb_build_object('row_count', jsonb_array_length(coalesce(p_rows, '[]'::jsonb))));
  return true;
end;
$$;

create or replace function public.update_organization_holiday(p_organization_id uuid, p_holiday_id uuid, p_holiday_date date, p_name text, p_location_id uuid default null, p_status text default 'active')
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); holiday_id uuid;
begin
  if caller_id is null or not public.availability_permission(p_organization_id, 'manage') then raise exception using errcode = '42501', message = 'AVAILABILITY_HOLIDAY_FORBIDDEN'; end if;
  insert into public.organization_holidays (id, organization_id, holiday_date, name, location_id, status, created_by, updated_by) values (coalesce(p_holiday_id, gen_random_uuid()), p_organization_id, p_holiday_date, btrim(p_name), p_location_id, p_status, caller_id, caller_id)
  on conflict (id) do update set holiday_date = excluded.holiday_date, name = excluded.name, location_id = excluded.location_id, status = excluded.status, updated_by = caller_id returning id into holiday_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'practitioner.availability_holiday_updated', 'organization_holiday', holiday_id, true, jsonb_build_object('holiday_date', p_holiday_date, 'status', p_status));
  return holiday_id;
end;
$$;

create or replace function public.append_availability_segments(p_result jsonb, p_date date, p_start_time time, p_end_time time, p_mode text, p_location_id uuid, p_service_id uuid, p_timezone text, p_source text, p_block_id uuid default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare result jsonb := coalesce(p_result, '[]'::jsonb); segment_start time := p_start_time; break_record record;
begin
  if p_block_id is not null then
    for break_record in select b.start_time, b.end_time from public.practitioner_breaks b where b.block_id = p_block_id order by b.start_time loop
      if break_record.start_time > segment_start then result := result || jsonb_build_array(jsonb_build_object('date', p_date, 'startTime', segment_start, 'endTime', least(break_record.start_time, p_end_time), 'mode', p_mode, 'locationId', p_location_id, 'serviceId', p_service_id, 'timezone', p_timezone, 'source', p_source)); end if;
      segment_start := greatest(segment_start, break_record.end_time);
    end loop;
  end if;
  if segment_start < p_end_time then result := result || jsonb_build_array(jsonb_build_object('date', p_date, 'startTime', segment_start, 'endTime', p_end_time, 'mode', p_mode, 'locationId', p_location_id, 'serviceId', p_service_id, 'timezone', p_timezone, 'source', p_source)); end if;
  return result;
end;
$$;

create or replace function public.preview_practitioner_availability(p_practitioner_id uuid, p_start_date date, p_end_date date, p_location_id uuid default null, p_service_id uuid default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); practitioner_record public.practitioners%rowtype; template_record record; block_record record; override_record record; result jsonb := '[]'::jsonb; current_date_value date; has_available_override boolean; has_unavailable_override boolean;
begin
  select * into practitioner_record from public.practitioners where id = p_practitioner_id;
  if not found or caller_id is null or not public.availability_permission(practitioner_record.organization_id, 'preview') then raise exception using errcode = '42501', message = 'AVAILABILITY_PREVIEW_FORBIDDEN'; end if;
  if p_end_date < p_start_date or p_end_date - p_start_date > 366 then raise exception using errcode = '22023', message = 'AVAILABILITY_PREVIEW_RANGE_INVALID'; end if;
  if practitioner_record.status <> 'active' then return '[]'::jsonb; end if;
  for current_date_value in select generate_series(p_start_date, p_end_date, interval '1 day')::date loop
    if exists (select 1 from public.organization_holidays h where h.organization_id = practitioner_record.organization_id and h.holiday_date = current_date_value and h.status = 'active' and (h.location_id is null or h.location_id = p_location_id)) then continue; end if;
    if exists (select 1 from public.practitioner_time_off t where t.practitioner_id = p_practitioner_id and t.organization_id = practitioner_record.organization_id and t.status = 'active' and current_date_value between t.start_date and t.end_date) then continue; end if;
    has_unavailable_override := exists (select 1 from public.practitioner_schedule_overrides o where o.practitioner_id = p_practitioner_id and o.organization_id = practitioner_record.organization_id and o.override_date = current_date_value and o.kind = 'unavailable' and o.start_time is null);
    if has_unavailable_override then continue; end if;
    has_available_override := exists (select 1 from public.practitioner_schedule_overrides o where o.practitioner_id = p_practitioner_id and o.organization_id = practitioner_record.organization_id and o.override_date = current_date_value and o.kind = 'available');
    for template_record in select t.* from public.practitioner_availability_templates t where t.practitioner_id = p_practitioner_id and t.organization_id = practitioner_record.organization_id and t.status = 'active' and (t.effective_from is null or current_date_value >= t.effective_from) and (t.effective_to is null or current_date_value <= t.effective_to) order by t.created_at desc limit 1 loop
      if has_available_override then
        for override_record in select o.* from public.practitioner_schedule_overrides o where o.practitioner_id = p_practitioner_id and o.organization_id = practitioner_record.organization_id and o.override_date = current_date_value and o.kind = 'available' and (p_location_id is null or o.location_id is null or o.location_id = p_location_id) and (p_service_id is null or o.service_id is null or o.service_id = p_service_id) loop
          if override_record.start_time is not null then result := public.append_availability_segments(result, current_date_value, override_record.start_time, override_record.end_time, override_record.mode, override_record.location_id, override_record.service_id, template_record.timezone, 'override'); end if;
        end loop;
      else
        for block_record in select b.* from public.practitioner_availability_blocks b where b.template_id = template_record.id and b.weekday = extract(dow from current_date_value)::smallint and (p_location_id is null or b.location_id is null or b.location_id = p_location_id) and (p_service_id is null or b.service_id is null or b.service_id = p_service_id) order by b.start_time loop
          result := public.append_availability_segments(result, current_date_value, block_record.start_time, block_record.end_time, block_record.mode, block_record.location_id, block_record.service_id, template_record.timezone, 'recurring', block_record.id);
        end loop;
      end if;
    end loop;
  end loop;
  return result;
end;
$$;

revoke all on function public.validate_practitioner_availability_row() from public;
revoke all on function public.availability_permission(uuid, text) from public;
revoke all on function public.append_availability_segments(jsonb, date, time, time, text, uuid, uuid, text, text, uuid) from public;
grant execute on function public.availability_permission(uuid, text) to authenticated;
grant execute on function public.create_practitioner_availability_schedule(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.update_practitioner_availability_schedule(uuid, text, text, jsonb) to authenticated;
grant execute on function public.remove_practitioner_availability_schedule(uuid) to authenticated;
grant execute on function public.add_practitioner_schedule_override(uuid, uuid, date, text, time, time, text, uuid, uuid, text) to authenticated;
grant execute on function public.remove_practitioner_schedule_override(uuid) to authenticated;
grant execute on function public.add_practitioner_break(uuid, uuid, time, time, text) to authenticated;
grant execute on function public.remove_practitioner_break(uuid) to authenticated;
grant execute on function public.create_practitioner_time_off(uuid, uuid, text, date, date, text) to authenticated;
grant execute on function public.cancel_practitioner_time_off(uuid) to authenticated;
grant execute on function public.set_practitioner_location_availability(uuid, uuid, jsonb) to authenticated;
grant execute on function public.set_practitioner_service_availability(uuid, uuid, jsonb) to authenticated;
grant execute on function public.update_organization_holiday(uuid, uuid, date, text, uuid, text) to authenticated;
grant execute on function public.preview_practitioner_availability(uuid, date, date, uuid, uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['practitioner_availability_templates', 'practitioner_availability_blocks', 'practitioner_breaks', 'practitioner_schedule_overrides', 'practitioner_time_off', 'organization_holidays', 'practitioner_location_availability', 'practitioner_service_availability'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.availability_permission(organization_id, ''read''))', table_name || '_availability', table_name);
    execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check (false)', table_name || '_availability', table_name);
    execute format('create policy %I_update_denied on public.%I for update to authenticated using (false) with check (false)', table_name || '_availability', table_name);
    execute format('create policy %I_delete_denied on public.%I for delete to authenticated using (false)', table_name || '_availability', table_name);
  end loop;
end $$;

comment on table public.practitioner_availability_templates is 'Recurring weekly availability templates. No appointments or booking state are stored here.';
comment on table public.practitioner_schedule_overrides is 'Date-specific availability exceptions; external calendar busy-time imports may use this boundary later.';
comment on function public.preview_practitioner_availability(uuid, date, date, uuid, uuid) is 'Deterministic availability-only preview. Appointment conflicts and capacity allocation belong to future scheduling.';
