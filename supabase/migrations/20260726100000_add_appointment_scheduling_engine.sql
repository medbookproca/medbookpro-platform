insert into public.permissions (key, domain, action, description)
values
  ('appointments.read', 'appointments', 'read', 'Read appointments'),
  ('appointments.create', 'appointments', 'create', 'Create appointments'),
  ('appointments.update', 'appointments', 'update', 'Update appointments'),
  ('appointments.cancel', 'appointments', 'cancel', 'Cancel appointments'),
  ('appointments.checkin', 'appointments', 'checkin', 'Check patients in'),
  ('appointments.complete', 'appointments', 'complete', 'Complete appointments'),
  ('appointments.preview', 'appointments', 'preview', 'Preview appointment conflicts')
on conflict (key) do update set description = excluded.description, status = 'active';

do $$
declare permission_key text;
begin
  foreach permission_key in array array['appointments.read', 'appointments.create', 'appointments.update', 'appointments.cancel', 'appointments.checkin', 'appointments.complete', 'appointments.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key in ('organization.owner', 'organization.admin') and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['appointments.read', 'appointments.create', 'appointments.update', 'appointments.cancel', 'appointments.checkin', 'appointments.complete', 'appointments.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'clinic.admin' and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['appointments.read', 'appointments.create', 'appointments.update', 'appointments.cancel', 'appointments.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'location.manager' and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['appointments.read', 'appointments.create', 'appointments.cancel', 'appointments.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'receptionist' and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['appointments.read', 'appointments.preview'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'practitioner' and r.organization_id is null
    on conflict do nothing;
  end loop;
end $$;

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  practitioner_id uuid not null,
  location_id uuid not null,
  service_id uuid not null,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  appointment_type text not null default 'in_person' check (appointment_type in ('in_person', 'virtual', 'hybrid')),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  timezone text not null check (char_length(btrim(timezone)) between 1 and 64),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  pre_buffer_minutes integer not null default 0 check (pre_buffer_minutes between 0 and 1440),
  post_buffer_minutes integer not null default 0 check (post_buffer_minutes between 0 and 1440),
  actual_start timestamptz,
  actual_end timestamptz,
  delay_minutes integer check (delay_minutes is null or delay_minutes >= 0),
  completed_at timestamptz,
  cancellation_reason text check (cancellation_reason is null or char_length(btrim(cancellation_reason)) <= 500),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint appointments_id_organization_unique unique (id, organization_id),
  constraint appointments_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint appointments_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete restrict,
  constraint appointments_location_fk foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete restrict,
  constraint appointments_service_fk foreign key (service_id, organization_id) references public.services (id, organization_id) on delete restrict,
  constraint appointments_time_check check (scheduled_end > scheduled_start and scheduled_end = scheduled_start + make_interval(mins => duration_minutes)),
  constraint appointments_actual_time_check check (actual_end is null or actual_start is null or actual_end >= actual_start),
  constraint appointments_completed_check check ((status = 'completed') = (completed_at is not null))
);

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  appointment_id uuid not null,
  from_status text,
  to_status text not null check (to_status in ('draft', 'scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  changed_by uuid references public.profiles (id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointment_status_history_appointment_fk foreign key (appointment_id, organization_id) references public.appointments (id, organization_id) on delete cascade
);

create table public.appointment_buffers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  appointment_id uuid not null,
  buffer_kind text not null check (buffer_kind in ('pre', 'post')),
  minutes integer not null check (minutes between 0 and 1440),
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointment_buffers_unique unique (appointment_id, buffer_kind),
  constraint appointment_buffers_appointment_fk foreign key (appointment_id, organization_id) references public.appointments (id, organization_id) on delete cascade
);

create table public.appointment_waitlist_placeholders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid,
  practitioner_id uuid,
  service_id uuid,
  preferred_start timestamptz,
  preferred_end timestamptz,
  status text not null default 'placeholder' check (status = 'placeholder'),
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointment_waitlist_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint appointment_waitlist_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete restrict,
  constraint appointment_waitlist_service_fk foreign key (service_id, organization_id) references public.services (id, organization_id) on delete restrict
);

create table public.appointment_recurrence_placeholders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  appointment_id uuid not null,
  recurrence_rule text not null check (char_length(btrim(recurrence_rule)) between 1 and 500),
  recurrence_timezone text not null check (char_length(btrim(recurrence_timezone)) between 1 and 64),
  status text not null default 'placeholder' check (status = 'placeholder'),
  created_at timestamptz not null default timezone('utc', now()),
  constraint appointment_recurrence_appointment_fk foreign key (appointment_id, organization_id) references public.appointments (id, organization_id) on delete cascade
);

