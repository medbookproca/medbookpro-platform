insert into public.permissions (key, domain, action, description)
values
  ('clinical.read', 'clinical', 'read', 'Read clinical records'),
  ('clinical.create', 'clinical', 'create', 'Create encounters and clinical records'),
  ('clinical.update', 'clinical', 'update', 'Update clinical records'),
  ('clinical.complete', 'clinical', 'complete', 'Complete encounters'),
  ('clinical.amend', 'clinical', 'amend', 'Amend completed clinical records'),
  ('clinical.archive', 'clinical', 'archive', 'Archive clinical records')
on conflict (key) do update set description = excluded.description, status = 'active';

do $$
declare permission_key text;
begin
  foreach permission_key in array array['clinical.read', 'clinical.create', 'clinical.update', 'clinical.complete', 'clinical.amend', 'clinical.archive'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key in ('organization.owner', 'organization.admin', 'clinic.admin') and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['clinical.read', 'clinical.create', 'clinical.update', 'clinical.complete', 'clinical.amend'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'practitioner' and r.organization_id is null
    on conflict do nothing;
  end loop;
  foreach permission_key in array array['clinical.read', 'clinical.create', 'clinical.update'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key = 'receptionist' and r.organization_id is null
    on conflict do nothing;
  end loop;
end $$;

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  practitioner_id uuid not null,
  appointment_id uuid,
  encounter_type text not null default 'visit' check (char_length(btrim(encounter_type)) between 1 and 120),
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed', 'amended', 'archived')),
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint encounters_id_organization_unique unique (id, organization_id),
  constraint encounters_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint encounters_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete restrict,
  constraint encounters_appointment_fk foreign key (appointment_id, organization_id) references public.appointments (id, organization_id) on delete restrict,
  constraint encounters_lifecycle_dates check ((status = 'completed' and completed_at is not null) or (status <> 'completed')),
  constraint encounters_archive_date check ((status = 'archived') = (archived_at is not null)),
  constraint encounters_completed_after_start check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.encounter_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  from_status text,
  to_status text not null check (to_status in ('draft', 'in_progress', 'completed', 'amended', 'archived')),
  changed_by uuid references public.profiles (id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default timezone('utc', now()),
  constraint encounter_status_history_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade
);

create table public.soap_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  subjective text not null default '',
  objective text not null default '',
  assessment text not null default '',
  plan text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint soap_notes_encounter_unique unique (encounter_id),
  constraint soap_notes_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade
);

create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  patient_id uuid not null,
  practitioner_id uuid not null,
  goals text not null default '',
  interventions text not null default '',
  follow_up_notes text not null default '',
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'discontinued')),
  review_date date,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint care_plans_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade,
  constraint care_plans_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint care_plans_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete restrict
);

create table public.clinical_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  form_type text not null check (char_length(btrim(form_type)) between 1 and 120),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  version text not null check (char_length(btrim(version)) between 1 and 40),
  completion_status text not null default 'draft' check (completion_status in ('draft', 'in_progress', 'completed', 'void')),
  structured_response jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_response) = 'object'),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clinical_forms_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade
);

create table public.clinical_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  filename text not null check (char_length(btrim(filename)) between 1 and 255),
  media_type text not null check (char_length(btrim(media_type)) between 1 and 160),
  size_bytes bigint not null check (size_bytes between 0 and 10737418240),
  storage_reference text not null check (char_length(btrim(storage_reference)) between 1 and 500),
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clinical_attachments_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade
);

create table public.clinical_diagnoses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  patient_id uuid not null,
  coding_system text not null check (char_length(btrim(coding_system)) between 1 and 80),
  code text not null check (char_length(btrim(code)) between 1 and 80),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  is_primary boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clinical_diagnoses_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade,
  constraint clinical_diagnoses_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict
);

create table public.clinical_procedures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  encounter_id uuid not null,
  patient_id uuid not null,
  practitioner_id uuid not null,
  code text not null check (char_length(btrim(code)) between 1 and 80),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  performed_date date not null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clinical_procedures_encounter_fk foreign key (encounter_id, organization_id) references public.encounters (id, organization_id) on delete cascade,
  constraint clinical_procedures_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint clinical_procedures_practitioner_fk foreign key (practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete restrict
);

