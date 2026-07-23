insert into public.permissions(key,domain,action,description)
values
 ('ai.read','ai','read','Read AI assistant metadata and usage'),
 ('ai.use','ai','use','Create and review AI assistant requests'),
 ('ai.manage','ai','manage','Manage AI providers and governance'),
 ('ai.prompts','ai','prompts','Manage AI prompt definitions and versions')
on conflict(key) do update set description=excluded.description,status='active';

do $$ declare permission_key text; begin
 foreach permission_key in array array['ai.read','ai.use','ai.manage','ai.prompts'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key in('organization.owner','organization.admin','clinic.admin') and r.organization_id is null on conflict do nothing;
 end loop;
 foreach permission_key in array array['ai.read','ai.use','ai.prompts'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key='practitioner' and r.organization_id is null on conflict do nothing;
 end loop;
 insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key='ai.read' where r.key='receptionist' and r.organization_id is null on conflict do nothing;
end $$;

create table public.ai_providers(
 id uuid primary key default gen_random_uuid(), provider_key text not null unique check(provider_key=lower(provider_key)), display_name text not null, provider_type text not null check(provider_type in('openai','azure_openai','anthropic','google_gemini','aws_bedrock','local_llm','custom_provider')), active boolean not null default true, capabilities_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(capabilities_placeholder)='object'), created_at timestamptz not null default timezone('utc',now())
);

insert into public.ai_providers(provider_key,display_name,provider_type) values
('openai','OpenAI','openai'),('azure_openai','Azure OpenAI','azure_openai'),('anthropic','Anthropic','anthropic'),('google_gemini','Google Gemini','google_gemini'),('aws_bedrock','AWS Bedrock','aws_bedrock'),('local_llm','Local LLM','local_llm'),('custom_provider','Custom Provider','custom_provider') on conflict do nothing;

create table public.ai_models(
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.ai_providers(id) on delete cascade, model_key text not null, display_name text not null, active boolean not null default true, model_metadata_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(model_metadata_placeholder)='object'), created_at timestamptz not null default timezone('utc',now()), unique(provider_id,model_key)
);

create table public.ai_prompts(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null check(char_length(btrim(name)) between 1 and 160), category text not null check(category in('clinical_note_drafting','soap_assistance','diagnosis_suggestions','procedure_coding','care_plan_drafting','document_summarization','referral_drafting','patient_education','clinical_letter_drafting')), status text not null default 'draft' check(status in('draft','published','archived')), approval_state text not null default 'draft' check(approval_state in('draft','pending_review','approved','rejected')), created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()), unique(organization_id,name), unique(id,organization_id)
);

create table public.ai_prompt_versions(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, prompt_id uuid not null, version_number integer not null check(version_number>0), system_prompt text not null default '', user_template text not null default '', variables jsonb not null default '{}'::jsonb check(jsonb_typeof(variables)='object'), status text not null default 'draft' check(status in('draft','published','archived')), approval_state text not null default 'draft' check(approval_state in('draft','pending_review','approved','rejected')), approved_by uuid references public.profiles(id) on delete set null, approved_at timestamptz, published_at timestamptz, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), foreign key(prompt_id,organization_id) references public.ai_prompts(id,organization_id) on delete cascade, unique(prompt_id,version_number), unique(id,organization_id)
);

create table public.ai_requests(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id uuid, encounter_id uuid, provider_id uuid, model_id uuid, prompt_version_id uuid,
 request_type text not null check(request_type in('clinical_note_drafting','soap_assistance','diagnosis_suggestions','procedure_coding','care_plan_drafting','document_summarization','referral_drafting','patient_education','clinical_letter_drafting')),
 status text not null default 'queued' check(status in('queued','processing','completed','failed','blocked')), requested_at timestamptz not null default timezone('utc',now()), responded_at timestamptz, latency_ms integer, input_tokens_placeholder integer, output_tokens_placeholder integer, cost_placeholder numeric(12,6), human_review_required boolean not null default true, clinical_disclaimer text not null default 'AI output is assistive and requires qualified human review.', confidence_placeholder numeric(5,4), approved_by uuid references public.profiles(id) on delete set null, reviewed_at timestamptz, blocked boolean not null default false, created_by uuid references public.profiles(id) on delete set null,
 foreign key(patient_id,organization_id) references public.patients(id,organization_id) on delete restrict, foreign key(encounter_id,organization_id) references public.encounters(id,organization_id) on delete restrict, foreign key(prompt_version_id,organization_id) references public.ai_prompt_versions(id,organization_id) on delete restrict, unique(id,organization_id)
);

