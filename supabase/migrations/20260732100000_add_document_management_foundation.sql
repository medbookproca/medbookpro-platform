insert into public.permissions (key, domain, action, description)
values
  ('documents.read','documents','read','Read document metadata'),
  ('documents.create','documents','create','Create document metadata'),
  ('documents.update','documents','update','Update document metadata'),
  ('documents.archive','documents','archive','Archive and restore documents'),
  ('documents.manage_retention','documents','manage_retention','Manage document retention metadata')
on conflict (key) do update set description = excluded.description, status = 'active';

do $$ declare permission_key text; begin
  foreach permission_key in array array['documents.read','documents.create','documents.update','documents.archive','documents.manage_retention'] loop
    insert into public.role_permissions(role_id, permission_id)
    select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key
    where r.key in ('organization.owner','organization.admin','clinic.admin') and r.organization_id is null on conflict do nothing;
  end loop;
  foreach permission_key in array array['documents.read','documents.create','documents.update'] loop
    insert into public.role_permissions(role_id, permission_id)
    select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key
    where r.key='practitioner' and r.organization_id is null on conflict do nothing;
  end loop;
  insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r join public.permissions p on p.key='documents.read'
  where r.key='receptionist' and r.organization_id is null on conflict do nothing;
end $$;

create table public.document_categories (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  category_key text not null check(category_key=lower(category_key) and char_length(btrim(category_key)) between 1 and 80),
  name text not null check(char_length(btrim(name)) between 1 and 120), description text, active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
  unique(organization_id,category_key), unique(id,organization_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  location_id uuid, practitioner_id uuid, patient_id uuid, encounter_id uuid, category_id uuid,
  title text not null check(char_length(btrim(title)) between 1 and 240), description text,
  mime_type text, file_size_bytes bigint check(file_size_bytes is null or file_size_bytes between 0 and 10737418240), checksum_placeholder text,
  storage_provider_placeholder text, storage_path_placeholder text,
  retention_status text not null default 'active' check(retention_status in ('active','retained','legal_hold','eligible_for_deletion')),
  scheduled_deletion_at timestamptz, deleted boolean not null default false, archived boolean not null default false, archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
  unique(id,organization_id),
  foreign key(patient_id,organization_id) references public.patients(id,organization_id) on delete restrict,
  foreign key(encounter_id,organization_id) references public.encounters(id,organization_id) on delete restrict,
  foreign key(practitioner_id,organization_id) references public.practitioners(id,organization_id) on delete restrict,
  foreign key(location_id,organization_id) references public.locations(id,organization_id) on delete restrict,
  foreign key(category_id,organization_id) references public.document_categories(id,organization_id) on delete restrict,
  constraint documents_archive_state check(archived=(archived_at is not null)),
  constraint documents_delete_state check(not deleted or archived)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, document_id uuid not null,
  version_number integer not null check(version_number>0), is_current boolean not null default true, previous_version_id uuid,
  title text, description text, mime_type text, file_size_bytes bigint, checksum_placeholder text, storage_provider_placeholder text, storage_path_placeholder text,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()),
  foreign key(document_id,organization_id) references public.documents(id,organization_id) on delete cascade,
  foreign key(previous_version_id,organization_id) references public.document_versions(id,organization_id) on delete restrict,
  unique(document_id,version_number), unique(id,organization_id)
);
create unique index document_versions_current_unique on public.document_versions(document_id) where is_current;

create table public.document_access_log (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, document_id uuid not null,
  actor_profile_id uuid references public.profiles(id) on delete set null, actor_patient_id uuid, access_action text not null check(access_action in ('view','download','share_placeholder','delete','restore')),
  metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()),
  foreign key(document_id,organization_id) references public.documents(id,organization_id) on delete cascade,
  foreign key(actor_patient_id,organization_id) references public.patients(id,organization_id) on delete set null
);

create table public.document_retention_rules (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, category_id uuid,
  name text not null check(char_length(btrim(name)) between 1 and 160), retention_days integer check(retention_days is null or retention_days>=0), legal_hold_placeholder boolean not null default false, archived boolean not null default false, active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
  foreign key(category_id,organization_id) references public.document_categories(id,organization_id) on delete cascade
);