create index encounters_organization_status_idx on public.encounters (organization_id, status, updated_at desc);
create index encounters_patient_time_idx on public.encounters (organization_id, patient_id, created_at desc);
create index encounters_practitioner_time_idx on public.encounters (organization_id, practitioner_id, created_at desc);
create index encounters_appointment_idx on public.encounters (organization_id, appointment_id);
create index encounter_status_history_encounter_idx on public.encounter_status_history (organization_id, encounter_id, created_at);
create index care_plans_patient_idx on public.care_plans (organization_id, patient_id, status);
create index clinical_forms_encounter_idx on public.clinical_forms (organization_id, encounter_id);
create index clinical_attachments_encounter_idx on public.clinical_attachments (organization_id, encounter_id);
create index clinical_diagnoses_encounter_idx on public.clinical_diagnoses (organization_id, encounter_id);
create index clinical_procedures_encounter_idx on public.clinical_procedures (organization_id, encounter_id);

create trigger encounters_set_updated_at before update on public.encounters for each row execute function public.set_updated_at();
create trigger soap_notes_set_updated_at before update on public.soap_notes for each row execute function public.set_updated_at();
create trigger care_plans_set_updated_at before update on public.care_plans for each row execute function public.set_updated_at();
create trigger clinical_forms_set_updated_at before update on public.clinical_forms for each row execute function public.set_updated_at();
create trigger clinical_attachments_set_updated_at before update on public.clinical_attachments for each row execute function public.set_updated_at();
create trigger clinical_diagnoses_set_updated_at before update on public.clinical_diagnoses for each row execute function public.set_updated_at();
create trigger clinical_procedures_set_updated_at before update on public.clinical_procedures for each row execute function public.set_updated_at();

create or replace function public.clinical_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select public.has_permission(target_organization_id, 'clinical.' || required_action) $$;

create or replace function public.encounter_transition_allowed(from_value text, to_value text)
returns boolean language sql immutable
as $$ select case
  when from_value = to_value then true
  when from_value = 'draft' and to_value in ('in_progress', 'archived') then true
  when from_value = 'in_progress' and to_value = 'completed' then true
  when from_value = 'completed' and to_value in ('amended', 'archived') then true
  when from_value = 'amended' and to_value in ('completed', 'archived') then true
  else false end $$;

create or replace function public.validate_clinical_context(p_organization_id uuid, p_patient_id uuid, p_practitioner_id uuid, p_appointment_id uuid default null)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare appointment_record public.appointments%rowtype;
begin
  if not exists (select 1 from public.patients where id = p_patient_id and organization_id = p_organization_id and status <> 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_PATIENT_FORBIDDEN'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = p_organization_id and status = 'active') then raise exception using errcode = '42501', message = 'CLINICAL_PRACTITIONER_FORBIDDEN'; end if;
  if p_appointment_id is not null then
    select * into appointment_record from public.appointments where id = p_appointment_id and organization_id = p_organization_id;
    if not found or appointment_record.patient_id <> p_patient_id or appointment_record.practitioner_id <> p_practitioner_id then raise exception using errcode = '42501', message = 'CLINICAL_APPOINTMENT_CONTEXT_FORBIDDEN'; end if;
    if appointment_record.status not in ('in_progress', 'completed') then raise exception using errcode = '40901', message = 'CLINICAL_APPOINTMENT_NOT_CLINICAL'; end if;
  end if;
end;
$$;

create or replace function public.create_encounter(p_organization_id uuid, p_patient_id uuid, p_practitioner_id uuid, p_appointment_id uuid default null, p_encounter_type text default 'visit', p_status text default 'draft')
returns table(encounter_id uuid)
language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); created_id uuid;
begin
  if caller_id is null or not public.clinical_permission(p_organization_id, 'create') then raise exception using errcode = '42501', message = 'CLINICAL_CREATE_FORBIDDEN'; end if;
  if p_status not in ('draft', 'in_progress') then raise exception using errcode = '22023', message = 'CLINICAL_INITIAL_STATUS_INVALID'; end if;
  perform public.validate_clinical_context(p_organization_id, p_patient_id, p_practitioner_id, p_appointment_id);
  insert into public.encounters (organization_id, patient_id, practitioner_id, appointment_id, encounter_type, status, started_at, created_by, updated_by)
  values (p_organization_id, p_patient_id, p_practitioner_id, p_appointment_id, btrim(p_encounter_type), p_status, case when p_status = 'in_progress' then timezone('utc', now()) else null end, caller_id, caller_id)
  returning id into created_id;
  insert into public.encounter_status_history (organization_id, encounter_id, from_status, to_status, changed_by) values (p_organization_id, created_id, null, p_status, caller_id);
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, p_organization_id, 'encounter.created', 'encounter', created_id, jsonb_build_object('status', p_status, 'appointment_id', p_appointment_id));
  encounter_id := created_id; return next;
