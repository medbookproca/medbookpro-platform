insert into public.permissions(key,domain,action,description)
values
 ('telehealth.read','telehealth','read','Read telehealth session metadata'),
 ('telehealth.create','telehealth','create','Create telehealth sessions'),
 ('telehealth.update','telehealth','update','Update telehealth sessions and waiting room metadata'),
 ('telehealth.manage','telehealth','manage','Manage telehealth configuration and lifecycle')
on conflict(key) do update set description=excluded.description,status='active';

do $$ declare permission_key text; begin
 foreach permission_key in array array['telehealth.read','telehealth.create','telehealth.update','telehealth.manage'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key in('organization.owner','organization.admin','clinic.admin') and r.organization_id is null on conflict do nothing;
 end loop;
 foreach permission_key in array array['telehealth.read','telehealth.create','telehealth.update'] loop
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=permission_key where r.key='practitioner' and r.organization_id is null on conflict do nothing;
 end loop;
 insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key='telehealth.read' where r.key='receptionist' and r.organization_id is null on conflict do nothing;
end $$;

create table public.telehealth_provider_settings(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 provider text not null check(provider in('zoom','google_meet','microsoft_teams','daily','twilio','custom_provider')),
 display_name text, enabled boolean not null default false, configuration_placeholder jsonb not null default '{}'::jsonb check(jsonb_typeof(configuration_placeholder)='object'),
 created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()), unique(organization_id,provider)
);

create table public.telehealth_sessions(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 location_id uuid, appointment_id uuid, patient_id uuid not null, practitioner_id uuid not null,
 scheduled_start timestamptz not null, actual_start timestamptz, scheduled_end timestamptz not null, actual_end timestamptz,
 status text not null default 'scheduled' check(status in('scheduled','waiting','in_progress','completed','cancelled','no_show')),
 provider_placeholder text, meeting_identifier_placeholder text, meeting_url_placeholder text, host_url_placeholder text, recording_placeholder text, transcript_placeholder text,
 created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
 unique(id,organization_id),
 foreign key(location_id,organization_id) references public.locations(id,organization_id) on delete restrict,
 foreign key(appointment_id,organization_id) references public.appointments(id,organization_id) on delete restrict,
 foreign key(patient_id,organization_id) references public.patients(id,organization_id) on delete restrict,
 foreign key(practitioner_id,organization_id) references public.practitioners(id,organization_id) on delete restrict,
 constraint telehealth_session_times check(scheduled_end>scheduled_start and (actual_end is null or actual_start is null or actual_end>=actual_start))
);

create table public.telehealth_participants(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, session_id uuid not null,
 patient_id uuid, practitioner_id uuid, participant_type text not null check(participant_type in('patient','practitioner','observer')), joined_at timestamptz, left_at timestamptz, admitted boolean not null default false,
 created_at timestamptz not null default timezone('utc',now()), updated_at timestamptz not null default timezone('utc',now()),
 foreign key(session_id,organization_id) references public.telehealth_sessions(id,organization_id) on delete cascade,
 foreign key(patient_id,organization_id) references public.patients(id,organization_id) on delete restrict,
 foreign key(practitioner_id,organization_id) references public.practitioners(id,organization_id) on delete restrict,
 constraint participant_identity_check check((participant_type='patient' and patient_id is not null and practitioner_id is null) or (participant_type='practitioner' and practitioner_id is not null and patient_id is null) or participant_type='observer')
);
create unique index telehealth_patient_participant_unique on public.telehealth_participants(session_id,patient_id) where participant_type='patient';
create unique index telehealth_practitioner_participant_unique on public.telehealth_participants(session_id,practitioner_id) where participant_type='practitioner';

create table public.telehealth_waiting_room(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, session_id uuid not null, patient_id uuid not null,
 patient_joined_at timestamptz, provider_joined_at timestamptz, admitted_at timestamptz, left_at timestamptz, status text not null default 'waiting' check(status in('waiting','admitted','left')), metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'),
 foreign key(session_id,organization_id) references public.telehealth_sessions(id,organization_id) on delete cascade, foreign key(patient_id,organization_id) references public.patients(id,organization_id) on delete restrict, unique(session_id,patient_id)
);

create table public.telehealth_chat_placeholder(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, session_id uuid not null, messages_count integer not null default 0 check(messages_count>=0), attachments_placeholder jsonb not null default '[]'::jsonb check(jsonb_typeof(attachments_placeholder)='array'), updated_at timestamptz not null default timezone('utc',now()),
 foreign key(session_id,organization_id) references public.telehealth_sessions(id,organization_id) on delete cascade, unique(session_id)
);