create table public.document_shares_placeholder (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, document_id uuid not null,
  recipient_placeholder text not null, expires_at timestamptz, status text not null default 'placeholder' check(status='placeholder'),
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()),
  foreign key(document_id,organization_id) references public.documents(id,organization_id) on delete cascade
);

create table public.document_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, document_id uuid not null,
  event_type text not null check(event_type=lower(event_type) and char_length(btrim(event_type)) between 1 and 120),
  actor_profile_id uuid references public.profiles(id) on delete set null, metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()),
  foreign key(document_id,organization_id) references public.documents(id,organization_id) on delete cascade
);

create or replace function public.documents_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select public.has_permission(target_organization_id,'documents.'||required_action) $$;

create or replace function public.seed_document_categories()
returns trigger language plpgsql security definer set search_path=pg_catalog,public
as $$
begin
  insert into public.document_categories(organization_id,category_key,name) values
  (new.id,'referral','Referral'),(new.id,'lab_result','Lab Result'),(new.id,'imaging','Imaging'),(new.id,'consent_form','Consent Form'),(new.id,'prescription_placeholder','Prescription Placeholder'),(new.id,'insurance','Insurance'),(new.id,'invoice_attachment','Invoice Attachment'),(new.id,'clinical_attachment','Clinical Attachment'),(new.id,'administrative','Administrative'),(new.id,'other','Other') on conflict do nothing;
  return new;
end $$;

insert into public.document_categories(organization_id,category_key,name)
select o.id,c.category_key,c.name from public.organizations o cross join (values
('referral','Referral'),('lab_result','Lab Result'),('imaging','Imaging'),('consent_form','Consent Form'),('prescription_placeholder','Prescription Placeholder'),('insurance','Insurance'),('invoice_attachment','Invoice Attachment'),('clinical_attachment','Clinical Attachment'),('administrative','Administrative'),('other','Other')) c(category_key,name) on conflict do nothing;
create trigger organizations_seed_document_categories after insert on public.organizations for each row execute function public.seed_document_categories();

create or replace function public.create_document_metadata(p_organization_id uuid,p_title text,p_description text,p_category_key text,p_patient_id uuid default null,p_encounter_id uuid default null,p_location_id uuid default null,p_practitioner_id uuid default null,p_mime_type text default null,p_file_size_bytes bigint default null,p_checksum_placeholder text default null,p_storage_provider_placeholder text default null,p_storage_path_placeholder text default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); category_id_value uuid; document_id uuid;
begin
  if caller_id is null or not public.documents_permission(p_organization_id,'create') then raise exception using errcode='42501',message='DOCUMENT_CREATE_FORBIDDEN'; end if;
  select id into category_id_value from public.document_categories where organization_id=p_organization_id and category_key=lower(btrim(p_category_key)) and active;
  if category_id_value is null then raise exception using errcode='22023',message='DOCUMENT_CATEGORY_NOT_FOUND'; end if;
  if p_encounter_id is not null and not exists(select 1 from public.encounters where id=p_encounter_id and organization_id=p_organization_id and (p_patient_id is null or patient_id=p_patient_id)) then raise exception using errcode='22023',message='DOCUMENT_ENCOUNTER_CONTEXT_INVALID'; end if;
  insert into public.documents(organization_id,title,description,category_id,patient_id,encounter_id,location_id,practitioner_id,mime_type,file_size_bytes,checksum_placeholder,storage_provider_placeholder,storage_path_placeholder,created_by,updated_by) values(p_organization_id,btrim(p_title),p_description,category_id_value,p_patient_id,p_encounter_id,p_location_id,p_practitioner_id,nullif(btrim(p_mime_type),''),p_file_size_bytes,p_checksum_placeholder,p_storage_provider_placeholder,p_storage_path_placeholder,caller_id,caller_id) returning id into document_id;
  insert into public.document_versions(organization_id,document_id,version_number,title,description,mime_type,file_size_bytes,checksum_placeholder,storage_provider_placeholder,storage_path_placeholder,created_by) values(p_organization_id,document_id,1,btrim(p_title),p_description,p_mime_type,p_file_size_bytes,p_checksum_placeholder,p_storage_provider_placeholder,p_storage_path_placeholder,caller_id);
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id) values(p_organization_id,document_id,'metadata_created',caller_id);
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,p_organization_id,'document.metadata_created','document',document_id,jsonb_build_object('patient_id',p_patient_id,'encounter_id',p_encounter_id));
  return document_id;
