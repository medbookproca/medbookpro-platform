insert into public.permissions (key, domain, action, description)
values
  ('patients.read', 'patients', 'read', 'Read patient profiles'),
  ('patients.create', 'patients', 'create', 'Create patients'),
  ('patients.update', 'patients', 'update', 'Update patient profiles'),
  ('patients.archive', 'patients', 'archive', 'Archive and restore patients'),
  ('patients.manage_consents', 'patients', 'manage_consents', 'Manage patient consents'),
  ('patients.manage_identifiers', 'patients', 'manage_identifiers', 'Manage protected patient identifiers'),
  ('patients.manage_contacts', 'patients', 'manage_contacts', 'Manage patient contacts and relationships'),
  ('patients.preview_duplicates', 'patients', 'preview_duplicates', 'Preview potential duplicate patients')
on conflict (key) do update set description = excluded.description, status = 'active';

do $$
declare permission_key text;
begin
  foreach permission_key in array array['patients.read', 'patients.create', 'patients.update', 'patients.archive', 'patients.manage_consents', 'patients.manage_identifiers', 'patients.manage_contacts', 'patients.preview_duplicates'] loop
    insert into public.role_permissions (role_id, permission_id)
    select r.id, p.id from public.roles r join public.permissions p on p.key = permission_key
    where r.key in ('organization.owner', 'organization.admin') and r.organization_id is null
    on conflict do nothing;
  end loop;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'clinic.admin' and r.organization_id is null
    and p.key in ('patients.read', 'patients.create', 'patients.update', 'patients.archive', 'patients.manage_consents', 'patients.manage_contacts', 'patients.preview_duplicates')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'location.manager' and r.organization_id is null
    and p.key in ('patients.read', 'patients.create', 'patients.update', 'patients.preview_duplicates')
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'practitioner' and r.organization_id is null
    and p.key = 'patients.read'
  on conflict do nothing;
  insert into public.role_permissions (role_id, permission_id)
  select r.id, p.id from public.roles r cross join public.permissions p
  where r.key = 'practitioner' and p.key = 'patients.read'
  on conflict do nothing;
end $$;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_number text not null check (char_length(btrim(patient_number)) between 1 and 80),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 120),
  middle_name text,
  last_name text not null check (char_length(btrim(last_name)) between 1 and 120),
  preferred_name text,
  legal_name text,
  normalized_name text not null check (char_length(normalized_name) between 2 and 300),
  date_of_birth date not null check (date_of_birth <= current_date),
  biological_sex text not null check (biological_sex in ('female', 'male', 'intersex', 'unknown', 'undisclosed')),
  gender_identity text,
  pronouns text,
  marital_status text not null check (marital_status in ('single', 'married', 'common_law', 'separated', 'divorced', 'widowed', 'unknown', 'undisclosed')),
  occupation text,
  preferred_language text not null check (char_length(btrim(preferred_language)) between 2 and 16),
  interpreter_required boolean not null default false,
  accessibility_notes text,
  photo_reference text,
  non_clinical_notes text,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive', 'archived')),
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patients_id_organization_unique unique (id, organization_id),
  constraint patients_organization_number_unique unique (organization_id, patient_number),
  constraint patients_status_archive_check check ((status = 'archived') = (archived_at is not null))
);

create table public.patient_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  email text,
  phone text,
  alternate_phone text,
  address text,
  city text,
  province text,
  postal_code text,
  country text not null default 'Canada',
  email_allowed boolean not null default false,
  sms_allowed boolean not null default false,
  phone_allowed boolean not null default false,
  marketing_opt_in boolean not null default false,
  reminder_preference text,
  preferred_contact_method text not null default 'none' check (preferred_contact_method in ('email', 'sms', 'phone', 'none')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_contacts_patient_unique unique (patient_id),
  constraint patient_contacts_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade
);

create table public.patient_identifiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  identifier_type text not null check (identifier_type in ('internal_mrn', 'provincial_health_number', 'passport', 'drivers_licence', 'other')),
  identifier_value text not null check (char_length(btrim(identifier_value)) between 1 and 200),
  identifier_last4 text not null check (char_length(identifier_last4) between 1 and 4),
  issuing_jurisdiction text,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_identifiers_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade
);

