insert into public.permissions(key,domain,action,description)
values
 ('integrations.read','integrations','read','Read integration metadata'),
 ('integrations.manage','integrations','manage','Manage integration connections and jobs'),
 ('integrations.api','integrations','api','Manage organization API-key metadata'),
 ('integrations.webhooks','integrations','webhooks','Manage webhook metadata and delivery records')
on conflict(key) do update set description=excluded.description,status='active';

do $$ declare permission_key text; begin
 foreach permission_key in array array['integrations.read','integrations.manage','integrations.api','integrations.webhooks'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key in('organization.owner','organization.admin','clinic.admin') and r.organization_id is null on conflict do nothing;
 end loop;
 foreach permission_key in array array['integrations.read','integrations.manage'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key='practitioner' and r.organization_id is null on conflict do nothing;
 end loop;
 insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key='integrations.read' where r.key='receptionist' and r.organization_id is null on conflict do nothing;
end $$;

create table public.integration_providers(
 id uuid primary key default gen_random_uuid(), provider_key text not null unique check(provider_key=lower(provider_key)), display_name text not null, provider_type text not null check(provider_type in('fhir','hl7','google_calendar','microsoft_365_calendar','stripe','square','moneris','zoom','google_meet','twilio','sendgrid','laboratory','imaging_pacs','custom')), active boolean not null default true, capabilities_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(capabilities_placeholder)='object'), created_at timestamptz not null default timezone('utc',now())
);

insert into public.integration_providers(provider_key,display_name,provider_type) values
('fhir','FHIR','fhir'),('hl7','HL7','hl7'),('google_calendar','Google Calendar','google_calendar'),('microsoft_365_calendar','Microsoft 365 Calendar','microsoft_365_calendar'),('stripe','Stripe','stripe'),('square','Square','square'),('moneris','Moneris','moneris'),('zoom','Zoom','zoom'),('google_meet','Google Meet','google_meet'),('twilio','Twilio','twilio'),('sendgrid','SendGrid','sendgrid'),('laboratory','Laboratory','laboratory'),('imaging_pacs','Imaging/PACS','imaging_pacs'),('custom','Custom','custom') on conflict do nothing;

create table public.integration_connections(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, provider_id uuid not null references public.integration_providers(id) on delete restrict,
 name text not null check(char_length(btrim(name)) between 1 and 160), status text not null default 'placeholder' check(status in('placeholder','active','disabled','error')), external_account_placeholder text, configuration_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(configuration_placeholder)='object'),
 created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()), unique(organization_id,name), unique(id,organization_id)
);

create table public.integration_credentials_placeholder(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, credential_type text not null default 'placeholder', secret_reference_placeholder text, expires_at timestamptz, status text not null default 'placeholder' check(status='placeholder'), created_at timestamptz not null default timezone('utc',now()),
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete cascade
);

create table public.integration_webhooks(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, direction text not null check(direction in('incoming','outgoing')), event_type text not null check(char_length(btrim(event_type)) between 1 and 160), endpoint_placeholder text, signature_placeholder text, payload_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(payload_placeholder)='object'), delivery_attempts integer not null default 0 check(delivery_attempts>=0), retry_count integer not null default 0 check(retry_count>=0), status text not null default 'placeholder' check(status in('placeholder','queued','processing','delivered','failed','cancelled')), last_attempt_at timestamptz, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()),
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete set null, unique(id,organization_id)
);

create table public.integration_events(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, event_type text not null, payload_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(payload_metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()), created_by uuid references public.profiles(id) on delete set null,
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete set null
);

create table public.integration_jobs(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, job_type text not null check(char_length(btrim(job_type)) between 1 and 160), payload_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(payload_metadata)='object'), status text not null default 'queued' check(status in('queued','processing','completed','failed','cancelled')), retry_count integer not null default 0 check(retry_count>=0), run_after timestamptz not null default timezone('utc',now()), started_at timestamptz, completed_at timestamptz, last_error_placeholder text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete set null, unique(id,organization_id)
);

create table public.integration_logs(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, job_id uuid, level text not null check(level in('info','warning','error')), message_placeholder text not null, metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()),
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete set null, foreign key(job_id,organization_id) references public.integration_jobs(id,organization_id) on delete set null
);

create table public.api_clients(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null check(char_length(btrim(name)) between 1 and 160), description text, status text not null default 'active' check(status in('active','disabled','revoked')), created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), unique(organization_id,name), unique(id,organization_id)
);