create table public.ai_responses(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, request_id uuid not null, response_placeholder text not null default 'No provider response stored in foundation', responded_at timestamptz not null default timezone('utc',now()), latency_ms integer, input_tokens_placeholder integer, output_tokens_placeholder integer, cost_placeholder numeric(12,6), confidence_placeholder numeric(5,4), human_review_required boolean not null default true, approved_by uuid references public.profiles(id) on delete set null, reviewed_at timestamptz, blocked boolean not null default false, created_by uuid references public.profiles(id) on delete set null,
 foreign key(request_id,organization_id) references public.ai_requests(id,organization_id) on delete cascade, unique(request_id), unique(id,organization_id)
);

create table public.ai_feedback(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, request_id uuid not null, response_id uuid, rating integer check(rating between 1 and 5), feedback_placeholder text, submitted_by uuid references public.profiles(id) on delete set null, reviewed boolean not null default false, created_at timestamptz not null default timezone('utc',now()),
 foreign key(request_id,organization_id) references public.ai_requests(id,organization_id) on delete cascade, foreign key(response_id,organization_id) references public.ai_responses(id,organization_id) on delete set null
);

create table public.ai_usage_metrics(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, metric_date date not null, request_count integer not null default 0, completed_count integer not null default 0, blocked_count integer not null default 0, input_tokens_placeholder bigint not null default 0, output_tokens_placeholder bigint not null default 0, cost_placeholder numeric(12,6) not null default 0, unique(organization_id,metric_date)
);

create table public.ai_provider_settings(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, provider_id uuid not null references public.ai_providers(id) on delete restrict, enabled boolean not null default false, configuration_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(configuration_placeholder)='object'), human_review_required boolean not null default true, created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, updated_at timestamptz not null default timezone('utc',now()), unique(organization_id,provider_id)
);

create table public.ai_events(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, request_id uuid, prompt_id uuid, event_type text not null check(event_type=lower(event_type) and char_length(btrim(event_type)) between 1 and 120), actor_profile_id uuid references public.profiles(id) on delete set null, metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()),
 foreign key(request_id,organization_id) references public.ai_requests(id,organization_id) on delete set null, foreign key(prompt_id,organization_id) references public.ai_prompts(id,organization_id) on delete set null
);