create table public.patient_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  relationship text not null check (char_length(btrim(relationship)) between 1 and 100),
  phone text not null,
  alternate_phone text,
  email text,
  address text,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_emergency_contact_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade
);

create table public.patient_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  related_patient_id uuid not null,
  relationship_type text not null check (relationship_type in ('spouse', 'child', 'parent', 'dependent', 'caregiver')),
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_relationship_self_check check (patient_id <> related_patient_id),
  constraint patient_relationship_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade,
  constraint patient_relationship_related_fk foreign key (related_patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint patient_relationship_unique unique (patient_id, related_patient_id, relationship_type)
);

create table public.patient_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  consent_type text not null check (consent_type in ('privacy_acknowledgement', 'communication', 'treatment')),
  consent_date date not null,
  version text not null check (char_length(btrim(version)) between 1 and 40),
  document_reference text,
  withdrawn boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_consents_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade,
  constraint patient_consents_version_unique unique (patient_id, consent_type, version)
);

create table public.patient_insurance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  insurer_name text not null check (char_length(btrim(insurer_name)) between 1 and 200),
  policy_number text,
  member_number text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_insurance_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade
);

create table public.patient_referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  referred_by text,
  referred_by_practitioner_id uuid,
  referral_source text,
  referral_date date,
  referral_notes text,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_referral_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade,
  constraint patient_referral_practitioner_fk foreign key (referred_by_practitioner_id, organization_id) references public.practitioners (id, organization_id) on delete set null
);

create table public.patient_duplicate_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  patient_id uuid not null,
  matched_patient_id uuid not null,
  match_reason text not null check (char_length(btrim(match_reason)) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'dismissed', 'confirmed')),
  created_by uuid references public.profiles (id) on delete set null,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint patient_duplicate_flag_self_check check (patient_id <> matched_patient_id),
  constraint patient_duplicate_flag_patient_fk foreign key (patient_id, organization_id) references public.patients (id, organization_id) on delete cascade,
  constraint patient_duplicate_flag_matched_fk foreign key (matched_patient_id, organization_id) references public.patients (id, organization_id) on delete restrict,
  constraint patient_duplicate_flag_unique unique (patient_id, matched_patient_id, match_reason)
);