end;
$$;

create or replace function public.update_encounter(p_encounter_id uuid, p_encounter_type text, p_started_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id for update;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_UPDATE_FORBIDDEN'; end if;
  update public.encounters set encounter_type = btrim(p_encounter_type), started_at = coalesce(p_started_at, started_at), updated_by = caller_id where id = p_encounter_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'encounter.updated', 'encounter', p_encounter_id, '{}'::jsonb);
  return p_encounter_id;
end;
$$;

create or replace function public.change_encounter_status(p_encounter_id uuid, p_to_status text, p_reason text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; required_action text;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id for update;
  if not found then raise exception using errcode = '42501', message = 'CLINICAL_ENCOUNTER_NOT_FOUND'; end if;
  required_action := case when p_to_status = 'completed' then 'complete' when p_to_status = 'amended' then 'amend' when p_to_status = 'archived' then 'archive' else 'update' end;
  if caller_id is null or not public.clinical_permission(encounter_record.organization_id, required_action) or not public.encounter_transition_allowed(encounter_record.status, p_to_status) then raise exception using errcode = '42501', message = 'CLINICAL_TRANSITION_FORBIDDEN'; end if;
  update public.encounters set status = p_to_status, started_at = case when p_to_status = 'in_progress' then coalesce(started_at, timezone('utc', now())) else started_at end, completed_at = case when p_to_status = 'completed' then timezone('utc', now()) else completed_at end, archived_at = case when p_to_status = 'archived' then timezone('utc', now()) else archived_at end, updated_by = caller_id where id = p_encounter_id;
  insert into public.encounter_status_history (organization_id, encounter_id, from_status, to_status, changed_by, reason) values (encounter_record.organization_id, p_encounter_id, encounter_record.status, p_to_status, caller_id, nullif(btrim(p_reason), ''));
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'encounter.' || p_to_status, 'encounter', p_encounter_id, jsonb_build_object('from_status', encounter_record.status, 'to_status', p_to_status));
  return p_encounter_id;
end;
$$;

create or replace function public.complete_encounter(p_encounter_id uuid) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_encounter_status(p_encounter_id, 'completed') $$;
create or replace function public.amend_encounter(p_encounter_id uuid, p_reason text default null) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_encounter_status(p_encounter_id, 'amended', p_reason) $$;
create or replace function public.archive_encounter(p_encounter_id uuid, p_reason text default null) returns uuid language sql security definer set search_path = pg_catalog, public, auth as $$ select public.change_encounter_status(p_encounter_id, 'archived', p_reason) $$;

create or replace function public.update_soap_note(p_encounter_id uuid, p_subjective text, p_objective text, p_assessment text, p_plan text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; note_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_SOAP_FORBIDDEN'; end if;
  insert into public.soap_notes (organization_id, encounter_id, subjective, objective, assessment, plan, created_by, updated_by)
  values (encounter_record.organization_id, p_encounter_id, coalesce(p_subjective, ''), coalesce(p_objective, ''), coalesce(p_assessment, ''), coalesce(p_plan, ''), caller_id, caller_id)
  on conflict (encounter_id) do update set subjective = excluded.subjective, objective = excluded.objective, assessment = excluded.assessment, plan = excluded.plan, updated_by = caller_id
  returning id into note_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'soap.updated', 'soap_note', note_id, jsonb_build_object('encounter_id', p_encounter_id));
  return note_id;
end;
$$;

