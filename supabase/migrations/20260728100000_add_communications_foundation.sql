insert into public.permissions (key, domain, action, description)
values
  ('communications.create', 'communications', 'create', 'Create notification queue entries and update patient preferences'),
  ('communications.manage_templates', 'communications', 'manage_templates', 'Create and version notification templates'),
  ('communications.manage_settings', 'communications', 'manage_settings', 'Manage organization notification settings')
on conflict (key) do update set description = excluded.description, status = 'active';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('organization.admin', 'clinic.admin') and r.organization_id is null
  and p.key in ('communications.read', 'communications.create', 'communications.send', 'communications.manage_templates', 'communications.manage_settings')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'receptionist' and r.organization_id is null
  and p.key in ('communications.read', 'communications.create', 'communications.send')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'marketing.staff' and r.organization_id is null
  and p.key in ('communications.read', 'communications.create', 'communications.send', 'communications.manage_templates')
on conflict do nothing;

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  template_key text not null check (char_length(btrim(template_key)) between 1 and 120), channel text not null check (channel in ('email', 'sms', 'internal', 'push', 'whatsapp')),
  subject text, body text not null check (char_length(btrim(body)) between 1 and 20000), variables jsonb not null default '{}'::jsonb check (jsonb_typeof(variables) = 'object'),
  language text not null default 'en-CA' check (char_length(btrim(language)) between 2 and 16), version integer not null check (version > 0), status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, template_key, channel, version), unique (id, organization_id)
);

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid, patient_id uuid not null, appointment_id uuid, channel text not null check (channel in ('email', 'sms', 'internal', 'push', 'whatsapp')),
  recipient_address text not null check (char_length(btrim(recipient_address)) between 1 and 320), subject text, body text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'), status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled', 'expired', 'retrying')),
  attempt_count integer not null default 0 check (attempt_count >= 0), provider text not null default 'mock', scheduled_send_at timestamptz not null default timezone('utc', now()), priority integer not null default 0,
  failure_reason text, created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_queue_template_fk foreign key (template_id, organization_id) references public.notification_templates(id, organization_id) on delete set null,
  constraint notification_queue_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade,
  constraint notification_queue_appointment_fk foreign key (appointment_id, organization_id) references public.appointments(id, organization_id) on delete set null
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  queue_id uuid not null references public.notification_queue(id) on delete cascade, channel text not null, provider text not null default 'mock',
  status text not null check (status in ('sent', 'failed')), provider_message_id text, delivered_at timestamptz, failure_reason text, response_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), unique (id, organization_id)
);

create table public.patient_notification_preferences (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id uuid not null,
  appointment_reminders boolean not null default true, marketing_opt_in boolean not null default false, sms_enabled boolean not null default false, email_enabled boolean not null default false,
  preferred_language text not null default 'en-CA', quiet_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(quiet_hours) = 'object'),
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_notification_preferences_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade, unique (organization_id, patient_id)
);

create table public.organization_notification_settings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references public.organizations(id) on delete cascade,
  default_reminder_minutes integer not null default 1440 check (default_reminder_minutes between 0 and 43200), branding_placeholder jsonb not null default '{}'::jsonb,
  default_sender text, timezone text not null default 'America/Edmonton', created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, queue_id uuid, patient_id uuid, appointment_id uuid,
  event_type text not null, channel text, metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default timezone('utc', now()), created_by uuid references public.profiles(id) on delete set null,
  constraint notification_events_queue_fk foreign key (queue_id) references public.notification_queue(id) on delete set null,
  constraint notification_events_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete set null,
  constraint notification_events_appointment_fk foreign key (appointment_id, organization_id) references public.appointments(id, organization_id) on delete set null
);

create or replace function public.communication_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select public.has_permission(target_organization_id, 'communications.' || required_action) $$;