create index appointments_organization_start_idx on public.appointments (organization_id, scheduled_start);
create index appointments_practitioner_start_idx on public.appointments (organization_id, practitioner_id, scheduled_start);
create index appointments_patient_start_idx on public.appointments (organization_id, patient_id, scheduled_start);
create index appointments_status_idx on public.appointments (organization_id, status, scheduled_start);
create index appointment_status_history_appointment_idx on public.appointment_status_history (organization_id, appointment_id, created_at);

create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create or replace function public.appointment_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select public.has_permission(target_organization_id, 'appointments.' || required_action) $$;

create or replace function public.appointment_transition_allowed(from_value text, to_value text)
returns boolean language sql immutable
as $$
  select case
    when from_value = to_value then true
    when from_value = 'draft' and to_value in ('scheduled', 'cancelled') then true
    when from_value = 'scheduled' and to_value in ('confirmed', 'cancelled', 'no_show') then true
    when from_value = 'confirmed' and to_value in ('checked_in', 'cancelled', 'no_show') then true
    when from_value = 'checked_in' and to_value in ('in_progress', 'cancelled') then true
    when from_value = 'in_progress' and to_value in ('completed', 'cancelled') then true
    else false
  end
$$;

create or replace function public.appointment_conflict_window(p_appointment public.appointments)
returns tstzrange language sql immutable
as $$ select tstzrange(p_appointment.scheduled_start - make_interval(mins => p_appointment.pre_buffer_minutes), p_appointment.scheduled_end + make_interval(mins => p_appointment.post_buffer_minutes), '[)') $$;

create or replace function public.validate_appointment_booking(
  p_organization_id uuid, p_patient_id uuid, p_practitioner_id uuid, p_location_id uuid, p_service_id uuid,
  p_appointment_type text, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text,
  p_pre_buffer_minutes integer, p_post_buffer_minutes integer, p_exclude_id uuid default null
)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare
  appointment_end timestamptz := p_scheduled_start + make_interval(mins => p_duration_minutes);
  local_start timestamp;
  local_end timestamp;
  availability jsonb;
  available boolean;