create or replace function public.update_care_plan(p_care_plan_id uuid, p_encounter_id uuid, p_goals text, p_interventions text, p_follow_up_notes text, p_status text, p_review_date date)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; care_plan_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_CARE_PLAN_FORBIDDEN'; end if;
  if p_care_plan_id is not null and not exists (select 1 from public.care_plans where id = p_care_plan_id and encounter_id = p_encounter_id and organization_id = encounter_record.organization_id) then raise exception using errcode = '42501', message = 'CLINICAL_CARE_PLAN_FORBIDDEN'; end if;
  insert into public.care_plans (id, organization_id, encounter_id, patient_id, practitioner_id, goals, interventions, follow_up_notes, status, review_date, created_by, updated_by)
  values (coalesce(p_care_plan_id, gen_random_uuid()), encounter_record.organization_id, p_encounter_id, encounter_record.patient_id, encounter_record.practitioner_id, coalesce(p_goals, ''), coalesce(p_interventions, ''), coalesce(p_follow_up_notes, ''), p_status, p_review_date, caller_id, caller_id)
  on conflict (id) do update set goals = excluded.goals, interventions = excluded.interventions, follow_up_notes = excluded.follow_up_notes, status = excluded.status, review_date = excluded.review_date, updated_by = caller_id
  returning id into care_plan_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'care_plan.updated', 'care_plan', care_plan_id, jsonb_build_object('encounter_id', p_encounter_id));
  return care_plan_id;
end;
$$;

create or replace function public.update_forms(p_form_id uuid, p_encounter_id uuid, p_form_type text, p_title text, p_version text, p_completion_status text, p_structured_response jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; form_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_FORM_FORBIDDEN'; end if;
  if p_form_id is not null and not exists (select 1 from public.clinical_forms where id = p_form_id and encounter_id = p_encounter_id and organization_id = encounter_record.organization_id) then raise exception using errcode = '42501', message = 'CLINICAL_FORM_FORBIDDEN'; end if;
  insert into public.clinical_forms (id, organization_id, encounter_id, form_type, title, version, completion_status, structured_response, created_by, updated_by)
  values (coalesce(p_form_id, gen_random_uuid()), encounter_record.organization_id, p_encounter_id, btrim(p_form_type), btrim(p_title), btrim(p_version), p_completion_status, coalesce(p_structured_response, '{}'::jsonb), caller_id, caller_id)
  on conflict (id) do update set form_type = excluded.form_type, title = excluded.title, version = excluded.version, completion_status = excluded.completion_status, structured_response = excluded.structured_response, updated_by = caller_id
  returning id into form_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'clinical_form.updated', 'clinical_form', form_id, jsonb_build_object('encounter_id', p_encounter_id));
  return form_id;
end;
$$;

create or replace function public.add_attachment_metadata(p_encounter_id uuid, p_filename text, p_media_type text, p_size_bytes bigint, p_storage_reference text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; attachment_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_ATTACHMENT_FORBIDDEN'; end if;
  insert into public.clinical_attachments (organization_id, encounter_id, filename, media_type, size_bytes, storage_reference, uploaded_by) values (encounter_record.organization_id, p_encounter_id, btrim(p_filename), btrim(p_media_type), p_size_bytes, btrim(p_storage_reference), caller_id) returning id into attachment_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'attachment_metadata.added', 'clinical_attachment', attachment_id, jsonb_build_object('encounter_id', p_encounter_id, 'filename', btrim(p_filename), 'size_bytes', p_size_bytes));
  return attachment_id;
end;
$$;

create or replace function public.update_diagnoses(p_diagnosis_id uuid, p_encounter_id uuid, p_coding_system text, p_code text, p_description text, p_is_primary boolean)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; diagnosis_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_DIAGNOSIS_FORBIDDEN'; end if;
  if p_diagnosis_id is not null and not exists (select 1 from public.clinical_diagnoses where id = p_diagnosis_id and encounter_id = p_encounter_id and organization_id = encounter_record.organization_id) then raise exception using errcode = '42501', message = 'CLINICAL_DIAGNOSIS_FORBIDDEN'; end if;
  insert into public.clinical_diagnoses (id, organization_id, encounter_id, patient_id, coding_system, code, description, is_primary, created_by, updated_by)
  values (coalesce(p_diagnosis_id, gen_random_uuid()), encounter_record.organization_id, p_encounter_id, encounter_record.patient_id, btrim(p_coding_system), btrim(p_code), btrim(p_description), p_is_primary, caller_id, caller_id)
  on conflict (id) do update set coding_system = excluded.coding_system, code = excluded.code, description = excluded.description, is_primary = excluded.is_primary, updated_by = caller_id
  returning id into diagnosis_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'diagnosis.updated', 'clinical_diagnosis', diagnosis_id, jsonb_build_object('encounter_id', p_encounter_id));
  return diagnosis_id;
