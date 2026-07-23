insert into public.permissions (key, domain, action, description)
values
  ('patient.self', 'patient', 'self', 'Patient-owned access to the patient record'),
  ('patient.portal', 'patient', 'portal', 'Patient portal access'),
  ('patient.consent', 'patient', 'consent', 'Patient consent management')
on conflict (key) do update set description = excluded.description, status = 'active';

create table public.patient_portal_accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id uuid not null,
  auth_user_id uuid unique references auth.users(id) on delete set null, email text not null check (char_length(btrim(email)) between 3 and 320), status text not null default 'pending' check (status in ('pending', 'active', 'locked', 'disabled')),
  email_verified_at timestamptz, password_reset_requested_at timestamptz, mfa_enabled boolean not null default false, mfa_configured_at timestamptz, failed_login_attempts integer not null default 0 check (failed_login_attempts >= 0), locked_until timestamptz, last_login_at timestamptz, sso_placeholder text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_portal_accounts_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade, unique (id, organization_id), unique (organization_id, patient_id)
);

create table public.patient_portal_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, account_id uuid not null references public.patient_portal_accounts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()), expires_at timestamptz not null, last_seen_at timestamptz, revoked_at timestamptz, device_placeholder text,
  constraint patient_portal_sessions_account_org_fk foreign key (account_id, organization_id) references public.patient_portal_accounts(id, organization_id) on delete cascade
);

create table public.patient_saved_settings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id uuid not null, setting_key text not null check (setting_key = lower(setting_key) and char_length(btrim(setting_key)) between 1 and 120), setting_value jsonb not null default '{}'::jsonb check (jsonb_typeof(setting_value) = 'object'),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint patient_saved_settings_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade, unique (organization_id, patient_id, setting_key)
);

create table public.patient_portal_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id uuid not null, account_id uuid, event_type text not null check (event_type = lower(event_type) and char_length(btrim(event_type)) between 1 and 160), metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'), occurred_at timestamptz not null default timezone('utc', now()),
  constraint patient_portal_events_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade,
  constraint patient_portal_events_account_fk foreign key (account_id, organization_id) references public.patient_portal_accounts(id, organization_id) on delete set null
);

create or replace function public.patient_portal_patient_id()
returns uuid language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select patient_id from public.patient_portal_accounts where auth_user_id = auth.uid() and status = 'active' and (locked_until is null or locked_until <= timezone('utc', now())) limit 1 $$;

create or replace function public.patient_portal_organization_id()
returns uuid language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select organization_id from public.patient_portal_accounts where patient_id = public.patient_portal_patient_id() and status = 'active' limit 1 $$;

create or replace function public.patient_login_placeholder(p_email text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ begin return jsonb_build_object('status', 'placeholder', 'message', 'Patient authentication is not enabled in this foundation.'); end $$;

create or replace function public.get_patient_dashboard()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); result jsonb; begin
  if patient_id_value is null or org_id is null then raise exception 'Patient portal access denied'; end if;
  select jsonb_build_object('patient', (select jsonb_build_object('id', p.id, 'firstName', p.first_name, 'preferredName', p.preferred_name, 'lastName', p.last_name, 'preferredLanguage', p.preferred_language) from public.patients p where p.id = patient_id_value and p.organization_id = org_id), 'upcomingAppointments', (select count(*) from public.appointments a where a.organization_id = org_id and a.patient_id = patient_id_value and a.scheduled_start >= timezone('utc', now()) and a.status not in ('cancelled', 'no_show')), 'outstandingBalance', (select coalesce(sum(i.balance), 0) from public.invoices i where i.organization_id = org_id and i.patient_id = patient_id_value and i.status in ('issued', 'partially_paid', 'overdue')), 'unreadCommunications', (select count(*) from public.notification_queue n where n.organization_id = org_id and n.patient_id = patient_id_value and n.status in ('pending', 'processing', 'retrying')), 'consents', (select count(*) from public.patient_consents c where c.organization_id = org_id and c.patient_id = patient_id_value and not c.withdrawn)) into result;
  insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'dashboard_accessed', '{}'::jsonb); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_dashboard_accessed', 'patient', patient_id_value, false, jsonb_build_object('auth_user_id', auth.uid())); return result;
end $$;