create or replace function public.create_notification(p_organization_id uuid, p_patient_id uuid, p_appointment_id uuid, p_channel text, p_subject text, p_body text, p_scheduled_send_at timestamptz default null, p_priority integer default 0, p_payload jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); destination text; queue_id uuid;
begin
  if not public.communication_permission(p_organization_id, 'create') then raise exception 'Permission denied'; end if;
  perform 1 from public.patients where id = p_patient_id and organization_id = p_organization_id;
  if not found then raise exception 'Patient not found in organization'; end if;
  if p_channel = 'email' then select email into destination from public.patient_contacts where patient_id = p_patient_id and organization_id = p_organization_id;
  elsif p_channel = 'sms' then select phone into destination from public.patient_contacts where patient_id = p_patient_id and organization_id = p_organization_id;
  else destination := 'internal'; end if;
  if destination is null or btrim(destination) = '' then raise exception 'No destination is available for channel'; end if;
  insert into public.notification_queue(organization_id, patient_id, appointment_id, channel, recipient_address, subject, body, scheduled_send_at, priority, payload, created_by, updated_by)
  values (p_organization_id, p_patient_id, p_appointment_id, p_channel, destination, p_subject, p_body, coalesce(p_scheduled_send_at, timezone('utc', now())), p_priority, coalesce(p_payload, '{}'::jsonb), caller_id, caller_id) returning id into queue_id;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'notification.queue_created', 'notification_queue', queue_id, true, jsonb_build_object('channel', p_channel, 'provider', 'mock'));
  return queue_id;
end $$;

create or replace function public.queue_notification(p_queue_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.notification_queue%rowtype; caller_id uuid := auth.uid(); begin
  select * into row_record from public.notification_queue where id = p_queue_id;
  if not found or not public.communication_permission(row_record.organization_id, 'send') then raise exception 'Permission denied'; end if;
  if row_record.status not in ('pending', 'retrying') then raise exception 'Notification cannot be queued from its current state'; end if;
  update public.notification_queue set status = 'pending', updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_queue_id;
  return true;
end $$;

create or replace function public.cancel_notification(p_queue_id uuid, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.notification_queue%rowtype; caller_id uuid := auth.uid(); begin
  select * into row_record from public.notification_queue where id = p_queue_id;
  if not found or not public.communication_permission(row_record.organization_id, 'send') then raise exception 'Permission denied'; end if;
  update public.notification_queue set status = 'cancelled', failure_reason = left(p_reason, 500), updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_queue_id and status not in ('sent', 'cancelled');
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'notification.queue_cancelled', 'notification_queue', p_queue_id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end $$;

create or replace function public.retry_notification(p_queue_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.notification_queue%rowtype; caller_id uuid := auth.uid(); begin
  select * into row_record from public.notification_queue where id = p_queue_id;
  if not found or not public.communication_permission(row_record.organization_id, 'send') or row_record.status not in ('failed', 'expired') then raise exception 'Notification cannot be retried'; end if;
  update public.notification_queue set status = 'retrying', attempt_count = attempt_count + 1, failure_reason = null, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_queue_id;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'notification.retry_requested', 'notification_queue', p_queue_id, true, jsonb_build_object('attempt_count', row_record.attempt_count + 1));
  return true;
end $$;

create or replace function public.update_preferences(p_patient_id uuid, p_appointment_reminders boolean, p_marketing_opt_in boolean, p_sms_enabled boolean, p_email_enabled boolean, p_preferred_language text, p_quiet_hours jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_record public.patients%rowtype; caller_id uuid := auth.uid(); begin
  select * into patient_record from public.patients where id = p_patient_id;
  if not found or not public.communication_permission(patient_record.organization_id, 'create') then raise exception 'Permission denied'; end if;
  insert into public.patient_notification_preferences(organization_id, patient_id, appointment_reminders, marketing_opt_in, sms_enabled, email_enabled, preferred_language, quiet_hours, created_by, updated_by) values (patient_record.organization_id, p_patient_id, p_appointment_reminders, p_marketing_opt_in, p_sms_enabled, p_email_enabled, p_preferred_language, coalesce(p_quiet_hours, '{}'::jsonb), caller_id, caller_id)
  on conflict (organization_id, patient_id) do update set appointment_reminders = excluded.appointment_reminders, marketing_opt_in = excluded.marketing_opt_in, sms_enabled = excluded.sms_enabled, email_enabled = excluded.email_enabled, preferred_language = excluded.preferred_language, quiet_hours = excluded.quiet_hours, updated_by = caller_id, updated_at = timezone('utc', now());
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, patient_record.organization_id, 'notification.preference_updated', 'patient_notification_preferences', p_patient_id, true, jsonb_build_object('email_enabled', p_email_enabled, 'sms_enabled', p_sms_enabled)); return true;
end $$;

create or replace function public.update_templates(p_organization_id uuid, p_template_id uuid, p_template_key text, p_channel text, p_subject text, p_body text, p_variables jsonb, p_language text, p_status text default 'active')
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); org_id uuid; next_version integer; new_id uuid; begin
  org_id := p_organization_id;
  if not public.communication_permission(org_id, 'manage_templates') then raise exception 'Permission denied'; end if;
  if p_template_id is not null and p_template_id <> '00000000-0000-0000-0000-000000000000'::uuid then perform 1 from public.notification_templates where id = p_template_id and organization_id = org_id; if not found then raise exception 'Template not found in organization'; end if; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.notification_templates where organization_id = org_id and template_key = p_template_key and channel = p_channel;
  update public.notification_templates set status = 'inactive', updated_by = caller_id, updated_at = timezone('utc', now()) where organization_id = org_id and template_key = p_template_key and channel = p_channel and status = 'active';
  insert into public.notification_templates(organization_id, template_key, channel, subject, body, variables, language, version, status, created_by, updated_by) values (org_id, p_template_key, p_channel, p_subject, p_body, coalesce(p_variables, '{}'::jsonb), p_language, next_version, p_status, caller_id, caller_id) returning id into new_id;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, org_id, 'notification.template_updated', 'notification_template', new_id, true, jsonb_build_object('template_key', p_template_key, 'version', next_version)); return new_id;