create table public.telehealth_session_events(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, session_id uuid not null, event_type text not null check(event_type=lower(event_type) and char_length(btrim(event_type)) between 1 and 120), actor_profile_id uuid references public.profiles(id) on delete set null, actor_patient_id uuid, metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), occurred_at timestamptz not null default timezone('utc',now()),
 foreign key(session_id,organization_id) references public.telehealth_sessions(id,organization_id) on delete cascade, foreign key(actor_patient_id,organization_id) references public.patients(id,organization_id) on delete set null
);

create or replace function public.telehealth_permission(target_organization_id uuid,required_action text)
returns boolean language sql stable security definer set search_path=pg_catalog,public,auth
as $$ select public.has_permission(target_organization_id,'telehealth.'||required_action) $$;

create or replace function public.create_telehealth_session(p_organization_id uuid,p_location_id uuid,p_appointment_id uuid,p_patient_id uuid,p_practitioner_id uuid,p_scheduled_start timestamptz,p_scheduled_end timestamptz,p_provider_placeholder text default 'custom_provider')
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); session_id uuid;
begin
 if caller_id is null or not public.telehealth_permission(p_organization_id,'create') then raise exception using errcode='42501',message='TELEHEALTH_CREATE_FORBIDDEN'; end if;
 if not exists(select 1 from public.appointments where id=p_appointment_id and organization_id=p_organization_id and patient_id=p_patient_id and practitioner_id=p_practitioner_id) then raise exception using errcode='22023',message='TELEHEALTH_APPOINTMENT_CONTEXT_INVALID'; end if;
 insert into public.telehealth_sessions(organization_id,location_id,appointment_id,patient_id,practitioner_id,scheduled_start,scheduled_end,provider_placeholder,created_by,updated_by) values(p_organization_id,p_location_id,p_appointment_id,p_patient_id,p_practitioner_id,p_scheduled_start,p_scheduled_end,p_provider_placeholder,caller_id,caller_id) returning id into session_id;
 insert into public.telehealth_chat_placeholder(organization_id,session_id) values(p_organization_id,session_id);
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id) values(p_organization_id,session_id,'session_created',caller_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,p_organization_id,'telehealth.session_created','telehealth_session',session_id,jsonb_build_object('appointment_id',p_appointment_id));
 return session_id;
end $$;

create or replace function public.get_telehealth_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare session_record public.telehealth_sessions%rowtype; portal_patient_id uuid; result jsonb;
begin
 select * into session_record from public.telehealth_sessions where id=p_session_id; if not found then raise exception using errcode='22023',message='TELEHEALTH_SESSION_NOT_FOUND'; end if;
 portal_patient_id:=public.patient_portal_patient_id();
 if portal_patient_id is not null then if portal_patient_id<>session_record.patient_id then raise exception using errcode='42501',message='TELEHEALTH_PATIENT_FORBIDDEN'; end if;
 elsif not public.telehealth_permission(session_record.organization_id,'read') then raise exception using errcode='42501',message='TELEHEALTH_READ_FORBIDDEN'; end if;
 select jsonb_build_object('id',s.id,'organizationId',s.organization_id,'appointmentId',s.appointment_id,'patientId',s.patient_id,'practitionerId',s.practitioner_id,'scheduledStart',s.scheduled_start,'actualStart',s.actual_start,'scheduledEnd',s.scheduled_end,'actualEnd',s.actual_end,'status',s.status,'provider',s.provider_placeholder,'meetingIdentifier',s.meeting_identifier_placeholder,'meetingUrl',s.meeting_url_placeholder,'hostUrl',s.host_url_placeholder,'waitingRoom',(select to_jsonb(w) from public.telehealth_waiting_room w where w.session_id=s.id),'participants',(select coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) from public.telehealth_participants p where p.session_id=s.id)) into result from public.telehealth_sessions s where s.id=p_session_id; return result;
end $$;