create or replace function public.get_patient_appointments(p_from_date date default current_date, p_to_date date default current_date + 365)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); result jsonb; begin
  if patient_id_value is null or org_id is null then raise exception 'Patient portal access denied'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'status', a.status, 'type', a.appointment_type, 'scheduledStart', a.scheduled_start, 'scheduledEnd', a.scheduled_end, 'timezone', a.timezone, 'locationId', a.location_id) order by a.scheduled_start), '[]'::jsonb) into result from public.appointments a where a.organization_id = org_id and a.patient_id = patient_id_value and a.scheduled_start::date between p_from_date and p_to_date;
  insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'appointments_viewed', jsonb_build_object('from_date', p_from_date, 'to_date', p_to_date)); return result;
end $$;

create or replace function public.request_appointment(p_organization_id uuid, p_practitioner_id uuid, p_location_id uuid, p_service_id uuid, p_appointment_type text, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text, p_notes text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); appointment_id uuid; begin
  if patient_id_value is null or org_id is null or org_id <> p_organization_id then raise exception 'Patient portal access denied'; end if;
  if not exists (select 1 from public.practitioners where id = p_practitioner_id and organization_id = org_id and status = 'active') or not exists (select 1 from public.locations where id = p_location_id and organization_id = org_id and status = 'active') or not exists (select 1 from public.services where id = p_service_id and organization_id = org_id and status = 'active') then raise exception 'Requested appointment resources are unavailable'; end if;
  insert into public.appointments(organization_id, patient_id, practitioner_id, location_id, service_id, appointment_type, scheduled_start, scheduled_end, timezone, duration_minutes, status, notes) values (org_id, patient_id_value, p_practitioner_id, p_location_id, p_service_id, p_appointment_type, p_scheduled_start, p_scheduled_start + make_interval(mins => p_duration_minutes), p_timezone, p_duration_minutes, 'draft', p_notes) returning id into appointment_id;
  insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'appointment_requested', jsonb_build_object('appointment_id', appointment_id)); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_appointment_requested', 'appointment', appointment_id, true, '{}'::jsonb); return appointment_id;
end $$;

create or replace function public.cancel_request(p_appointment_id uuid, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); appointment_record public.appointments%rowtype; begin select * into appointment_record from public.appointments where id = p_appointment_id and patient_id = patient_id_value and organization_id = org_id for update; if not found or appointment_record.status in ('completed', 'cancelled', 'no_show') then raise exception 'Appointment cannot be cancelled'; end if; update public.appointments set status = 'cancelled', cancellation_reason = left(p_reason, 500), updated_at = timezone('utc', now()) where id = p_appointment_id; insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'appointment_cancel_requested', jsonb_build_object('appointment_id', p_appointment_id)); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_appointment_cancelled', 'appointment', p_appointment_id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500))); return true; end $$;

create or replace function public.reschedule_request(p_appointment_id uuid, p_scheduled_start timestamptz, p_duration_minutes integer, p_timezone text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); appointment_record public.appointments%rowtype; begin select * into appointment_record from public.appointments where id = p_appointment_id and patient_id = patient_id_value and organization_id = org_id for update; if not found or appointment_record.status in ('completed', 'cancelled', 'no_show') then raise exception 'Appointment cannot be rescheduled'; end if; update public.appointments set scheduled_start = p_scheduled_start, scheduled_end = p_scheduled_start + make_interval(mins => p_duration_minutes), duration_minutes = p_duration_minutes, timezone = p_timezone, status = 'draft', updated_at = timezone('utc', now()) where id = p_appointment_id; insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'appointment_reschedule_requested', jsonb_build_object('appointment_id', p_appointment_id)); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_appointment_reschedule_requested', 'appointment', p_appointment_id, true, '{}'::jsonb); return true; end $$;

create or replace function public.update_patient_profile(p_preferred_name text, p_preferred_language text, p_email text, p_phone text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); begin if patient_id_value is null or org_id is null then raise exception 'Patient portal access denied'; end if; update public.patients set preferred_name = p_preferred_name, preferred_language = p_preferred_language, updated_at = timezone('utc', now()) where id = patient_id_value and organization_id = org_id; insert into public.patient_contacts(organization_id, patient_id, email, phone, updated_at) values (org_id, patient_id_value, p_email, p_phone, timezone('utc', now())) on conflict (patient_id) do update set email = excluded.email, phone = excluded.phone, updated_at = timezone('utc', now()); insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'profile_updated', '{}'::jsonb); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_profile_updated', 'patient', patient_id_value, true, '{}'::jsonb); return true; end $$;