create table public.api_keys(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, api_client_id uuid, name text not null check(char_length(btrim(name)) between 1 and 160), permissions jsonb not null default '[]'::jsonb check(jsonb_typeof(permissions)='array'), key_prefix_placeholder text not null default 'mbp_placeholder', created_by uuid references public.profiles(id) on delete set null, rotation_date timestamptz, last_used_at timestamptz, status text not null default 'active' check(status in('active','revoked','expired')), revoked boolean not null default false, revoked_at timestamptz, created_at timestamptz not null default timezone('utc',now()),
 foreign key(api_client_id,organization_id) references public.api_clients(id,organization_id) on delete set null, unique(organization_id,name), unique(id,organization_id), constraint api_key_revocation_check check((revoked and status='revoked') or not revoked), constraint api_key_permissions_check check(jsonb_typeof(permissions)='array')
);

create table public.oauth_connections_placeholder(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, connection_id uuid, provider text not null, authorization_status text not null default 'placeholder' check(authorization_status='placeholder'), token_reference_placeholder text, created_at timestamptz not null default timezone('utc',now()),
 foreign key(connection_id,organization_id) references public.integration_connections(id,organization_id) on delete cascade
);

create or replace function public.integrations_permission(target_organization_id uuid,required_action text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select public.has_permission(target_organization_id,'integrations.'||required_action) $$;

create or replace function public.current_integration_organization()
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select organization_id from public.organization_memberships where profile_id=public.current_profile_id() and status='active' order by created_at limit 1 $$;

create or replace function public.create_api_key(p_name text,p_permissions jsonb,p_rotation_date timestamptz default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_integration_organization(); key_id uuid;
begin
 if caller_id is null or org_id is null or not public.integrations_permission(org_id,'api') then raise exception using errcode='42501',message='INTEGRATION_API_FORBIDDEN'; end if;
 insert into public.api_keys(organization_id,name,permissions,rotation_date,created_by) values(org_id,btrim(p_name),coalesce(p_permissions,'[]'::jsonb),p_rotation_date,caller_id) returning id into key_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,org_id,'integration.api_key_created','api_key',key_id,jsonb_build_object('name',btrim(p_name)));
 return key_id;
end $$;

create or replace function public.revoke_api_key(p_api_key_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid; key_record public.api_keys%rowtype;
begin
 select * into key_record from public.api_keys where id=p_api_key_id; org_id:=key_record.organization_id;
 if not found or caller_id is null or not public.integrations_permission(org_id,'api') then raise exception using errcode='42501',message='INTEGRATION_API_FORBIDDEN'; end if;
 update public.api_keys set revoked=true,status='revoked',revoked_at=timezone('utc',now()) where id=p_api_key_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,org_id,'integration.api_key_revoked','api_key',p_api_key_id); return true;
end $$;

create or replace function public.rotate_key(p_api_key_id uuid,p_rotation_date timestamptz default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); key_record public.api_keys%rowtype;
begin
 select * into key_record from public.api_keys where id=p_api_key_id for update; if not found or caller_id is null or not public.integrations_permission(key_record.organization_id,'api') then raise exception using errcode='42501',message='INTEGRATION_API_FORBIDDEN'; end if;
 update public.api_keys set key_prefix_placeholder='mbp_rotated_placeholder',rotation_date=coalesce(p_rotation_date,timezone('utc',now())) where id=p_api_key_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,key_record.organization_id,'integration.api_key_rotated','api_key',p_api_key_id); return p_api_key_id;
end $$;

create or replace function public.list_integrations()
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_integration_organization(); result jsonb;
begin
 if caller_id is null or org_id is null or not public.integrations_permission(org_id,'read') then raise exception using errcode='42501',message='INTEGRATION_READ_FORBIDDEN'; end if;
 select jsonb_build_object('providers',(select coalesce(jsonb_agg(to_jsonb(p) order by p.display_name),'[]'::jsonb) from public.integration_providers p where p.active),'connections',(select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at desc),'[]'::jsonb) from public.integration_connections c where c.organization_id=org_id),'webhooks',(select count(*) from public.integration_webhooks w where w.organization_id=org_id),'jobs',(select count(*) from public.integration_jobs j where j.organization_id=org_id and j.status in('queued','processing'))) into result; return result;
end $$;

create or replace function public.create_connection_placeholder(p_provider_key text,p_name text,p_external_account_placeholder text default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_integration_organization(); provider_id_value uuid; connection_id uuid;
begin
 if caller_id is null or org_id is null or not public.integrations_permission(org_id,'manage') then raise exception using errcode='42501',message='INTEGRATION_MANAGE_FORBIDDEN'; end if;
 select id into provider_id_value from public.integration_providers where provider_key=lower(btrim(p_provider_key)) and active; if provider_id_value is null then raise exception using errcode='22023',message='INTEGRATION_PROVIDER_NOT_FOUND'; end if;
 insert into public.integration_connections(organization_id,provider_id,name,external_account_placeholder,created_by,updated_by) values(org_id,provider_id_value,btrim(p_name),p_external_account_placeholder,caller_id,caller_id) returning id into connection_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,org_id,'integration.connection_created','integration_connection',connection_id,jsonb_build_object('provider_key',p_provider_key)); return connection_id;
end $$;