end $$;

create or replace function public.update_document_metadata(p_document_id uuid,p_title text,p_description text,p_category_key text,p_location_id uuid,p_practitioner_id uuid,p_mime_type text,p_file_size_bytes bigint,p_checksum_placeholder text,p_storage_provider_placeholder text,p_storage_path_placeholder text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); document_record public.documents%rowtype; category_id_value uuid;
begin
  select * into document_record from public.documents where id=p_document_id for update;
  if not found or caller_id is null or not public.documents_permission(document_record.organization_id,'update') or document_record.deleted then raise exception using errcode='42501',message='DOCUMENT_UPDATE_FORBIDDEN'; end if;
  select id into category_id_value from public.document_categories where organization_id=document_record.organization_id and category_key=lower(btrim(p_category_key)) and active;
  if category_id_value is null then raise exception using errcode='22023',message='DOCUMENT_CATEGORY_NOT_FOUND'; end if;
  update public.documents set title=btrim(p_title),description=p_description,category_id=category_id_value,location_id=p_location_id,practitioner_id=p_practitioner_id,mime_type=nullif(btrim(p_mime_type),''),file_size_bytes=p_file_size_bytes,checksum_placeholder=p_checksum_placeholder,storage_provider_placeholder=p_storage_provider_placeholder,storage_path_placeholder=p_storage_path_placeholder,updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_document_id;
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id) values(document_record.organization_id,p_document_id,'metadata_updated',caller_id);
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,before_metadata,after_metadata) values(caller_id,document_record.organization_id,'document.metadata_updated','document',p_document_id,jsonb_build_object('title',document_record.title),jsonb_build_object('title',btrim(p_title)));
  return true;
end $$;

create or replace function public.archive_document(p_document_id uuid,p_reason text default null)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); document_record public.documents%rowtype;
begin
  select * into document_record from public.documents where id=p_document_id for update;
  if not found or caller_id is null or not public.documents_permission(document_record.organization_id,'archive') then raise exception using errcode='42501',message='DOCUMENT_ARCHIVE_FORBIDDEN'; end if;
  update public.documents set archived=true,archived_at=timezone('utc',now()),updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_document_id;
  insert into public.document_access_log(organization_id,document_id,actor_profile_id,access_action,metadata) values(document_record.organization_id,p_document_id,caller_id,'delete',jsonb_build_object('reason',left(coalesce(p_reason,''),500)));
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id) values(document_record.organization_id,p_document_id,'archived',caller_id);
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,document_record.organization_id,'document.archived','document',p_document_id,jsonb_build_object('reason',left(coalesce(p_reason,''),500)));
  return true;
end $$;

create or replace function public.restore_document(p_document_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); document_record public.documents%rowtype;
begin
  select * into document_record from public.documents where id=p_document_id for update;
  if not found or caller_id is null or not public.documents_permission(document_record.organization_id,'archive') then raise exception using errcode='42501',message='DOCUMENT_RESTORE_FORBIDDEN'; end if;
  update public.documents set archived=false,archived_at=null,deleted=false,updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_document_id;
  insert into public.document_access_log(organization_id,document_id,actor_profile_id,access_action) values(document_record.organization_id,p_document_id,caller_id,'restore');
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id) values(document_record.organization_id,p_document_id,'restored',caller_id);
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,document_record.organization_id,'document.restored','document',p_document_id);
  return true;
end $$;