create or replace function public.patient_update_preferences(p_appointment_reminders boolean, p_marketing_opt_in boolean, p_sms_enabled boolean, p_email_enabled boolean, p_preferred_language text, p_quiet_hours jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); begin if patient_id_value is null or org_id is null then raise exception 'Patient portal access denied'; end if; insert into public.patient_notification_preferences(organization_id, patient_id, appointment_reminders, marketing_opt_in, sms_enabled, email_enabled, preferred_language, quiet_hours) values (org_id, patient_id_value, p_appointment_reminders, p_marketing_opt_in, p_sms_enabled, p_email_enabled, p_preferred_language, coalesce(p_quiet_hours, '{}'::jsonb)) on conflict (organization_id, patient_id) do update set appointment_reminders = excluded.appointment_reminders, marketing_opt_in = excluded.marketing_opt_in, sms_enabled = excluded.sms_enabled, email_enabled = excluded.email_enabled, preferred_language = excluded.preferred_language, quiet_hours = excluded.quiet_hours, updated_at = timezone('utc', now()); insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'preferences_updated', '{}'::jsonb); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_preferences_updated', 'patient', patient_id_value, true, '{}'::jsonb); return true; end $$;

create or replace function public.accept_consent(p_consent_type text, p_version text, p_consent_date date, p_document_reference text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare patient_id_value uuid := public.patient_portal_patient_id(); org_id uuid := public.patient_portal_organization_id(); begin if patient_id_value is null or org_id is null then raise exception 'Patient portal access denied'; end if; insert into public.patient_consents(organization_id, patient_id, consent_type, consent_date, version, document_reference, withdrawn) values (org_id, patient_id_value, p_consent_type, p_consent_date, p_version, p_document_reference, false) on conflict (patient_id, consent_type, version) do update set withdrawn = false, consent_date = excluded.consent_date, document_reference = excluded.document_reference; insert into public.patient_portal_events(organization_id, patient_id, event_type, metadata) values (org_id, patient_id_value, 'consent_accepted', jsonb_build_object('consent_type', p_consent_type, 'version', p_version)); insert into public.audit_events(organization_id, action, entity_type, entity_id, security_event, metadata) values (org_id, 'patient.portal_consent_accepted', 'patient_consent', patient_id_value, true, jsonb_build_object('consent_type', p_consent_type, 'version', p_version)); return true; end $$;

do $$ declare table_name text; begin foreach table_name in array array['patient_portal_accounts', 'patient_portal_sessions', 'patient_saved_settings', 'patient_portal_events'] loop execute format('alter table public.%I enable row level security', table_name); execute format('grant select on public.%I to authenticated', table_name); end loop; end $$;
create policy patient_portal_accounts_self on public.patient_portal_accounts for select to authenticated using (auth_user_id = auth.uid());
create policy patient_portal_accounts_writes_denied on public.patient_portal_accounts for all to authenticated using (false) with check (false);
create policy patient_portal_sessions_self on public.patient_portal_sessions for select to authenticated using (exists (select 1 from public.patient_portal_accounts a where a.id = account_id and a.auth_user_id = auth.uid()));
create policy patient_portal_sessions_writes_denied on public.patient_portal_sessions for all to authenticated using (false) with check (false);
create policy patient_saved_settings_self on public.patient_saved_settings for select to authenticated using (patient_id = public.patient_portal_patient_id());
create policy patient_saved_settings_writes_denied on public.patient_saved_settings for all to authenticated using (false) with check (false);
create policy patient_portal_events_self on public.patient_portal_events for select to authenticated using (patient_id = public.patient_portal_patient_id());
create policy patient_portal_events_writes_denied on public.patient_portal_events for all to authenticated using (false) with check (false);

grant execute on function public.patient_login_placeholder(text) to anon, authenticated;
grant execute on function public.patient_portal_patient_id() to authenticated;
grant execute on function public.patient_portal_organization_id() to authenticated;
grant execute on function public.get_patient_dashboard() to authenticated;
grant execute on function public.get_patient_appointments(date, date) to authenticated;
grant execute on function public.request_appointment(uuid, uuid, uuid, uuid, text, timestamptz, integer, text, text) to authenticated;
grant execute on function public.cancel_request(uuid, text) to authenticated;
grant execute on function public.reschedule_request(uuid, timestamptz, integer, text) to authenticated;
grant execute on function public.update_patient_profile(text, text, text, text) to authenticated;
grant execute on function public.patient_update_preferences(boolean, boolean, boolean, boolean, text, jsonb) to authenticated;
grant execute on function public.accept_consent(text, text, date, text) to authenticated;

create or replace function public.get_patient_profile()
returns jsonb language sql security definer set search_path = pg_catalog, public, auth
as $$
  select jsonb_build_object('patientId', p.id, 'preferredName', p.preferred_name, 'preferredLanguage', p.preferred_language, 'email', c.email, 'phone', c.phone, 'preferredContactMethod', c.preferred_contact_method)
  from public.patients p
  left join public.patient_contacts c on c.patient_id = p.id and c.organization_id = p.organization_id
  where p.id = public.patient_portal_patient_id() and p.organization_id = public.patient_portal_organization_id()
$$;

create or replace function public.get_patient_preferences()
returns jsonb language sql security definer set search_path = pg_catalog, public, auth
as $$
  select coalesce(to_jsonb(n), '{}'::jsonb)
  from public.patient_notification_preferences n
  where n.patient_id = public.patient_portal_patient_id() and n.organization_id = public.patient_portal_organization_id()
$$;

create or replace function public.get_patient_consents()
returns jsonb language sql security definer set search_path = pg_catalog, public, auth
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'consentType', c.consent_type, 'version', c.version, 'consentDate', c.consent_date, 'documentReference', c.document_reference, 'withdrawn', c.withdrawn) order by c.consent_date desc), '[]'::jsonb)
  from public.patient_consents c
  where c.patient_id = public.patient_portal_patient_id() and c.organization_id = public.patient_portal_organization_id()
