create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  raise exception using errcode = '42501', message = 'AUDIT_EVENTS_APPEND_ONLY';
end;
$$;

revoke all on function public.prevent_audit_event_mutation() from public;

drop trigger if exists audit_events_append_only on public.audit_events;
create trigger audit_events_append_only
before update or delete on public.audit_events
for each row execute function public.prevent_audit_event_mutation();

create index if not exists patients_organization_status_updated_idx
  on public.patients (organization_id, status, updated_at desc);
create index if not exists appointments_organization_schedule_idx
  on public.appointments (organization_id, scheduled_start, status);
create index if not exists appointments_patient_schedule_idx
  on public.appointments (organization_id, patient_id, scheduled_start desc);
create index if not exists notification_queue_organization_status_schedule_idx
  on public.notification_queue (organization_id, status, scheduled_send_at);
create index if not exists invoices_organization_status_issued_idx
  on public.invoices (organization_id, status, issued_at desc);
create index if not exists documents_organization_patient_created_idx
  on public.documents (organization_id, patient_id, created_at desc);
create index if not exists telehealth_sessions_organization_schedule_idx
  on public.telehealth_sessions (organization_id, scheduled_start, status);
create index if not exists integration_jobs_organization_status_run_after_idx
  on public.integration_jobs (organization_id, status, run_after);
create index if not exists integration_events_organization_occurred_idx
  on public.integration_events (organization_id, occurred_at desc);
create index if not exists ai_requests_organization_requested_idx
  on public.ai_requests (organization_id, requested_at desc, status);
create index if not exists ai_events_organization_occurred_idx
  on public.ai_events (organization_id, occurred_at desc);

comment on function public.prevent_audit_event_mutation() is 'Enforces append-only audit history, including for privileged local maintenance roles.';