create or replace function public.list_patient_documents(p_patient_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare org_id uuid; portal_patient_id uuid; result jsonb;
begin
  select organization_id into org_id from public.patients where id=p_patient_id;
  portal_patient_id:=public.patient_portal_patient_id();
  if portal_patient_id is not null then if portal_patient_id<>p_patient_id then raise exception using errcode='42501',message='DOCUMENT_PATIENT_FORBIDDEN'; end if;
  elsif org_id is null or not public.documents_permission(org_id,'read') then raise exception using errcode='42501',message='DOCUMENT_READ_FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'description',d.description,'category',c.name,'mimeType',d.mime_type,'fileSizeBytes',d.file_size_bytes,'archived',d.archived,'createdAt',d.created_at) order by d.created_at desc),'[]'::jsonb) into result from public.documents d left join public.document_categories c on c.id=d.category_id and c.organization_id=d.organization_id where d.patient_id=p_patient_id and d.organization_id=org_id and not d.deleted;
  return result;
end $$;

create or replace function public.list_encounter_documents(p_encounter_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare org_id uuid; patient_id_value uuid; portal_patient_id uuid; result jsonb;
begin
  select organization_id,patient_id into org_id,patient_id_value from public.encounters where id=p_encounter_id;
  portal_patient_id:=public.patient_portal_patient_id();
  if portal_patient_id is not null then if portal_patient_id<>patient_id_value then raise exception using errcode='42501',message='DOCUMENT_ENCOUNTER_FORBIDDEN'; end if;
  elsif org_id is null or not public.documents_permission(org_id,'read') then raise exception using errcode='42501',message='DOCUMENT_READ_FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'category',c.name,'mimeType',d.mime_type,'fileSizeBytes',d.file_size_bytes,'archived',d.archived,'createdAt',d.created_at) order by d.created_at desc),'[]'::jsonb) into result from public.documents d left join public.document_categories c on c.id=d.category_id and c.organization_id=d.organization_id where d.encounter_id=p_encounter_id and d.organization_id=org_id and not d.deleted;
  return result;
end $$;

create or replace function public.record_document_access(p_document_id uuid,p_access_action text,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); portal_patient_id uuid:=public.patient_portal_patient_id(); document_record public.documents%rowtype; access_id uuid;
begin
  select * into document_record from public.documents where id=p_document_id;
  if not found or (portal_patient_id is null and (caller_id is null or not public.documents_permission(document_record.organization_id,'read'))) or (portal_patient_id is not null and document_record.patient_id<>portal_patient_id) then raise exception using errcode='42501',message='DOCUMENT_ACCESS_FORBIDDEN'; end if;
  insert into public.document_access_log(organization_id,document_id,actor_profile_id,actor_patient_id,access_action,metadata) values(document_record.organization_id,p_document_id,caller_id,portal_patient_id,p_access_action,coalesce(p_metadata,'{}'::jsonb)) returning id into access_id;
  return access_id;
end $$;

create or replace function public.create_document_version(p_document_id uuid,p_title text,p_description text,p_mime_type text,p_file_size_bytes bigint,p_checksum_placeholder text,p_storage_provider_placeholder text,p_storage_path_placeholder text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); document_record public.documents%rowtype; previous_id uuid; next_version integer; version_id uuid;
begin
  select * into document_record from public.documents where id=p_document_id for update;
  if not found or caller_id is null or not public.documents_permission(document_record.organization_id,'update') or document_record.deleted then raise exception using errcode='42501',message='DOCUMENT_VERSION_FORBIDDEN'; end if;
  select id,version_number into previous_id,next_version from public.document_versions where document_id=p_document_id and is_current for update;
  update public.document_versions set is_current=false where id=previous_id;
  insert into public.document_versions(organization_id,document_id,version_number,previous_version_id,title,description,mime_type,file_size_bytes,checksum_placeholder,storage_provider_placeholder,storage_path_placeholder,created_by) values(document_record.organization_id,p_document_id,coalesce(next_version,0)+1,previous_id,p_title,p_description,p_mime_type,p_file_size_bytes,p_checksum_placeholder,p_storage_provider_placeholder,p_storage_path_placeholder,caller_id) returning id into version_id;
  update public.documents set title=coalesce(p_title,title),description=coalesce(p_description,description),mime_type=coalesce(p_mime_type,mime_type),file_size_bytes=coalesce(p_file_size_bytes,file_size_bytes),checksum_placeholder=coalesce(p_checksum_placeholder,checksum_placeholder),storage_provider_placeholder=coalesce(p_storage_provider_placeholder,storage_provider_placeholder),storage_path_placeholder=coalesce(p_storage_path_placeholder,storage_path_placeholder),updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_document_id;
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id) values(document_record.organization_id,p_document_id,'version_created',caller_id);
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,document_record.organization_id,'document.version_created','document',p_document_id,jsonb_build_object('version_id',version_id));
  return version_id;