create or replace function public.ai_permission(target_organization_id uuid,required_action text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select public.has_permission(target_organization_id,'ai.'||required_action) $$;

create or replace function public.current_ai_organization()
returns uuid language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select organization_id from public.organization_memberships where profile_id=public.current_profile_id() and status='active' order by created_at limit 1 $$;

create or replace function public.create_prompt(p_name text,p_category text,p_system_prompt text,p_user_template text,p_variables jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_ai_organization(); prompt_id uuid; version_id uuid;
begin
 if caller_id is null or org_id is null or not public.ai_permission(org_id,'prompts') then raise exception using errcode='42501',message='AI_PROMPT_FORBIDDEN'; end if;
 insert into public.ai_prompts(organization_id,name,category,created_by,updated_by) values(org_id,btrim(p_name),p_category,caller_id,caller_id) returning id into prompt_id;
 insert into public.ai_prompt_versions(organization_id,prompt_id,version_number,system_prompt,user_template,variables,created_by) values(org_id,prompt_id,1,p_system_prompt,p_user_template,coalesce(p_variables,'{}'::jsonb),caller_id) returning id into version_id;
 insert into public.ai_events(organization_id,prompt_id,event_type,actor_profile_id,metadata) values(org_id,prompt_id,'prompt_created',caller_id,jsonb_build_object('version_id',version_id));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,org_id,'ai.prompt_created','ai_prompt',prompt_id,jsonb_build_object('version_id',version_id)); return prompt_id;
end $$;

create or replace function public.publish_prompt(p_prompt_id uuid,p_version_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); prompt_record public.ai_prompts%rowtype; version_record public.ai_prompt_versions%rowtype;
begin
 select * into prompt_record from public.ai_prompts where id=p_prompt_id for update; select * into version_record from public.ai_prompt_versions where id=p_version_id and prompt_id=p_prompt_id and organization_id=prompt_record.organization_id for update;
 if not found or caller_id is null or not public.ai_permission(prompt_record.organization_id,'prompts') then raise exception using errcode='42501',message='AI_PROMPT_PUBLISH_FORBIDDEN'; end if;
 update public.ai_prompt_versions set status='published',approval_state='approved',approved_by=caller_id,approved_at=timezone('utc',now()),published_at=timezone('utc',now()) where id=p_version_id;
 update public.ai_prompts set status='published',approval_state='approved',updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_prompt_id;
 insert into public.ai_events(organization_id,prompt_id,event_type,actor_profile_id,metadata) values(prompt_record.organization_id,p_prompt_id,'prompt_published',caller_id,jsonb_build_object('version_id',p_version_id));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,prompt_record.organization_id,'ai.prompt_published','ai_prompt',p_prompt_id,jsonb_build_object('version_id',p_version_id)); return true;
end $$;

create or replace function public.create_ai_request(p_patient_id uuid,p_encounter_id uuid,p_prompt_version_id uuid,p_request_type text,p_provider_key text default null,p_model_key text default null)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_ai_organization(); request_id uuid; provider_id_value uuid; model_id_value uuid;
begin
 if caller_id is null or org_id is null or not public.ai_permission(org_id,'use') then raise exception using errcode='42501',message='AI_USE_FORBIDDEN'; end if;
 if p_patient_id is not null and not exists(select 1 from public.patients where id=p_patient_id and organization_id=org_id) then raise exception using errcode='22023',message='AI_PATIENT_CONTEXT_INVALID'; end if;
 if p_encounter_id is not null and not exists(select 1 from public.encounters where id=p_encounter_id and organization_id=org_id and (p_patient_id is null or patient_id=p_patient_id)) then raise exception using errcode='22023',message='AI_ENCOUNTER_CONTEXT_INVALID'; end if;
 if not exists(select 1 from public.ai_prompt_versions where id=p_prompt_version_id and organization_id=org_id and status='published' and approval_state='approved') then raise exception using errcode='22023',message='AI_PROMPT_NOT_PUBLISHED'; end if;
 select id into provider_id_value from public.ai_providers where provider_key=lower(btrim(p_provider_key)) and active; if p_provider_key is not null and provider_id_value is null then raise exception using errcode='22023',message='AI_PROVIDER_NOT_FOUND'; end if;
 select m.id into model_id_value from public.ai_models m join public.ai_providers p on p.id=m.provider_id where m.model_key=lower(btrim(p_model_key)) and m.active and (provider_id_value is null or m.provider_id=provider_id_value);
 insert into public.ai_requests(organization_id,patient_id,encounter_id,provider_id,model_id,prompt_version_id,request_type,created_by) values(org_id,p_patient_id,p_encounter_id,provider_id_value,model_id_value,p_prompt_version_id,p_request_type,caller_id) returning id into request_id;
 insert into public.ai_events(organization_id,request_id,event_type,actor_profile_id) values(org_id,request_id,'request_created',caller_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,org_id,'ai.request_created','ai_request',request_id,jsonb_build_object('request_type',p_request_type,'patient_id',p_patient_id,'encounter_id',p_encounter_id)); return request_id;
