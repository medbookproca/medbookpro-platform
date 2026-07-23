insert into public.permissions (key, domain, action, description)
values ('reports.admin', 'reports', 'admin', 'Manage reporting configuration and saved filters')
on conflict (key) do update set description = excluded.description, status = 'active';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('organization.admin', 'clinic.admin') and r.organization_id is null
  and p.key in ('reports.read', 'reports.export', 'reports.admin')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('billing.specialist', 'marketing.staff') and r.organization_id is null
  and p.key in ('reports.read', 'reports.export')
on conflict do nothing;

create table public.report_saved_filters (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  report_key text not null check (report_key = lower(report_key) and char_length(btrim(report_key)) between 1 and 120), name text not null check (char_length(btrim(name)) between 1 and 120), filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique (organization_id, name)
);

create or replace function public.reporting_permission(target_organization_id uuid, required_action text default 'read')
returns boolean language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select public.has_permission(target_organization_id, 'reports.' || required_action) $$;

create or replace view public.vw_dashboard_summary with (security_barrier = true) as
select o.id as organization_id, o.display_name as organization_name,
  (select count(*) from public.patients p where p.organization_id = o.id and p.status = 'active')::integer as active_patients,
  (select count(*) from public.appointments a where a.organization_id = o.id and a.status not in ('cancelled', 'no_show'))::integer as active_appointments,
  (select coalesce(sum(i.balance), 0) from public.invoices i where i.organization_id = o.id and i.status in ('issued', 'partially_paid', 'overdue')) as outstanding_invoices,
  (select coalesce(sum(p.amount), 0) from public.payments p where p.organization_id = o.id and p.status = 'completed') as recorded_payments,
  (select count(*) from public.encounters e where e.organization_id = o.id and e.status <> 'archived')::integer as clinical_encounters,
  (select count(*) from public.notification_queue n where n.organization_id = o.id and n.status in ('pending', 'processing', 'retrying'))::integer as pending_notifications
from public.organizations o where public.reporting_permission(o.id, 'read');

create or replace view public.vw_revenue_summary with (security_barrier = true) as
select i.organization_id, date_trunc('month', coalesce(i.issued_at, i.created_at))::date as period_start, count(*)::integer as invoice_count, sum(i.subtotal) as subtotal, sum(i.tax) as tax, sum(i.discount) as discount, sum(i.total) as total, sum(i.balance) as balance
from public.invoices i where public.reporting_permission(i.organization_id, 'read') group by i.organization_id, date_trunc('month', coalesce(i.issued_at, i.created_at))::date;

create or replace view public.vw_appointment_statistics with (security_barrier = true) as
select a.organization_id, a.location_id, a.practitioner_id, a.scheduled_start::date as activity_date, a.status, count(*)::integer as appointment_count
from public.appointments a where public.reporting_permission(a.organization_id, 'read') group by a.organization_id, a.location_id, a.practitioner_id, a.scheduled_start::date, a.status;

create or replace view public.vw_patient_growth with (security_barrier = true) as
select p.organization_id, date_trunc('month', p.created_at)::date as period_start, count(*)::integer as new_patient_count
from public.patients p where public.reporting_permission(p.organization_id, 'read') group by p.organization_id, date_trunc('month', p.created_at)::date;

create or replace view public.vw_practitioner_activity with (security_barrier = true) as
with appointment_activity as (select a.organization_id, a.practitioner_id, a.location_id, a.scheduled_start::date as activity_date, count(*)::integer as appointment_count from public.appointments a where public.reporting_permission(a.organization_id, 'read') group by a.organization_id, a.practitioner_id, a.location_id, a.scheduled_start::date), encounter_activity as (select e.organization_id, e.practitioner_id, e.created_at::date as activity_date, count(*)::integer as encounter_count from public.encounters e where public.reporting_permission(e.organization_id, 'read') group by e.organization_id, e.practitioner_id, e.created_at::date)
select a.organization_id, a.practitioner_id, pr.display_name, a.location_id, a.activity_date, a.appointment_count, coalesce(e.encounter_count, 0)::integer as encounter_count
from appointment_activity a join public.practitioners pr on pr.id = a.practitioner_id and pr.organization_id = a.organization_id left join encounter_activity e on e.organization_id = a.organization_id and e.practitioner_id = a.practitioner_id and e.activity_date = a.activity_date;

create or replace view public.vw_invoice_status with (security_barrier = true) as
select i.organization_id, i.status, count(*)::integer as invoice_count, sum(i.total) as total, sum(i.balance) as balance
from public.invoices i where public.reporting_permission(i.organization_id, 'read') group by i.organization_id, i.status;