end $$;

create or replace function public.update_notification_settings(p_default_reminder_minutes integer, p_branding_placeholder jsonb, p_default_sender text, p_timezone text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); org_id uuid; begin
  select organization_id into org_id from public.organization_memberships where profile_id = caller_id and status = 'active' limit 1;
  if org_id is null or not public.communication_permission(org_id, 'manage_settings') then raise exception 'Permission denied'; end if;
  insert into public.organization_notification_settings(organization_id, default_reminder_minutes, branding_placeholder, default_sender, timezone, created_by, updated_by) values (org_id, p_default_reminder_minutes, coalesce(p_branding_placeholder, '{}'::jsonb), p_default_sender, p_timezone, caller_id, caller_id)
  on conflict (organization_id) do update set default_reminder_minutes = excluded.default_reminder_minutes, branding_placeholder = excluded.branding_placeholder, default_sender = excluded.default_sender, timezone = excluded.timezone, updated_by = caller_id, updated_at = timezone('utc', now());
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, org_id, 'notification.settings_updated', 'organization_notification_settings', org_id, true, jsonb_build_object('timezone', p_timezone)); return true;
end $$;

create or replace function public.send_mock_notification(p_queue_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.notification_queue%rowtype; caller_id uuid := auth.uid(); delivery_id uuid; message_id text := 'mock:' || gen_random_uuid()::text; begin
  select * into row_record from public.notification_queue where id = p_queue_id for update;
  if not found or row_record.provider <> 'mock' or not public.communication_permission(row_record.organization_id, 'send') or row_record.status not in ('pending', 'retrying', 'failed') then raise exception 'Mock notification cannot be sent'; end if;
  update public.notification_queue set status = 'processing', attempt_count = attempt_count + 1, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_queue_id;
  insert into public.notification_deliveries(organization_id, queue_id, channel, provider, status, provider_message_id, delivered_at, response_metadata) values (row_record.organization_id, p_queue_id, row_record.channel, 'mock', 'sent', message_id, timezone('utc', now()), jsonb_build_object('mode', 'local-mock')) returning id into delivery_id;
  update public.notification_queue set status = 'sent', updated_at = timezone('utc', now()) where id = p_queue_id;
  insert into public.notification_events(organization_id, queue_id, patient_id, appointment_id, event_type, channel, metadata, created_by) values (row_record.organization_id, p_queue_id, row_record.patient_id, row_record.appointment_id, 'mock_sent', row_record.channel, jsonb_build_object('provider', 'mock'), caller_id);
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'notification.mock_delivered', 'notification_delivery', delivery_id, true, jsonb_build_object('provider', 'mock', 'queue_id', p_queue_id)); return delivery_id;
end $$;