create or replace function public.join_waiting_room(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); portal_patient_id uuid:=public.patient_portal_patient_id(); session_record public.telehealth_sessions%rowtype; now_value timestamptz:=timezone('utc',now());
begin
 select * into session_record from public.telehealth_sessions where id=p_session_id for update; if not found then raise exception using errcode='22023',message='TELEHEALTH_SESSION_NOT_FOUND'; end if;
 if portal_patient_id is not null then if portal_patient_id<>session_record.patient_id then raise exception using errcode='42501',message='TELEHEALTH_PATIENT_FORBIDDEN'; end if;
 elsif caller_id is null or not public.telehealth_permission(session_record.organization_id,'update') then raise exception using errcode='42501',message='TELEHEALTH_JOIN_FORBIDDEN'; end if;
 insert into public.telehealth_waiting_room(organization_id,session_id,patient_id,patient_joined_at,status) values(session_record.organization_id,p_session_id,session_record.patient_id,now_value,'waiting') on conflict(session_id,patient_id) do update set patient_joined_at=coalesce(telehealth_waiting_room.patient_joined_at,excluded.patient_joined_at),status='waiting';
 insert into public.telehealth_participants(organization_id,session_id,patient_id,participant_type,joined_at) values(session_record.organization_id,p_session_id,session_record.patient_id,'patient',now_value) on conflict(session_id,participant_type,patient_id,practitioner_id) do update set joined_at=coalesce(telehealth_participants.joined_at,excluded.joined_at);
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id,actor_patient_id) values(session_record.organization_id,p_session_id,'patient_joined_waiting_room',caller_id,portal_patient_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,session_record.organization_id,'telehealth.waiting_room_joined','telehealth_session',p_session_id,jsonb_build_object('patient_id',session_record.patient_id));
 return true;
end $$;

create or replace function public.admit_patient(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); s public.telehealth_sessions%rowtype;
begin
 select * into s from public.telehealth_sessions where id=p_session_id for update; if not found or caller_id is null or not public.telehealth_permission(s.organization_id,'update') then raise exception using errcode='42501',message='TELEHEALTH_ADMIT_FORBIDDEN'; end if;
 update public.telehealth_waiting_room set admitted_at=timezone('utc',now()),status='admitted' where session_id=p_session_id and patient_id=s.patient_id;
 update public.telehealth_participants set admitted=true where session_id=p_session_id and patient_id=s.patient_id;
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id) values(s.organization_id,p_session_id,'patient_admitted',caller_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,s.organization_id,'telehealth.patient_admitted','telehealth_session',p_session_id);
 return true;
end $$;

create or replace function public.start_session(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); s public.telehealth_sessions%rowtype;
begin
 select * into s from public.telehealth_sessions where id=p_session_id for update; if not found or caller_id is null or not public.telehealth_permission(s.organization_id,'update') or s.status in('completed','cancelled','no_show') then raise exception using errcode='42501',message='TELEHEALTH_START_FORBIDDEN'; end if;
 update public.telehealth_sessions set status='in_progress',actual_start=coalesce(actual_start,timezone('utc',now())),updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_session_id;
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id) values(s.organization_id,p_session_id,'session_started',caller_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,s.organization_id,'telehealth.session_started','telehealth_session',p_session_id); return true;
end $$;

create or replace function public.end_session(p_session_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); s public.telehealth_sessions%rowtype;
begin
 select * into s from public.telehealth_sessions where id=p_session_id for update; if not found or caller_id is null or not public.telehealth_permission(s.organization_id,'update') or s.status in('completed','cancelled','no_show') then raise exception using errcode='42501',message='TELEHEALTH_END_FORBIDDEN'; end if;
 update public.telehealth_sessions set status='completed',actual_end=coalesce(actual_end,timezone('utc',now())),updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_session_id;
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id) values(s.organization_id,p_session_id,'session_ended',caller_id);
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id) values(caller_id,s.organization_id,'telehealth.session_ended','telehealth_session',p_session_id); return true;
end $$;

create or replace function public.cancel_session(p_session_id uuid,p_reason text default null)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); s public.telehealth_sessions%rowtype;
begin
 select * into s from public.telehealth_sessions where id=p_session_id for update; if not found or caller_id is null or not public.telehealth_permission(s.organization_id,'manage') then raise exception using errcode='42501',message='TELEHEALTH_CANCEL_FORBIDDEN'; end if;
 update public.telehealth_sessions set status='cancelled',updated_by=caller_id,updated_at=timezone('utc',now()) where id=p_session_id;
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id,metadata) values(s.organization_id,p_session_id,'session_cancelled',caller_id,jsonb_build_object('reason',left(coalesce(p_reason,''),500)));
 insert into public.audit_events(actor_profile_id,organization_id,action,entity_type,entity_id,metadata) values(caller_id,s.organization_id,'telehealth.session_cancelled','telehealth_session',p_session_id,jsonb_build_object('reason',left(coalesce(p_reason,''),500))); return true;