create unique index patient_identifiers_primary_idx on public.patient_identifiers (patient_id) where status = 'active' and is_primary;
create unique index patient_emergency_primary_idx on public.patient_emergency_contacts (patient_id) where status = 'active' and is_primary;
create index patients_organization_status_name_idx on public.patients (organization_id, status, normalized_name);
create index patients_organization_dob_idx on public.patients (organization_id, date_of_birth);
create index patient_contacts_organization_email_idx on public.patient_contacts (organization_id, lower(email));
create index patient_contacts_organization_phone_idx on public.patient_contacts (organization_id, phone);
create index patient_identifiers_organization_patient_idx on public.patient_identifiers (organization_id, patient_id, status);
create index patient_emergency_organization_patient_idx on public.patient_emergency_contacts (organization_id, patient_id, status);
create index patient_duplicate_flags_organization_status_idx on public.patient_duplicate_flags (organization_id, status, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['patients', 'patient_contacts', 'patient_identifiers', 'patient_emergency_contacts', 'patient_relationships', 'patient_consents', 'patient_insurance', 'patient_referrals', 'patient_duplicate_flags'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end $$;

create or replace function public.patient_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select public.has_permission(target_organization_id, 'patients.' || required_action) $$;

create or replace function public.normalize_patient_name(value text)
returns text language sql immutable strict set search_path = pg_catalog
as $$ select regexp_replace(lower(btrim(value)), '[^a-z0-9]+', '', 'g') $$;

create or replace function public.normalize_patient_phone(value text)
returns text language sql immutable strict set search_path = pg_catalog
as $$ select regexp_replace(value, '[^0-9]+', '', 'g') $$;

create or replace function public.preview_duplicate_matches(p_organization_id uuid, p_first_name text, p_middle_name text, p_last_name text, p_date_of_birth date, p_email text default null, p_phone text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); name_key text := public.normalize_patient_name(concat_ws(' ', p_first_name, p_middle_name, p_last_name)); phone_key text := public.normalize_patient_phone(p_phone); result jsonb;
begin
  if caller_id is null or not public.patient_permission(p_organization_id, 'preview_duplicates') then raise exception using errcode = '42501', message = 'PATIENT_DUPLICATE_PREVIEW_FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('patientId', p.id, 'patientNumber', p.patient_number, 'displayName', concat_ws(' ', p.preferred_name, p.first_name, p.last_name), 'matchReason', case when p.date_of_birth = p_date_of_birth and p.normalized_name = name_key then 'name_and_date_of_birth' when lower(coalesce(c.email, '')) = lower(nullif(btrim(p_email), '')) then 'email' else 'phone' end) order by p.created_at), '[]'::jsonb) into result
  from public.patients p left join public.patient_contacts c on c.patient_id = p.id and c.organization_id = p.organization_id
  where p.organization_id = p_organization_id and p.status <> 'archived'
    and ((p.date_of_birth = p_date_of_birth and p.normalized_name = name_key) or (nullif(btrim(p_email), '') is not null and lower(c.email) = lower(btrim(p_email))) or (nullif(phone_key, '') is not null and public.normalize_patient_phone(c.phone) = phone_key));
  return result;
end;
$$;

create or replace function public.create_patient(p_organization_id uuid, p_patient_number text, p_first_name text, p_middle_name text, p_last_name text, p_preferred_name text, p_legal_name text, p_date_of_birth date, p_biological_sex text, p_gender_identity text, p_pronouns text, p_marital_status text, p_occupation text, p_preferred_language text, p_interpreter_required boolean, p_accessibility_notes text, p_photo_reference text, p_non_clinical_notes text, p_status text default 'draft', p_email text default null, p_phone text default null)
returns table (patient_id uuid, duplicate_count integer) language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; generated_number text; matches jsonb; match_record jsonb; match_id uuid; match_reason text; normalized_name text := public.normalize_patient_name(concat_ws(' ', coalesce(nullif(p_legal_name, ''), nullif(p_first_name, ''), ''), p_middle_name, p_last_name));
begin
  if caller_id is null or not public.patient_permission(p_organization_id, 'create') then raise exception using errcode = '42501', message = 'PATIENT_CREATE_FORBIDDEN'; end if;
  if p_status not in ('draft', 'active', 'inactive') or btrim(coalesce(p_first_name, '')) = '' or btrim(coalesce(p_last_name, '')) = '' or p_date_of_birth > current_date then raise exception using errcode = '22023', message = 'PATIENT_INVALID_PROFILE'; end if;
  generated_number := coalesce(nullif(btrim(p_patient_number), ''), 'PAT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
  matches := public.preview_duplicate_matches(p_organization_id, p_first_name, p_middle_name, p_last_name, p_date_of_birth, p_email, p_phone);
  insert into public.patients (organization_id, patient_number, first_name, middle_name, last_name, preferred_name, legal_name, normalized_name, date_of_birth, biological_sex, gender_identity, pronouns, marital_status, occupation, preferred_language, interpreter_required, accessibility_notes, photo_reference, non_clinical_notes, status, created_by, updated_by)
  values (p_organization_id, generated_number, btrim(p_first_name), nullif(btrim(p_middle_name), ''), btrim(p_last_name), nullif(btrim(p_preferred_name), ''), nullif(btrim(p_legal_name), ''), normalized_name, p_date_of_birth, p_biological_sex, nullif(btrim(p_gender_identity), ''), nullif(btrim(p_pronouns), ''), p_marital_status, nullif(btrim(p_occupation), ''), lower(btrim(p_preferred_language)), coalesce(p_interpreter_required, false), nullif(btrim(p_accessibility_notes), ''), nullif(btrim(p_photo_reference), ''), nullif(btrim(p_non_clinical_notes), ''), p_status, caller_id, caller_id) returning * into patient_record;
  insert into public.patient_contacts (organization_id, patient_id, email, phone, created_by, updated_by) values (p_organization_id, patient_record.id, nullif(lower(btrim(p_email)), ''), nullif(btrim(p_phone), ''), caller_id, caller_id);
  for match_record in select * from jsonb_array_elements(matches) loop
    match_id := (match_record->>'patientId')::uuid; match_reason := match_record->>'matchReason';
    insert into public.patient_duplicate_flags (organization_id, patient_id, matched_patient_id, match_reason, created_by) values (p_organization_id, patient_record.id, match_id, match_reason, caller_id) on conflict do nothing;
    insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'patient.duplicate_flagged', 'patient', patient_record.id, true, jsonb_build_object('matched_patient_id', match_id, 'match_reason', match_reason));
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'patient.created', 'patient', patient_record.id, true, jsonb_build_object('status', p_status, 'duplicate_count', jsonb_array_length(matches)));
  patient_id := patient_record.id; duplicate_count := jsonb_array_length(matches); return next;
end;
$$;

create or replace function public.update_patient(p_patient_id uuid, p_first_name text, p_middle_name text, p_last_name text, p_preferred_name text, p_legal_name text, p_date_of_birth date, p_biological_sex text, p_gender_identity text, p_pronouns text, p_marital_status text, p_occupation text, p_preferred_language text, p_interpreter_required boolean, p_accessibility_notes text, p_photo_reference text, p_non_clinical_notes text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'update') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_UPDATE_FORBIDDEN'; end if;
  update public.patients set first_name = btrim(p_first_name), middle_name = nullif(btrim(p_middle_name), ''), last_name = btrim(p_last_name), preferred_name = nullif(btrim(p_preferred_name), ''), legal_name = nullif(btrim(p_legal_name), ''), normalized_name = public.normalize_patient_name(concat_ws(' ', coalesce(nullif(p_legal_name, ''), nullif(p_first_name, ''), ''), p_middle_name, p_last_name)), date_of_birth = p_date_of_birth, biological_sex = p_biological_sex, gender_identity = nullif(btrim(p_gender_identity), ''), pronouns = nullif(btrim(p_pronouns), ''), marital_status = p_marital_status, occupation = nullif(btrim(p_occupation), ''), preferred_language = lower(btrim(p_preferred_language)), interpreter_required = coalesce(p_interpreter_required, false), accessibility_notes = nullif(btrim(p_accessibility_notes), ''), photo_reference = nullif(btrim(p_photo_reference), ''), non_clinical_notes = nullif(btrim(p_non_clinical_notes), ''), updated_by = caller_id where id = p_patient_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.updated', 'patient', p_patient_id, true, '{}'::jsonb);
  return true;
end;
$$;

create or replace function public.change_patient_status(p_patient_id uuid, p_status text, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; action_name text;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, case when p_status = 'archived' or patient_record.status = 'archived' then 'archive' else 'update' end) then raise exception using errcode = '42501', message = 'PATIENT_STATUS_FORBIDDEN'; end if;
  if p_status not in ('draft', 'active', 'inactive', 'archived') or (patient_record.status = 'archived' and p_status <> 'active') then raise exception using errcode = '40901', message = 'PATIENT_ARCHIVED_PROTECTED'; end if;
  update public.patients set status = p_status, archived_at = case when p_status = 'archived' then timezone('utc', now()) else null end, archived_by = case when p_status = 'archived' then caller_id else null end, updated_by = caller_id where id = p_patient_id;
  action_name := case p_status when 'archived' then 'patient.archived' when 'active' then case when patient_record.status = 'archived' then 'patient.restored' else 'patient.updated' end when 'inactive' then 'patient.updated' else 'patient.updated' end;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, action_name, 'patient', p_patient_id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

create or replace function public.update_patient_contact(p_patient_id uuid, p_email text, p_phone text, p_alternate_phone text, p_address text, p_city text, p_province text, p_postal_code text, p_country text, p_email_allowed boolean, p_sms_allowed boolean, p_phone_allowed boolean, p_marketing_opt_in boolean, p_reminder_preference text, p_preferred_contact_method text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'manage_contacts') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_CONTACT_FORBIDDEN'; end if;
  insert into public.patient_contacts (organization_id, patient_id, email, phone, alternate_phone, address, city, province, postal_code, country, email_allowed, sms_allowed, phone_allowed, marketing_opt_in, reminder_preference, preferred_contact_method, created_by, updated_by) values (patient_record.organization_id, p_patient_id, nullif(lower(btrim(p_email)), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_alternate_phone), ''), nullif(btrim(p_address), ''), nullif(btrim(p_city), ''), nullif(upper(btrim(p_province)), ''), nullif(upper(btrim(p_postal_code)), ''), coalesce(nullif(btrim(p_country), ''), 'Canada'), coalesce(p_email_allowed, false), coalesce(p_sms_allowed, false), coalesce(p_phone_allowed, false), coalesce(p_marketing_opt_in, false), nullif(btrim(p_reminder_preference), ''), p_preferred_contact_method, caller_id, caller_id) on conflict (patient_id) do update set email = excluded.email, phone = excluded.phone, alternate_phone = excluded.alternate_phone, address = excluded.address, city = excluded.city, province = excluded.province, postal_code = excluded.postal_code, country = excluded.country, email_allowed = excluded.email_allowed, sms_allowed = excluded.sms_allowed, phone_allowed = excluded.phone_allowed, marketing_opt_in = excluded.marketing_opt_in, reminder_preference = excluded.reminder_preference, preferred_contact_method = excluded.preferred_contact_method, updated_by = caller_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.contact_updated', 'patient_contact', p_patient_id, true, jsonb_build_object('has_email', p_email is not null, 'has_phone', p_phone is not null));
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.communication_preferences_changed', 'patient_contact', p_patient_id, true, jsonb_build_object('preferred_contact_method', p_preferred_contact_method));
  return true;