do $$ declare table_name text; begin foreach table_name in array array['notification_templates', 'notification_queue', 'notification_deliveries', 'patient_notification_preferences', 'organization_notification_settings', 'notification_events'] loop execute format('alter table public.%I enable row level security', table_name); execute format('grant select on public.%I to authenticated', table_name); end loop; end $$;
create policy notification_templates_read on public.notification_templates for select to authenticated using (public.communication_permission(organization_id, 'read'));
create policy notification_queue_read on public.notification_queue for select to authenticated using (public.communication_permission(organization_id, 'read'));
create policy notification_deliveries_read on public.notification_deliveries for select to authenticated using (public.communication_permission(organization_id, 'read'));
create policy patient_notification_preferences_read on public.patient_notification_preferences for select to authenticated using (public.communication_permission(organization_id, 'read'));
create policy organization_notification_settings_read on public.organization_notification_settings for select to authenticated using (public.communication_permission(organization_id, 'read'));
create policy notification_events_read on public.notification_events for select to authenticated using (public.communication_permission(organization_id, 'read'));
do $$ declare table_name text; begin foreach table_name in array array['notification_templates', 'notification_queue', 'notification_deliveries', 'patient_notification_preferences', 'organization_notification_settings', 'notification_events'] loop execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', table_name || '_writes_denied', table_name); end loop; end $$;

grant execute on function public.communication_permission(uuid, text) to authenticated;
grant execute on function public.create_notification(uuid, uuid, uuid, text, text, text, timestamptz, integer, jsonb) to authenticated;
grant execute on function public.queue_notification(uuid) to authenticated;
grant execute on function public.cancel_notification(uuid, text) to authenticated;
grant execute on function public.retry_notification(uuid) to authenticated;
grant execute on function public.update_preferences(uuid, boolean, boolean, boolean, boolean, text, jsonb) to authenticated;
grant execute on function public.update_templates(uuid, uuid, text, text, text, text, jsonb, text, text) to authenticated;
grant execute on function public.update_notification_settings(integer, jsonb, text, text) to authenticated;
grant execute on function public.send_mock_notification(uuid) to authenticated;

comment on table public.notification_queue is 'Tenant-scoped mock-ready queue. No external provider is called by this foundation.';
comment on table public.patient_notification_preferences is 'Notification-specific preferences; patient_contacts remains the source for contact addresses and consent fields.';

create trigger notification_templates_set_updated_at before update on public.notification_templates for each row execute function public.set_updated_at();
create trigger notification_queue_set_updated_at before update on public.notification_queue for each row execute function public.set_updated_at();
create trigger patient_notification_preferences_set_updated_at before update on public.patient_notification_preferences for each row execute function public.set_updated_at();
create trigger organization_notification_settings_set_updated_at before update on public.organization_notification_settings for each row execute function public.set_updated_at();