end $$;

create or replace function public.list_upcoming_sessions(p_from timestamptz default now(),p_to timestamptz default now()+interval '30 days')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); portal_patient_id uuid:=public.patient_portal_patient_id(); org_id uuid; result jsonb;
begin
 if portal_patient_id is not null then select organization_id into org_id from public.patient_portal_accounts where patient_id=portal_patient_id and status='active'; else select organization_id into org_id from public.organization_memberships where profile_id=caller_id and status='active' limit 1; if org_id is null or not public.telehealth_permission(org_id,'read') then raise exception using errcode='42501',message='TELEHEALTH_READ_FORBIDDEN'; end if; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'appointmentId',s.appointment_id,'patientId',s.patient_id,'practitionerId',s.practitioner_id,'scheduledStart',s.scheduled_start,'scheduledEnd',s.scheduled_end,'status',s.status,'provider',s.provider_placeholder) order by s.scheduled_start),'[]'::jsonb) into result from public.telehealth_sessions s where s.organization_id=org_id and s.scheduled_start between p_from and p_to and s.status not in('completed','cancelled') and (portal_patient_id is null or s.patient_id=portal_patient_id); return result;
end $$;

create or replace function public.record_session_event(p_session_id uuid,p_event_type text,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,auth
as $$
declare caller_id uuid:=public.current_profile_id(); portal_patient_id uuid:=public.patient_portal_patient_id(); s public.telehealth_sessions%rowtype; event_id uuid;
begin
 select * into s from public.telehealth_sessions where id=p_session_id; if not found or (portal_patient_id is null and (caller_id is null or not public.telehealth_permission(s.organization_id,'update'))) or (portal_patient_id is not null and s.patient_id<>portal_patient_id) then raise exception using errcode='42501',message='TELEHEALTH_EVENT_FORBIDDEN'; end if;
 insert into public.telehealth_session_events(organization_id,session_id,event_type,actor_profile_id,actor_patient_id,metadata) values(s.organization_id,p_session_id,lower(btrim(p_event_type)),caller_id,portal_patient_id,coalesce(p_metadata,'{}'::jsonb)) returning id into event_id; return event_id;
end $$;

revoke all on function public.telehealth_permission(uuid,text) from public;
grant execute on function public.telehealth_permission(uuid,text),public.create_telehealth_session(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text),public.get_telehealth_session(uuid),public.join_waiting_room(uuid),public.admit_patient(uuid),public.start_session(uuid),public.end_session(uuid),public.cancel_session(uuid,text),public.list_upcoming_sessions(timestamptz,timestamptz),public.record_session_event(uuid,text,jsonb) to authenticated;

do $$ declare table_name text; begin
 foreach table_name in array array['telehealth_sessions','telehealth_participants','telehealth_waiting_room','telehealth_chat_placeholder','telehealth_provider_settings','telehealth_session_events'] loop
  execute format('alter table public.%I enable row level security',table_name); execute format('grant select on public.%I to authenticated',table_name);
  if table_name='telehealth_sessions' then execute 'create policy telehealth_sessions_select on public.telehealth_sessions for select to authenticated using(public.telehealth_permission(organization_id,''read'') or patient_id=public.patient_portal_patient_id())';
  elsif table_name='telehealth_provider_settings' then execute 'create policy telehealth_provider_settings_select on public.telehealth_provider_settings for select to authenticated using(public.telehealth_permission(organization_id,''manage''))';
  else execute format('create policy %I_select on public.%I for select to authenticated using(public.telehealth_permission(organization_id,''read'') or exists(select 1 from public.telehealth_sessions s where s.id=session_id and s.organization_id=%I.organization_id and s.patient_id=public.patient_portal_patient_id()))',table_name,table_name,table_name);
  end if;
  execute format('create policy %I_insert_denied on public.%I for insert to authenticated with check(false)',table_name,table_name);
  execute format('create policy %I_update_denied on public.%I for update to authenticated using(false) with check(false)',table_name,table_name);
  execute format('create policy %I_delete_denied on public.%I for delete to authenticated using(false)',table_name,table_name);
 end loop;
end $$;

create trigger telehealth_provider_settings_updated_at before update on public.telehealth_provider_settings for each row execute function public.set_updated_at();
create trigger telehealth_sessions_updated_at before update on public.telehealth_sessions for each row execute function public.set_updated_at();
create trigger telehealth_participants_updated_at before update on public.telehealth_participants for each row execute function public.set_updated_at();