end;
$$;

create or replace function public.update_patient_communication_preferences(p_patient_id uuid, p_email_allowed boolean, p_sms_allowed boolean, p_phone_allowed boolean, p_marketing_opt_in boolean, p_reminder_preference text, p_preferred_contact_method text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'update') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_COMMUNICATION_FORBIDDEN'; end if;
  update public.patient_contacts set email_allowed = coalesce(p_email_allowed, false), sms_allowed = coalesce(p_sms_allowed, false), phone_allowed = coalesce(p_phone_allowed, false), marketing_opt_in = coalesce(p_marketing_opt_in, false), reminder_preference = nullif(btrim(p_reminder_preference), ''), preferred_contact_method = p_preferred_contact_method, updated_by = caller_id where patient_id = p_patient_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.communication_preferences_changed', 'patient_contact', p_patient_id, true, jsonb_build_object('preferred_contact_method', p_preferred_contact_method));
  return true;
end;
$$;

create or replace function public.add_patient_identifier(p_patient_id uuid, p_identifier_type text, p_identifier_value text, p_issuing_jurisdiction text default null, p_is_primary boolean default false)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; identifier_id uuid;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'manage_identifiers') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_IDENTIFIER_FORBIDDEN'; end if;
  if p_is_primary then update public.patient_identifiers set is_primary = false, updated_by = caller_id where patient_id = p_patient_id and status = 'active'; end if;
  insert into public.patient_identifiers (organization_id, patient_id, identifier_type, identifier_value, identifier_last4, issuing_jurisdiction, is_primary, created_by, updated_by) values (patient_record.organization_id, p_patient_id, p_identifier_type, btrim(p_identifier_value), right(btrim(p_identifier_value), 4), nullif(btrim(p_issuing_jurisdiction), ''), coalesce(p_is_primary, false), caller_id, caller_id) returning id into identifier_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.identifier_added', 'patient_identifier', identifier_id, true, jsonb_build_object('identifier_type', p_identifier_type, 'is_primary', p_is_primary));
  return identifier_id;