begin
  if p_scheduled_start is null or p_duration_minutes not between 1 and 1440 or p_pre_buffer_minutes not between 0 and 1440 or p_post_buffer_minutes not between 0 and 1440 then
    raise exception using errcode = '22023', message = 'APPOINTMENT_TIME_INVALID';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_timezone) then raise exception using errcode = '22023', message = 'APPOINTMENT_TIMEZONE_INVALID'; end if;
  local_start := p_scheduled_start at time zone p_timezone;
  local_end := appointment_end at time zone p_timezone;
  if local_start::date <> local_end::date then raise exception using errcode = '22023', message = 'APPOINTMENT_CROSS_DAY_UNSUPPORTED'; end if;
  if p_appointment_type not in ('in_person', 'virtual', 'hybrid') then raise exception using errcode = '22023', message = 'APPOINTMENT_TYPE_INVALID'; end if;
  if not exists (select 1 from public.patients where id = p_patient_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'APPOINTMENT_PATIENT_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status = 'active') then raise exception using errcode = '42501', message = 'APPOINTMENT_PRACTITIONER_FORBIDDEN'; end if;
  if not exists (select 1 from public.locations where id = p_location_id and organization_id = p_organization_id and operational_status = 'active') then raise exception using errcode = '42501', message = 'APPOINTMENT_LOCATION_FORBIDDEN'; end if;
  if not exists (select 1 from public.services where id = p_service_id and organization_id = p_organization_id and status = 'active') then raise exception using errcode = '42501', message = 'APPOINTMENT_SERVICE_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioner_service_assignments where organization_id = p_organization_id and practitioner_id = p_practitioner_id and service_id = p_service_id and status = 'active' and (location_id is null or location_id = p_location_id)) then raise exception using errcode = '42501', message = 'APPOINTMENT_SERVICE_NOT_ASSIGNED'; end if;
  if not exists (select 1 from public.practitioner_location_assignments where organization_id = p_organization_id and practitioner_id = p_practitioner_id and location_id = p_location_id and status = 'active') then raise exception using errcode = '42501', message = 'APPOINTMENT_LOCATION_NOT_ASSIGNED'; end if;

  availability := public.preview_practitioner_availability(p_practitioner_id, local_start::date, local_start::date, p_location_id, p_service_id);
  select exists (select 1 from jsonb_to_recordset(availability) as segment("date" date, "startTime" time, "endTime" time, "mode" text)
    where segment."date" = local_start::date and segment."startTime" <= local_start::time and segment."endTime" >= local_end::time
      and (segment."mode" = 'mixed' or segment."mode" = p_appointment_type or (p_appointment_type = 'hybrid' and segment."mode" = 'mixed'))) into available;
  if not available then raise exception using errcode = '23P01', message = 'APPOINTMENT_PRACTITIONER_UNAVAILABLE'; end if;

  if exists (
    select 1 from public.appointments existing
    where existing.organization_id = p_organization_id and existing.id is distinct from p_exclude_id
      and existing.practitioner_id = p_practitioner_id and existing.status not in ('cancelled', 'no_show')
      and public.appointment_conflict_window(existing) && tstzrange(p_scheduled_start - make_interval(mins => p_pre_buffer_minutes), appointment_end + make_interval(mins => p_post_buffer_minutes), '[)')
  ) then raise exception using errcode = '23P01', message = 'APPOINTMENT_PRACTITIONER_CONFLICT'; end if;
  if exists (
    select 1 from public.appointments existing
    where existing.organization_id = p_organization_id and existing.id is distinct from p_exclude_id
      and existing.patient_id = p_patient_id and existing.status not in ('cancelled', 'no_show')
      and public.appointment_conflict_window(existing) && tstzrange(p_scheduled_start - make_interval(mins => p_pre_buffer_minutes), appointment_end + make_interval(mins => p_post_buffer_minutes), '[)')
  ) then raise exception using errcode = '23P01', message = 'APPOINTMENT_PATIENT_CONFLICT'; end if;
end;
$$;

create or replace function public.preview_conflicts(p_organization_id uuid, p_patient_id uuid, p_practitioner_id uuid, p_location_id uuid, p_service_id uuid, p_appointment_type text, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text, p_pre_buffer_minutes integer default 0, p_post_buffer_minutes integer default 0)
returns table(conflict_type text, appointment_id uuid, conflict_start timestamptz, conflict_end timestamptz)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if not public.appointment_permission(p_organization_id, 'preview') then raise exception using errcode = '42501', message = 'APPOINTMENT_PREVIEW_FORBIDDEN'; end if;
  perform public.validate_appointment_booking(p_organization_id, p_patient_id, p_practitioner_id, p_location_id, p_service_id, p_appointment_type, p_scheduled_start, p_duration_minutes, p_timezone, p_pre_buffer_minutes, p_post_buffer_minutes);
  return;
exception when sqlstate '23P01' then
  if exists (select 1 from public.appointments a where a.organization_id = p_organization_id and a.practitioner_id = p_practitioner_id and a.status not in ('cancelled', 'no_show') and public.appointment_conflict_window(a) && tstzrange(p_scheduled_start - make_interval(mins => p_pre_buffer_minutes), p_scheduled_start + make_interval(mins => p_duration_minutes + p_post_buffer_minutes), '[)')) then
    conflict_type := 'practitioner';
  elsif exists (select 1 from public.appointments a where a.organization_id = p_organization_id and a.patient_id = p_patient_id and a.status not in ('cancelled', 'no_show') and public.appointment_conflict_window(a) && tstzrange(p_scheduled_start - make_interval(mins => p_pre_buffer_minutes), p_scheduled_start + make_interval(mins => p_duration_minutes + p_post_buffer_minutes), '[)')) then
    conflict_type := 'patient';
  else
    conflict_type := 'availability';
  end if;
  select a.id, a.scheduled_start, a.scheduled_end into appointment_id, conflict_start, conflict_end from public.appointments a where a.organization_id = p_organization_id and (a.practitioner_id = p_practitioner_id or a.patient_id = p_patient_id) and a.status not in ('cancelled', 'no_show') and public.appointment_conflict_window(a) && tstzrange(p_scheduled_start - make_interval(mins => p_pre_buffer_minutes), p_scheduled_start + make_interval(mins => p_duration_minutes + p_post_buffer_minutes), '[)') limit 1;
  return next;
end;
$$;

create or replace function public.create_appointment(p_organization_id uuid, p_patient_id uuid, p_practitioner_id uuid, p_location_id uuid, p_service_id uuid, p_appointment_type text, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text, p_pre_buffer_minutes integer default 0, p_post_buffer_minutes integer default 0, p_status text default 'scheduled', p_notes text default null)
returns table(appointment_id uuid, conflict_count integer)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); created_id uuid; end_time timestamptz;
begin
  if caller_id is null or not public.appointment_permission(p_organization_id, 'create') then raise exception using errcode = '42501', message = 'APPOINTMENT_CREATE_FORBIDDEN'; end if;
  if p_status not in ('draft', 'scheduled') then raise exception using errcode = '22023', message = 'APPOINTMENT_INITIAL_STATUS_INVALID'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':' || p_practitioner_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':' || p_patient_id::text, 0));
  perform public.validate_appointment_booking(p_organization_id, p_patient_id, p_practitioner_id, p_location_id, p_service_id, p_appointment_type, p_scheduled_start, p_duration_minutes, p_timezone, p_pre_buffer_minutes, p_post_buffer_minutes);
  end_time := p_scheduled_start + make_interval(mins => p_duration_minutes);
  insert into public.appointments (organization_id, patient_id, practitioner_id, location_id, service_id, appointment_type, scheduled_start, scheduled_end, timezone, duration_minutes, pre_buffer_minutes, post_buffer_minutes, status, notes, created_by, updated_by)
  values (p_organization_id, p_patient_id, p_practitioner_id, p_location_id, p_service_id, p_appointment_type, p_scheduled_start, end_time, p_timezone, p_duration_minutes, p_pre_buffer_minutes, p_post_buffer_minutes, p_status, nullif(btrim(p_notes), ''), caller_id, caller_id)
  returning id into created_id;
  insert into public.appointment_buffers (organization_id, appointment_id, buffer_kind, minutes) values (p_organization_id, created_id, 'pre', p_pre_buffer_minutes), (p_organization_id, created_id, 'post', p_post_buffer_minutes);
  insert into public.appointment_status_history (organization_id, appointment_id, from_status, to_status, changed_by) values (p_organization_id, created_id, null, p_status, caller_id);
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, p_organization_id, 'appointment.created', 'appointment', created_id, jsonb_build_object('status', p_status, 'appointment_type', p_appointment_type));
  appointment_id := created_id; conflict_count := 0; return next;