end $$;

create or replace function public.record_ai_response(p_request_id uuid,p_response_placeholder text,p_latency_ms integer default null,p_input_tokens_placeholder integer default null,p_output_tokens_placeholder integer default null,p_cost_placeholder numeric default null,p_confidence_placeholder numeric default null,p_blocked boolean default false)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); request_record public.ai_requests%rowtype; response_id uuid;
begin
 select * into request_record from public.ai_requests where id=p_request_id for update; if not found or caller_id is null or not public.ai_permission(request_record.organization_id,'use') then raise exception using errcode='42501',message='AI_RESPONSE_FORBIDDEN'; end if;
 insert into public.ai_responses(organization_id,request_id,response_placeholder,latency_ms,input_tokens_placeholder,output_tokens_placeholder,cost_placeholder,confidence_placeholder,blocked,created_by) values(request_record.organization_id,p_request_id,coalesce(p_response_placeholder,'No provider response stored in foundation'),p_latency_ms,p_input_tokens_placeholder,p_output_tokens_placeholder,p_cost_placeholder,p_confidence_placeholder,p_blocked,caller_id) returning id into response_id;
 update public.ai_requests set status=case when p_blocked then 'blocked' else 'completed' end,responded_at=timezone('utc',now()),latency_ms=p_latency_ms,input_tokens_placeholder=p_input_tokens_placeholder,output_tokens_placeholder=p_output_tokens_placeholder,cost_placeholder=p_cost_placeholder,confidence_placeholder=p_confidence_placeholder,blocked=p_blocked where id=p_request_id;
 insert into public.ai_events(organization_id,request_id,event_type,actor_profile_id,metadata) values(request_record.organization_id,p_request_id,'response_recorded',caller_id,jsonb_build_object('response_id',response_id,'blocked',p_blocked));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,request_record.organization_id,'ai.response_recorded','ai_response',response_id,jsonb_build_object('request_id',p_request_id,'blocked',p_blocked)); return response_id;
end $$;

create or replace function public.submit_feedback(p_request_id uuid,p_response_id uuid,p_rating integer,p_feedback_placeholder text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); request_record public.ai_requests%rowtype; feedback_id uuid;
begin
 select * into request_record from public.ai_requests where id=p_request_id; if not found or caller_id is null or not public.ai_permission(request_record.organization_id,'use') then raise exception using errcode='42501',message='AI_FEEDBACK_FORBIDDEN'; end if;
 if p_response_id is not null and not exists(select 1 from public.ai_responses where id=p_response_id and organization_id=request_record.organization_id and request_id=p_request_id) then raise exception using errcode='22023',message='AI_RESPONSE_CONTEXT_INVALID'; end if;
 insert into public.ai_feedback(organization_id,request_id,response_id,rating,feedback_placeholder,submitted_by) values(request_record.organization_id,p_request_id,p_response_id,p_rating,p_feedback_placeholder,caller_id) returning id into feedback_id;
 insert into public.ai_events(organization_id,request_id,event_type,actor_profile_id,metadata) values(request_record.organization_id,p_request_id,'feedback_submitted',caller_id,jsonb_build_object('feedback_id',feedback_id));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,request_record.organization_id,'ai.feedback_submitted','ai_feedback',feedback_id); return feedback_id;
end $$;

create or replace function public.list_prompt_versions(p_prompt_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); prompt_record public.ai_prompts%rowtype; result jsonb;
begin
 select * into prompt_record from public.ai_prompts where id=p_prompt_id; if not found or caller_id is null or not public.ai_permission(prompt_record.organization_id,'prompts') then raise exception using errcode='42501',message='AI_PROMPT_FORBIDDEN'; end if;
 select coalesce(jsonb_agg(to_jsonb(v) order by v.version_number desc),'[]'::jsonb) into result from public.ai_prompt_versions v where v.prompt_id=p_prompt_id and v.organization_id=prompt_record.organization_id; return result;
end $$;