end;
$$;

create or replace function public.update_patient_identifier(p_identifier_id uuid, p_identifier_type text, p_identifier_value text, p_issuing_jurisdiction text default null, p_is_primary boolean default false)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); identifier_record public.patient_identifiers%rowtype; patient_record public.patients%rowtype;
begin
  select * into identifier_record from public.patient_identifiers where id = p_identifier_id for update;
  select * into patient_record from public.patients where id = identifier_record.patient_id;
  if not found or not public.patient_permission(identifier_record.organization_id, 'manage_identifiers') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_IDENTIFIER_FORBIDDEN'; end if;
  if p_is_primary then update public.patient_identifiers set is_primary = false, updated_by = caller_id where patient_id = identifier_record.patient_id and id <> p_identifier_id and status = 'active'; end if;
  update public.patient_identifiers set identifier_type = p_identifier_type, identifier_value = btrim(p_identifier_value), identifier_last4 = right(btrim(p_identifier_value), 4), issuing_jurisdiction = nullif(btrim(p_issuing_jurisdiction), ''), is_primary = coalesce(p_is_primary, false), updated_by = caller_id where id = p_identifier_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, identifier_record.organization_id, 'patient.identifier_updated', 'patient_identifier', p_identifier_id, true, jsonb_build_object('identifier_type', p_identifier_type, 'is_primary', p_is_primary));
  return true;