end;
$$;

create or replace function public.update_appointment(p_appointment_id uuid, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text, p_location_id uuid, p_service_id uuid, p_appointment_type text, p_pre_buffer_minutes integer default 0, p_post_buffer_minutes integer default 0, p_notes text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); appointment_record public.appointments%rowtype; end_time timestamptz;
begin
  select * into appointment_record from public.appointments where id = p_appointment_id for update;
  if not found or caller_id is null or not public.appointment_permission(appointment_record.organization_id, 'update') or appointment_record.status in ('completed', 'cancelled', 'no_show') then raise exception using errcode = '42501', message = 'APPOINTMENT_UPDATE_FORBIDDEN'; end if;
  perform pg_advisory_xact_lock(hashtextextended(appointment_record.organization_id::text || ':' || appointment_record.practitioner_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(appointment_record.organization_id::text || ':' || appointment_record.patient_id::text, 0));
  perform public.validate_appointment_booking(appointment_record.organization_id, appointment_record.patient_id, appointment_record.practitioner_id, p_location_id, p_service_id, p_appointment_type, p_scheduled_start, p_duration_minutes, p_timezone, p_pre_buffer_minutes, p_post_buffer_minutes, p_appointment_id);
  end_time := p_scheduled_start + make_interval(mins => p_duration_minutes);
  update public.appointments set scheduled_start = p_scheduled_start, scheduled_end = end_time, timezone = p_timezone, duration_minutes = p_duration_minutes, location_id = p_location_id, service_id = p_service_id, appointment_type = p_appointment_type, pre_buffer_minutes = p_pre_buffer_minutes, post_buffer_minutes = p_post_buffer_minutes, notes = nullif(btrim(p_notes), ''), updated_by = caller_id where id = p_appointment_id;
  update public.appointment_buffers set minutes = case when buffer_kind = 'pre' then p_pre_buffer_minutes else p_post_buffer_minutes end where appointment_id = p_appointment_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, appointment_record.organization_id, 'appointment.updated', 'appointment', p_appointment_id, '{}'::jsonb);
  return p_appointment_id;
end;
$$;