create or replace view public.vw_payment_summary with (security_barrier = true) as
select p.organization_id, p.received_at::date as payment_date, p.method, p.status, count(*)::integer as payment_count, sum(p.amount) as amount
from public.payments p where public.reporting_permission(p.organization_id, 'read') group by p.organization_id, p.received_at::date, p.method, p.status;

create or replace view public.vw_communication_summary with (security_barrier = true) as
select q.organization_id, q.created_at::date as activity_date, q.channel, q.status, count(*)::integer as notification_count, count(d.id)::integer as delivery_count
from public.notification_queue q left join public.notification_deliveries d on d.queue_id = q.id and d.organization_id = q.organization_id
where public.reporting_permission(q.organization_id, 'read') group by q.organization_id, q.created_at::date, q.channel, q.status;

create or replace view public.vw_clinical_activity with (security_barrier = true) as
select e.organization_id, e.practitioner_id, e.status, e.created_at::date as activity_date, count(*)::integer as encounter_count
from public.encounters e where public.reporting_permission(e.organization_id, 'read') group by e.organization_id, e.practitioner_id, e.status, e.created_at::date;

create or replace view public.vw_staff_activity with (security_barrier = true) as
select a.organization_id, a.actor_profile_id, a.action, a.occurred_at::date as activity_date, count(*)::integer as event_count
from public.audit_events a where a.organization_id is not null and public.reporting_permission(a.organization_id, 'read') group by a.organization_id, a.actor_profile_id, a.action, a.occurred_at::date;

create or replace function public.get_dashboard_summary(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date, p_location_id uuid default null, p_practitioner_id uuid default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin
  if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if;
  select jsonb_build_object('organizationId', p_organization_id, 'fromDate', p_from_date, 'toDate', p_to_date, 'appointments', (select count(*) from public.appointments a where a.organization_id = p_organization_id and a.scheduled_start::date between p_from_date and p_to_date and (p_location_id is null or a.location_id = p_location_id) and (p_practitioner_id is null or a.practitioner_id = p_practitioner_id)), 'patients', (select count(*) from public.patients p where p.organization_id = p_organization_id and p.created_at::date between p_from_date and p_to_date), 'revenue', (select coalesce(sum(i.total), 0) from public.invoices i where i.organization_id = p_organization_id and i.status not in ('draft', 'cancelled', 'void') and coalesce(i.issued_at, i.created_at)::date between p_from_date and p_to_date), 'outstanding', (select coalesce(sum(i.balance), 0) from public.invoices i where i.organization_id = p_organization_id and i.status in ('issued', 'partially_paid', 'overdue')), 'payments', (select coalesce(sum(pay.amount), 0) from public.payments pay where pay.organization_id = p_organization_id and pay.status = 'completed' and pay.received_at::date between p_from_date and p_to_date), 'encounters', (select count(*) from public.encounters e where e.organization_id = p_organization_id and e.created_at::date between p_from_date and p_to_date), 'notifications', (select count(*) from public.notification_queue n where n.organization_id = p_organization_id and n.created_at::date between p_from_date and p_to_date)) into result;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, security_event, metadata) values (auth.uid(), p_organization_id, 'report.dashboard_accessed', 'report', false, jsonb_build_object('from_date', p_from_date, 'to_date', p_to_date)); return result;
end $$;