end $$;

create or replace function public.update_document_retention(p_document_id uuid,p_retention_status text,p_scheduled_deletion_at timestamptz default null,p_legal_hold boolean default false)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); document_record public.documents%rowtype;
begin
  select * into document_record from public.documents where id=p_document_id for update;
  if not found or caller_id is null or not public.documents_permission(document_record.organization_id,'manage_retention') then raise exception using errcode='42501',message='DOCUMENT_RETENTION_FORBIDDEN'; end if;
  update public.documents set retention_status=p_retention_status,scheduled_deletion_at=p_scheduled_deletion_at,updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_document_id;
  insert into public.document_events(organization_id,document_id,event_type,actor_profile_id,metadata) values(document_record.organization_id,p_document_id,'retention_updated',caller_id,jsonb_build_object('retention_status',p_retention_status,'legal_hold',p_legal_hold));
  insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,document_record.organization_id,'document.retention_updated','document',p_document_id,jsonb_build_object('retention_status',p_retention_status,'scheduled_deletion_at',p_scheduled_deletion_at,'legal_hold',p_legal_hold));
  return true;
end $$;

revoke all on function public.documents_permission(uuid,text),public.seed_document_categories() from public;
grant execute on function public.documents_permission(uuid,text),public.create_document_metadata(uuid,text,text,text,uuid,uuid,uuid,uuid,text,bigint,text,text,text),public.update_document_metadata(uuid,text,text,text,uuid,uuid,text,bigint,text,text,text),public.archive_document(uuid,text),public.restore_document(uuid),public.list_patient_documents(uuid),public.list_encounter_documents(uuid),public.record_document_access(uuid,text,jsonb),public.create_document_version(uuid,text,text,text,bigint,text,text,text),public.update_document_retention(uuid,text,timestamptz,boolean) to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['document_categories','documents','document_versions','document_access_log','document_retention_rules','document_shares_placeholder','document_events'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('grant select on public.%I to authenticated',table_name);
    if table_name='documents' then
      execute 'create policy documents_select on public.documents for select to authenticated using (public.documents_permission(organization_id,''read'') or patient_id=public.patient_portal_patient_id())';
    elsif table_name='document_versions' then
      execute 'create policy document_versions_select on public.document_versions for select to authenticated using (exists(select 1 from public.documents d where d.id=document_id and d.organization_id=document_versions.organization_id and (public.documents_permission(d.organization_id,''read'') or d.patient_id=public.patient_portal_patient_id())))';
    elsif table_name='document_categories' then
      execute 'create policy document_categories_select on public.document_categories for select to authenticated using (public.documents_permission(organization_id,''read''))';
    elsif table_name='document_retention_rules' then
      execute 'create policy document_retention_rules_select on public.document_retention_rules for select to authenticated using (public.documents_permission(organization_id,''manage_retention''))';
    else
      execute format('create policy %I_select on public.%I for select to authenticated using (public.documents_permission(organization_id,''read''))',table_name,table_name);
    end if;
    execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check(false)',table_name,table_name);
    execute format('create policy %I_update_denied on public.%I for update to authenticated using(false) with check(false)',table_name,table_name);
    execute format('create policy %I_delete_denied on public.%I for delete to authenticated using(false)',table_name,table_name);
  end loop;
end $$;

create trigger document_categories_set_updated_at before update on public.document_categories for each row execute function public.set_updated_at();
create trigger document_retention_rules_set_updated_at before update on public.document_retention_rules for each row execute function public.set_updated_at();
comment on table public.documents is 'Organization-scoped document metadata only; no file storage integration.';
comment on table public.document_versions is 'Immutable document metadata versions; storage fields are placeholders.';