end;
$$;

create or replace function public.add_patient_emergency_contact(p_patient_id uuid, p_name text, p_relationship text, p_phone text, p_alternate_phone text default null, p_email text default null, p_address text default null, p_is_primary boolean default false)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; contact_id uuid;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'manage_contacts') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_CONTACT_FORBIDDEN'; end if;
  if p_is_primary then update public.patient_emergency_contacts set is_primary = false, updated_by = caller_id where patient_id = p_patient_id and status = 'active'; end if;
  insert into public.patient_emergency_contacts (organization_id, patient_id, name, relationship, phone, alternate_phone, email, address, is_primary, created_by, updated_by) values (patient_record.organization_id, p_patient_id, btrim(p_name), btrim(p_relationship), btrim(p_phone), nullif(btrim(p_alternate_phone), ''), nullif(lower(btrim(p_email)), ''), nullif(btrim(p_address), ''), coalesce(p_is_primary, false), caller_id, caller_id) returning id into contact_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.contact_updated', 'patient_emergency_contact', contact_id, true, jsonb_build_object('is_primary', p_is_primary));
  return contact_id;
end;
$$;

create or replace function public.update_patient_emergency_contact(p_contact_id uuid, p_name text, p_relationship text, p_phone text, p_alternate_phone text default null, p_email text default null, p_address text default null, p_is_primary boolean default false)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); contact_record public.patient_emergency_contacts%rowtype; patient_record public.patients%rowtype;
begin
  select * into contact_record from public.patient_emergency_contacts where id = p_contact_id for update;
  select * into patient_record from public.patients where id = contact_record.patient_id;
  if not found or not public.patient_permission(contact_record.organization_id, 'manage_contacts') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_CONTACT_FORBIDDEN'; end if;
  if p_is_primary then update public.patient_emergency_contacts set is_primary = false, updated_by = caller_id where patient_id = contact_record.patient_id and id <> p_contact_id and status = 'active'; end if;
  update public.patient_emergency_contacts set name = btrim(p_name), relationship = btrim(p_relationship), phone = btrim(p_phone), alternate_phone = nullif(btrim(p_alternate_phone), ''), email = nullif(lower(btrim(p_email)), ''), address = nullif(btrim(p_address), ''), is_primary = coalesce(p_is_primary, false), updated_by = caller_id where id = p_contact_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, contact_record.organization_id, 'patient.contact_updated', 'patient_emergency_contact', p_contact_id, true, jsonb_build_object('is_primary', p_is_primary));
  return true;
end;
$$;