create or replace function public.change_appointment_status(p_appointment_id uuid, p_to_status text, p_reason text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); appointment_record public.appointments%rowtype; required_action text;
begin
  select * into appointment_record from public.appointments where id = p_appointment_id for update;
  if not found then raise exception using errcode = '42501', message = 'APPOINTMENT_NOT_FOUND'; end if;
  required_action := case when p_to_status = 'cancelled' then 'cancel' when p_to_status = 'checked_in' then 'checkin' when p_to_status in ('completed', 'no_show') then 'complete' else 'update' end;
  if caller_id is null or not public.appointment_permission(appointment_record.organization_id, required_action) or not public.appointment_transition_allowed(appointment_record.status, p_to_status) then raise exception using errcode = '42501', message = 'APPOINTMENT_TRANSITION_FORBIDDEN'; end if;
  update public.appointments set status = p_to_status, actual_start = case when p_to_status = 'in_progress' then coalesce(actual_start, timezone('utc', now())) else actual_start end, actual_end = case when p_to_status = 'completed' then coalesce(actual_end, timezone('utc', now())) else actual_end end, completed_at = case when p_to_status = 'completed' then timezone('utc', now()) else null end, cancellation_reason = case when p_to_status = 'cancelled' then nullif(btrim(p_reason), '') else cancellation_reason end, updated_by = caller_id where id = p_appointment_id;
  insert into public.appointment_status_history (organization_id, appointment_id, from_status, to_status, changed_by, reason) values (appointment_record.organization_id, p_appointment_id, appointment_record.status, p_to_status, caller_id, nullif(btrim(p_reason), ''));
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, appointment_record.organization_id, case p_to_status when 'checked_in' then 'appointment.checked_in' when 'in_progress' then 'appointment.started' when 'no_show' then 'appointment.no_show' else 'appointment.' || p_to_status end, 'appointment', p_appointment_id, jsonb_build_object('from_status', appointment_record.status, 'to_status', p_to_status));
  return p_appointment_id;
end;
$$;

create or replace function public.confirm_appointment(p_appointment_id uuid) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'confirmed') $$;
create or replace function public.cancel_appointment(p_appointment_id uuid, p_reason text default null) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'cancelled', p_reason) $$;
create or replace function public.check_in_patient(p_appointment_id uuid) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'checked_in') $$;
create or replace function public.start_appointment(p_appointment_id uuid) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'in_progress') $$;
create or replace function public.complete_appointment(p_appointment_id uuid) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'completed') $$;
create or replace function public.mark_no_show(p_appointment_id uuid, p_reason text default null) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_appointment_status(p_appointment_id, 'no_show', p_reason) $$;

revoke all on function public.appointment_permission(uuid, text), public.appointment_transition_allowed(text, text), public.appointment_conflict_window(public.appointments), public.validate_appointment_booking(uuid, uuid, uuid, uuid, uuid, text, timestamptz, integer, text, integer, integer, uuid) from public;
grant execute on function public.preview_conflicts(uuid, uuid, uuid, uuid, uuid, text, timestamptz, integer, text, integer, integer), public.create_appointment(uuid, uuid, uuid, uuid, uuid, text, timestamptz, integer, text, integer, integer, text, text), public.update_appointment(uuid, timestamptz, integer, text, uuid, uuid, text, integer, integer, text), public.change_appointment_status(uuid, text, text), public.confirm_appointment(uuid), public.cancel_appointment(uuid, text), public.check_in_patient(uuid), public.start_appointment(uuid), public.complete_appointment(uuid), public.mark_no_show(uuid, text) to authenticated;
grant execute on function public.appointment_permission(uuid, text) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['appointments', 'appointment_status_history', 'appointment_buffers', 'appointment_waitlist_placeholders', 'appointment_recurrence_placeholders'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.appointment_permission(organization_id, ''read''))', table_name || '_scope', table_name);
    execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check (false)', table_name || '_insert', table_name);
    execute format('create policy %I_update_denied on public.%I for update to authenticated using (false) with check (false)', table_name || '_update', table_name);
    execute format('create policy %I_delete_denied on public.%I for delete to authenticated using (false)', table_name || '_delete', table_name);
  end loop;
end $$;

comment on table public.appointments is 'Canonical tenant-scoped scheduling resource. Clinical, billing, reminders, calendars, and AI remain outside this phase.';
comment on table public.appointment_waitlist_placeholders is 'Foundation-only waitlist boundary; no workflow is implemented.';
comment on table public.appointment_recurrence_placeholders is 'Foundation-only recurrence metadata; no occurrence generation is implemented.';