create or replace function public.get_usage_metrics(p_from_date date default current_date-30,p_to_date date default current_date)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_ai_organization(); result jsonb;
begin
 if caller_id is null or org_id is null or not public.ai_permission(org_id,'read') then raise exception using errcode='42501',message='AI_METRICS_FORBIDDEN'; end if;
 select jsonb_build_object('requestCount',count(*),'completedCount',count(*) filter(where status='completed'),'blockedCount',count(*) filter(where blocked),'inputTokensPlaceholder',coalesce(sum(input_tokens_placeholder),0),'outputTokensPlaceholder',coalesce(sum(output_tokens_placeholder),0),'costPlaceholder',coalesce(sum(cost_placeholder),0)) into result from public.ai_requests where organization_id=org_id and requested_at::date between p_from_date and p_to_date; return result;
end $$;

create or replace function public.update_ai_provider_settings(p_provider_key text,p_enabled boolean)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); org_id uuid:=public.current_ai_organization(); provider_id_value uuid; setting_id uuid;
begin
 if caller_id is null or org_id is null or not public.ai_permission(org_id,'manage') then raise exception using errcode='42501',message='AI_PROVIDER_FORBIDDEN'; end if;
 select id into provider_id_value from public.ai_providers where provider_key=lower(btrim(p_provider_key)); if provider_id_value is null then raise exception using errcode='22023',message='AI_PROVIDER_NOT_FOUND'; end if;
 insert into public.ai_provider_settings(organization_id,provider_id,enabled,updated_by,created_by) values(org_id,provider_id_value,p_enabled,caller_id,caller_id) on conflict(organization_id,provider_id) do update set enabled=excluded.enabled,updated_by=caller_id,updated_at=timezone('utc',now()) returning id into setting_id;
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,org_id,'ai.provider_settings_updated','ai_provider_settings',setting_id,jsonb_build_object('provider_key',p_provider_key,'enabled',p_enabled)); return setting_id;
end $$;

revoke all on function public.ai_permission(uuid,text),public.current_ai_organization() from public;
grant execute on function public.ai_permission(uuid,text),public.create_prompt(text,text,text,text,jsonb),public.publish_prompt(uuid,uuid),public.create_ai_request(uuid,uuid,uuid,text,text,text),public.record_ai_response(uuid,text,integer,integer,integer,numeric,numeric,boolean),public.submit_feedback(uuid,uuid,integer,text),public.list_prompt_versions(uuid),public.get_usage_metrics(date,date),public.update_ai_provider_settings(text,boolean) to authenticated;

do $$ declare table_name text; begin
 foreach table_name in array array['ai_providers','ai_models','ai_prompts','ai_prompt_versions','ai_requests','ai_responses','ai_feedback','ai_usage_metrics','ai_provider_settings','ai_events'] loop
  execute format('alter table public.%I enable row level security',table_name); execute format('grant select on public.%I to authenticated',table_name);
  if table_name in('ai_providers','ai_models') then execute format('create policy %I_select on public.%I for select to authenticated using(true)',table_name,table_name);
  elsif table_name in('ai_prompts','ai_prompt_versions') then execute format('create policy %I_select on public.%I for select to authenticated using(public.ai_permission(organization_id,''prompts''))',table_name,table_name);
  elsif table_name='ai_provider_settings' then execute 'create policy ai_provider_settings_select on public.ai_provider_settings for select to authenticated using(public.ai_permission(organization_id,''manage''))';
  else execute format('create policy %I_select on public.%I for select to authenticated using(public.ai_permission(organization_id,''read''))',table_name,table_name);
  end if;
  execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check(false)',table_name,table_name);
  execute format('create policy %I_update_denied on public.%I for update to authenticated using(false) with check(false)',table_name,table_name);
  execute format('create policy %I_delete_denied on public.%I for delete to authenticated using(false)',table_name,table_name);
 end loop;
end $$;

create trigger ai_prompts_updated_at before update on public.ai_prompts for each row execute function public.set_updated_at();