create or replace function public.update_patient_consents(p_patient_id uuid, p_consents jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; consent_record jsonb;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'manage_consents') or patient_record.status = 'archived' then raise exception using errcode = '42501', message = 'PATIENT_CONSENT_FORBIDDEN'; end if;
  for consent_record in select * from jsonb_array_elements(coalesce(p_consents, '[]'::jsonb)) loop
    insert into public.patient_consents (organization_id, patient_id, consent_type, consent_date, version, document_reference, withdrawn, created_by, updated_by) values (patient_record.organization_id, p_patient_id, consent_record->>'consentType', (consent_record->>'consentDate')::date, consent_record->>'version', nullif(consent_record->>'documentReference', ''), coalesce((consent_record->>'withdrawn')::boolean, false), caller_id, caller_id) on conflict (patient_id, consent_type, version) do update set consent_date = excluded.consent_date, document_reference = excluded.document_reference, withdrawn = excluded.withdrawn, updated_by = caller_id;
  end loop;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.consent_updated', 'patient_consent', p_patient_id, true, jsonb_build_object('consent_count', jsonb_array_length(coalesce(p_consents, '[]'::jsonb))));
  return true;
end;
$$;

create or replace function public.add_patient_relationship(p_patient_id uuid, p_related_patient_id uuid, p_relationship_type text, p_notes text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare caller_id uuid := auth.uid(); patient_record public.patients%rowtype; relationship_id uuid;
begin
  select * into patient_record from public.patients where id = p_patient_id for update;
  if not found or not public.patient_permission(patient_record.organization_id, 'manage_contacts') or patient_record.status = 'archived' or not exists (select 1 from public.patients where id = p_related_patient_id and organization_id = patient_record.organization_id) then raise exception using errcode = '42501', message = 'PATIENT_RELATIONSHIP_FORBIDDEN'; end if;
  insert into public.patient_relationships (organization_id, patient_id, related_patient_id, relationship_type, notes, created_by, updated_by) values (patient_record.organization_id, p_patient_id, p_related_patient_id, p_relationship_type, nullif(btrim(p_notes), ''), caller_id, caller_id) returning id into relationship_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'patient.contact_updated', 'patient_relationship', relationship_id, true, jsonb_build_object('relationship_type', p_relationship_type));
  return relationship_id;
end;
$$;