$$;

create or replace function public.get_patient_billing()
returns jsonb language sql security definer set search_path = pg_catalog, public, auth
as $$
  select jsonb_build_object(
    'invoices', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'invoiceNumber', i.invoice_number, 'status', i.status, 'currency', i.currency, 'total', i.total, 'balance', i.balance, 'dueDate', i.due_date, 'issuedAt', i.issued_at) order by i.created_at desc) from public.invoices i where i.patient_id = public.patient_portal_patient_id() and i.organization_id = public.patient_portal_organization_id()), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'method', p.method, 'amount', p.amount, 'currency', p.currency, 'status', p.status, 'receivedAt', p.received_at, 'reference', p.reference) order by p.received_at desc) from public.payments p where p.patient_id = public.patient_portal_patient_id() and p.organization_id = public.patient_portal_organization_id()), '[]'::jsonb),
    'receipts', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'receiptNumber', r.receipt_number, 'paymentId', r.payment_id, 'issuedAt', r.issued_at) order by r.issued_at desc) from public.receipts r join public.payments p on p.id = r.payment_id and p.organization_id = r.organization_id where p.patient_id = public.patient_portal_patient_id() and r.organization_id = public.patient_portal_organization_id()), '[]'::jsonb)
  )
$$;

create or replace function public.get_patient_communications()
returns jsonb language sql security definer set search_path = pg_catalog, public, auth
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'channel', n.channel, 'status', n.status, 'subject', n.subject, 'scheduledAt', n.scheduled_send_at, 'createdAt', n.created_at) order by n.created_at desc), '[]'::jsonb)
  from public.notification_queue n
  where n.patient_id = public.patient_portal_patient_id() and n.organization_id = public.patient_portal_organization_id()
$$;

grant execute on function public.get_patient_profile() to authenticated;
grant execute on function public.get_patient_preferences() to authenticated;
grant execute on function public.get_patient_consents() to authenticated;
grant execute on function public.get_patient_billing() to authenticated;
grant execute on function public.get_patient_communications() to authenticated;
create trigger patient_portal_accounts_set_updated_at before update on public.patient_portal_accounts for each row execute function public.set_updated_at();
create trigger patient_saved_settings_set_updated_at before update on public.patient_saved_settings for each row execute function public.set_updated_at();