end;
$$;

create or replace function public.update_procedures(p_procedure_id uuid, p_encounter_id uuid, p_code text, p_description text, p_performed_date date, p_practitioner_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); encounter_record public.encounters%rowtype; procedure_id uuid;
begin
  select * into encounter_record from public.encounters where id = p_encounter_id;
  if not found or caller_id is null or not public.clinical_permission(encounter_record.organization_id, case when encounter_record.status = 'amended' then 'amend' else 'update' end) or encounter_record.status in ('completed', 'archived') then raise exception using errcode = '42501', message = 'CLINICAL_PROCEDURE_FORBIDDEN'; end if;
  if p_procedure_id is not null and not exists (select 1 from public.clinical_procedures where id = p_procedure_id and encounter_id = p_encounter_id and organization_id = encounter_record.organization_id) then raise exception using errcode = '42501', message = 'CLINICAL_PROCEDURE_FORBIDDEN'; end if;
  if p_practitioner_id <> encounter_record.practitioner_id or not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = encounter_record.organization_id and status = 'active') then raise exception using errcode = '42501', message = 'CLINICAL_PROCEDURE_PRACTITIONER_FORBIDDEN'; end if;
  insert into public.clinical_procedures (id, organization_id, encounter_id, patient_id, practitioner_id, code, description, performed_date, created_by, updated_by)
  values (coalesce(p_procedure_id, gen_random_uuid()), encounter_record.organization_id, p_encounter_id, encounter_record.patient_id, p_practitioner_id, btrim(p_code), btrim(p_description), p_performed_date, caller_id, caller_id)
  on conflict (id) do update set code = excluded.code, description = excluded.description, performed_date = excluded.performed_date, practitioner_id = excluded.practitioner_id, updated_by = caller_id
  returning id into procedure_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, metadata) values (caller_id, encounter_record.organization_id, 'procedure.updated', 'clinical_procedure', procedure_id, jsonb_build_object('encounter_id', p_encounter_id));
  return procedure_id;
end;
$$;

revoke all on function public.clinical_permission(uuid, text), public.encounter_transition_allowed(text, text), public.validate_clinical_context(uuid, uuid, uuid, uuid) from public;
grant execute on function public.clinical_permission(uuid, text) to authenticated;
grant execute on function public.create_encounter(uuid, uuid, uuid, uuid, text, text), public.update_encounter(uuid, text, timestamptz), public.change_encounter_status(uuid, text, text), public.complete_encounter(uuid), public.amend_encounter(uuid, text), public.archive_encounter(uuid, text), public.update_soap_note(uuid, text, text, text, text), public.update_care_plan(uuid, uuid, text, text, text, text, date), public.update_forms(uuid, uuid, text, text, text, text, jsonb), public.add_attachment_metadata(uuid, text, text, bigint, text), public.update_diagnoses(uuid, uuid, text, text, text, boolean), public.update_procedures(uuid, uuid, text, text, date, uuid) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['encounters', 'encounter_status_history', 'soap_notes', 'care_plans', 'clinical_forms', 'clinical_attachments', 'clinical_diagnoses', 'clinical_procedures'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.clinical_permission(organization_id, ''read''))', table_name || '_scope', table_name);
    execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check (false)', table_name || '_insert', table_name);
    execute format('create policy %I_update_denied on public.%I for update to authenticated using (false) with check (false)', table_name || '_update', table_name);
    execute format('create policy %I_delete_denied on public.%I for delete to authenticated using (false)', table_name || '_delete', table_name);
  end loop;
end $$;

comment on table public.encounters is 'Tenant-scoped clinical encounter foundation. External interoperability and AI documentation remain future boundaries.';
comment on table public.clinical_attachments is 'Metadata only; no file upload or external storage integration is implemented.';