revoke all on function public.patient_permission(uuid, text) from public;
revoke all on function public.normalize_patient_name(text) from public;
revoke all on function public.normalize_patient_phone(text) from public;
grant execute on function public.patient_permission(uuid, text) to authenticated;
grant execute on function public.preview_duplicate_matches(uuid, text, text, text, date, text, text) to authenticated;
grant execute on function public.create_patient(uuid, text, text, text, text, text, text, date, text, text, text, text, text, text, boolean, text, text, text, text, text, text) to authenticated;
grant execute on function public.update_patient(uuid, text, text, text, text, text, date, text, text, text, text, text, text, boolean, text, text, text) to authenticated;
grant execute on function public.change_patient_status(uuid, text, text) to authenticated;
grant execute on function public.update_patient_contact(uuid, text, text, text, text, text, text, text, text, boolean, boolean, boolean, boolean, text, text) to authenticated;
grant execute on function public.update_patient_communication_preferences(uuid, boolean, boolean, boolean, boolean, text, text) to authenticated;
grant execute on function public.add_patient_identifier(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.update_patient_identifier(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.add_patient_emergency_contact(uuid, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.update_patient_emergency_contact(uuid, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.update_patient_consents(uuid, jsonb) to authenticated;
grant execute on function public.add_patient_relationship(uuid, uuid, text, text) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['patients', 'patient_contacts', 'patient_identifiers', 'patient_emergency_contacts', 'patient_relationships', 'patient_consents', 'patient_insurance', 'patient_referrals', 'patient_duplicate_flags'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
  end loop;
end $$;

create policy patients_select_read on public.patients for select to authenticated using (public.patient_permission(organization_id, 'read'));
create policy patients_insert_denied on public.patients for insert to authenticated with check (false);
create policy patients_update_denied on public.patients for update to authenticated using (false) with check (false);
create policy patients_delete_denied on public.patients for delete to authenticated using (false);
create policy patient_contacts_select_read on public.patient_contacts for select to authenticated using (public.patient_permission(organization_id, 'read'));
create policy patient_contacts_insert_denied on public.patient_contacts for insert to authenticated with check (false);
create policy patient_contacts_update_denied on public.patient_contacts for update to authenticated using (false) with check (false);
create policy patient_contacts_delete_denied on public.patient_contacts for delete to authenticated using (false);
create policy patient_identifiers_select_protected on public.patient_identifiers for select to authenticated using (public.patient_permission(organization_id, 'manage_identifiers'));
create policy patient_identifiers_insert_denied on public.patient_identifiers for insert to authenticated with check (false);
create policy patient_identifiers_update_denied on public.patient_identifiers for update to authenticated using (false) with check (false);
create policy patient_identifiers_delete_denied on public.patient_identifiers for delete to authenticated using (false);
create policy patient_emergency_contacts_select_protected on public.patient_emergency_contacts for select to authenticated using (public.patient_permission(organization_id, 'manage_contacts'));
create policy patient_emergency_contacts_insert_denied on public.patient_emergency_contacts for insert to authenticated with check (false);
create policy patient_emergency_contacts_update_denied on public.patient_emergency_contacts for update to authenticated using (false) with check (false);
create policy patient_emergency_contacts_delete_denied on public.patient_emergency_contacts for delete to authenticated using (false);
create policy patient_relationships_select_protected on public.patient_relationships for select to authenticated using (public.patient_permission(organization_id, 'manage_contacts'));
create policy patient_relationships_insert_denied on public.patient_relationships for insert to authenticated with check (false);
create policy patient_relationships_update_denied on public.patient_relationships for update to authenticated using (false) with check (false);
create policy patient_relationships_delete_denied on public.patient_relationships for delete to authenticated using (false);
create policy patient_consents_select_protected on public.patient_consents for select to authenticated using (public.patient_permission(organization_id, 'manage_consents'));
create policy patient_consents_insert_denied on public.patient_consents for insert to authenticated with check (false);
create policy patient_consents_update_denied on public.patient_consents for update to authenticated using (false) with check (false);
create policy patient_consents_delete_denied on public.patient_consents for delete to authenticated using (false);
create policy patient_insurance_select_protected on public.patient_insurance for select to authenticated using (public.patient_permission(organization_id, 'manage_contacts'));
create policy patient_insurance_insert_denied on public.patient_insurance for insert to authenticated with check (false);
create policy patient_insurance_update_denied on public.patient_insurance for update to authenticated using (false) with check (false);
create policy patient_insurance_delete_denied on public.patient_insurance for delete to authenticated using (false);
create policy patient_referrals_select_read on public.patient_referrals for select to authenticated using (public.patient_permission(organization_id, 'read'));
create policy patient_referrals_insert_denied on public.patient_referrals for insert to authenticated with check (false);
create policy patient_referrals_update_denied on public.patient_referrals for update to authenticated using (false) with check (false);
create policy patient_referrals_delete_denied on public.patient_referrals for delete to authenticated using (false);
create policy patient_duplicate_flags_select_preview on public.patient_duplicate_flags for select to authenticated using (public.patient_permission(organization_id, 'preview_duplicates'));
create policy patient_duplicate_flags_insert_denied on public.patient_duplicate_flags for insert to authenticated with check (false);
create policy patient_duplicate_flags_update_denied on public.patient_duplicate_flags for update to authenticated using (false) with check (false);
create policy patient_duplicate_flags_delete_denied on public.patient_duplicate_flags for delete to authenticated using (false);

comment on table public.patient_identifiers is 'Protected patient identifiers. Values are never returned by public or general patient list queries.';
comment on table public.patient_emergency_contacts is 'Protected emergency and guardian contact readiness; no legal authority workflow is implemented.';
comment on table public.patient_insurance is 'Insurance placeholder only; no claims or billing workflow is implemented.';
comment on function public.preview_duplicate_matches(uuid, text, text, text, date, text, text) is 'Advisory same-organization duplicate preview. Never auto-merges or exposes identifiers.';