create or replace function public.get_revenue_summary(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select coalesce(jsonb_agg(to_jsonb(v) order by v.period_start), '[]'::jsonb) into result from public.vw_revenue_summary v where v.organization_id = p_organization_id and v.period_start between date_trunc('month', p_from_date)::date and date_trunc('month', p_to_date)::date; return result; end $$;

create or replace function public.get_patient_growth(p_organization_id uuid, p_from_date date default current_date - 365, p_to_date date default current_date)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select coalesce(jsonb_agg(to_jsonb(v) order by v.period_start), '[]'::jsonb) into result from public.vw_patient_growth v where v.organization_id = p_organization_id and v.period_start between date_trunc('month', p_from_date)::date and date_trunc('month', p_to_date)::date; return result; end $$;

create or replace function public.get_practitioner_activity(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date, p_location_id uuid default null, p_practitioner_id uuid default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select coalesce(jsonb_agg(to_jsonb(v) order by v.activity_date), '[]'::jsonb) into result from public.vw_practitioner_activity v where v.organization_id = p_organization_id and v.activity_date between p_from_date and p_to_date and (p_location_id is null or v.location_id = p_location_id) and (p_practitioner_id is null or v.practitioner_id = p_practitioner_id); return result; end $$;

create or replace function public.get_billing_summary(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select jsonb_build_object('invoiceStatuses', coalesce((select jsonb_agg(to_jsonb(v) order by v.status) from public.vw_invoice_status v where v.organization_id = p_organization_id), '[]'::jsonb), 'payments', coalesce((select jsonb_agg(to_jsonb(v) order by v.payment_date) from public.vw_payment_summary v where v.organization_id = p_organization_id and v.payment_date between p_from_date and p_to_date), '[]'::jsonb)) into result; return result; end $$;

create or replace function public.get_clinical_summary(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date, p_practitioner_id uuid default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select coalesce(jsonb_agg(to_jsonb(v) order by v.activity_date), '[]'::jsonb) into result from public.vw_clinical_activity v where v.organization_id = p_organization_id and v.activity_date between p_from_date and p_to_date and (p_practitioner_id is null or v.practitioner_id = p_practitioner_id); return result; end $$;

create or replace function public.get_communication_summary(p_organization_id uuid, p_from_date date default current_date - 30, p_to_date date default current_date)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare result jsonb; begin if not public.reporting_permission(p_organization_id, 'read') then raise exception 'Permission denied'; end if; select coalesce(jsonb_agg(to_jsonb(v) order by v.activity_date), '[]'::jsonb) into result from public.vw_communication_summary v where v.organization_id = p_organization_id and v.activity_date between p_from_date and p_to_date; return result; end $$;

create or replace function public.request_report_export(p_organization_id uuid, p_report_key text, p_format text, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ begin if not public.reporting_permission(p_organization_id, 'export') then raise exception 'Permission denied'; end if; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, security_event, metadata) values (auth.uid(), p_organization_id, 'report.export_requested', 'report', true, jsonb_build_object('report_key', p_report_key, 'format', p_format, 'filters', p_filters)); return jsonb_build_object('status', 'placeholder', 'reportKey', p_report_key, 'format', p_format); end $$;

create or replace function public.save_report_filter(p_organization_id uuid, p_id uuid, p_report_key text, p_name text, p_filters jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare filter_id uuid; begin if not public.reporting_permission(p_organization_id, 'admin') then raise exception 'Permission denied'; end if; insert into public.report_saved_filters(id, organization_id, report_key, name, filters, created_by, updated_by) values (coalesce(p_id, gen_random_uuid()), p_organization_id, p_report_key, p_name, p_filters, auth.uid(), auth.uid()) on conflict (id) do update set report_key = excluded.report_key, name = excluded.name, filters = excluded.filters, updated_by = auth.uid(), updated_at = timezone('utc', now()) returning id into filter_id; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (auth.uid(), p_organization_id, 'report.saved_filter_updated', 'report_saved_filter', filter_id, false, jsonb_build_object('report_key', p_report_key)); return filter_id; end $$;

do $$ declare view_name text; begin foreach view_name in array array['vw_dashboard_summary', 'vw_revenue_summary', 'vw_appointment_statistics', 'vw_patient_growth', 'vw_practitioner_activity', 'vw_invoice_status', 'vw_payment_summary', 'vw_communication_summary', 'vw_clinical_activity', 'vw_staff_activity'] loop execute format('revoke all on public.%I from public', view_name); execute format('grant select on public.%I to authenticated', view_name); end loop; end $$;
alter table public.report_saved_filters enable row level security;
grant select on public.report_saved_filters to authenticated;
create policy report_saved_filters_read on public.report_saved_filters for select to authenticated using (public.reporting_permission(organization_id, 'read'));
create policy report_saved_filters_writes_denied on public.report_saved_filters for all to authenticated using (false) with check (false);

grant execute on function public.reporting_permission(uuid, text) to authenticated;
grant execute on function public.get_dashboard_summary(uuid, date, date, uuid, uuid) to authenticated;
grant execute on function public.get_revenue_summary(uuid, date, date) to authenticated;
grant execute on function public.get_patient_growth(uuid, date, date) to authenticated;
grant execute on function public.get_practitioner_activity(uuid, date, date, uuid, uuid) to authenticated;
grant execute on function public.get_billing_summary(uuid, date, date) to authenticated;
grant execute on function public.get_clinical_summary(uuid, date, date, uuid) to authenticated;
grant execute on function public.get_communication_summary(uuid, date, date) to authenticated;
grant execute on function public.request_report_export(uuid, text, text, jsonb) to authenticated;
grant execute on function public.save_report_filter(uuid, uuid, text, text, jsonb) to authenticated;
create trigger report_saved_filters_set_updated_at before update on public.report_saved_filters for each row execute function public.set_updated_at();