create or replace function public.record_webhook(p_connection_id uuid,p_direction text,p_event_type text,p_endpoint_placeholder text default null,p_payload_placeholder jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); connection_record public.integration_connections%rowtype; webhook_id uuid;
begin
 select * into connection_record from public.integration_connections where id=p_connection_id; if not found or caller_id is null or not public.integrations_permission(connection_record.organization_id,'webhooks') then raise exception using errcode='42501',message='INTEGRATION_WEBHOOK_FORBIDDEN'; end if;
 insert into public.integration_webhooks(organization_id,connection_id,direction,event_type,endpoint_placeholder,payload_placeholder,created_by) values(connection_record.organization_id,p_connection_id,p_direction,p_event_type,p_endpoint_placeholder,coalesce(p_payload_placeholder,'{}'::jsonb),caller_id) returning id into webhook_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,connection_record.organization_id,'integration.webhook_registered','integration_webhook',webhook_id); return webhook_id;
end $$;

create or replace function public.queue_job(p_job_type text,p_payload_metadata jsonb default '{}'::jsonb,p_connection_id uuid default null,p_run_after timestamptz default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_integration_organization(); job_id uuid;
begin
 if caller_id is null or org_id is null or not public.integrations_permission(org_id,'manage') then raise exception using errcode='42501',message='INTEGRATION_JOB_FORBIDDEN'; end if;
 if p_connection_id is not null and not exists(select 1 from public.integration_connections where id=p_connection_id and organization_id=org_id) then raise exception using errcode='22023',message='INTEGRATION_CONNECTION_CONTEXT_INVALID'; end if;
 insert into public.integration_jobs(organization_id,connection_id,job_type,payload_metadata,run_after,created_by) values(org_id,p_connection_id,p_job_type,coalesce(p_payload_metadata,'{}'::jsonb),coalesce(p_run_after,timezone('utc',now())),caller_id) returning id into job_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,org_id,'integration.job_queued','integration_job',job_id); return job_id;
end $$;

create or replace function public.retry_job(p_job_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); job_record public.integration_jobs%rowtype;
begin
 select * into job_record from public.integration_jobs where id=p_job_id for update; if not found or caller_id is null or not public.integrations_permission(job_record.organization_id,'manage') then raise exception using errcode='42501',message='INTEGRATION_JOB_FORBIDDEN'; end if;
 update public.integration_jobs set status='queued',retry_count=retry_count+1,last_error_placeholder=null,updated_at=timezone('utc',now()) where id=p_job_id;
 insert into public.integration_logs(organization_id,job_id,level,message_placeholder,metadata) values(job_record.organization_id,p_job_id,'info','Job retry queued',jsonb_build_object('retry_count',job_record.retry_count+1));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,job_record.organization_id,'integration.job_retried','integration_job',p_job_id,jsonb_build_object('retry_count',job_record.retry_count+1)); return true;
end $$;

revoke all on function public.integrations_permission(uuid,text),public.current_integration_organization() from public;
grant execute on function public.integrations_permission(uuid,text),public.create_api_key(text,jsonb,timestamptz),public.revoke_api_key(uuid),public.rotate_key(uuid,timestamptz),public.list_integrations(),public.create_connection_placeholder(text,text,text),public.record_webhook(uuid,text,text,text,jsonb),public.queue_job(text,jsonb,uuid,timestamptz),public.retry_job(uuid) to authenticated;

do $$ declare table_name text; begin
 foreach table_name in array array['integration_providers','integration_connections','integration_credentials_placeholder','integration_webhooks','integration_events','integration_jobs','integration_logs','api_keys','api_clients','oauth_connections_placeholder'] loop
  execute format('alter table public.%I enable row level security',table_name); execute format('grant select on public.%I to authenticated',table_name);
  if table_name='integration_providers' then execute 'create policy integration_providers_select on public.integration_providers for select to authenticated using(true)';
  elsif table_name='api_keys' then execute 'create policy api_keys_select on public.api_keys for select to authenticated using(public.integrations_permission(organization_id,''api''))';
  elsif table_name in('integration_webhooks') then execute format('create policy %I_select on public.%I for select to authenticated using(public.integrations_permission(organization_id,''webhooks''))',table_name,table_name);
  else execute format('create policy %I_select on public.%I for select to authenticated using(public.integrations_permission(organization_id,''read''))',table_name,table_name);
  end if;
  execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check(false)',table_name,table_name);
  execute format('create policy %I_update_denied on public.%I for update to authenticated using(false) with check(false)',table_name,table_name);
  execute format('create policy %I_delete_denied on public.%I for delete to authenticated using(false)',table_name,table_name);
 end loop;
end $$;

create trigger integration_connections_updated_at before update on public.integration_connections for each row execute function public.set_updated_at();
create trigger integration_jobs_updated_at before update on public.integration_jobs for each row execute function public.set_updated_at();
