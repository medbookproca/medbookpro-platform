create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  clinic_id uuid references public.clinics (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  action text not null check (action = lower(action) and char_length(action) between 1 and 200),
  entity_type text not null check (entity_type = lower(entity_type) and char_length(entity_type) between 1 and 100),
  entity_id uuid,
  request_id text,
  security_event boolean not null default false,
  outcome text not null default 'success' check (outcome in ('success', 'failure', 'denied')),
  ip_address inet,
  user_agent text,
  before_metadata jsonb,
  after_metadata jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  retention_until timestamptz,
  constraint audit_metadata_objects_check check (
    jsonb_typeof(metadata) = 'object'
    and (before_metadata is null or jsonb_typeof(before_metadata) = 'object')
    and (after_metadata is null or jsonb_typeof(after_metadata) = 'object')
  )
);

create index audit_events_organization_time_idx on public.audit_events (organization_id, occurred_at desc);
create index audit_events_actor_time_idx on public.audit_events (actor_profile_id, occurred_at desc);
create index audit_events_request_idx on public.audit_events (request_id) where request_id is not null;
create index audit_events_security_time_idx on public.audit_events (security_event, occurred_at desc);

comment on table public.audit_events is 'Append-oriented audit metadata; never store secrets or full clinical records.';
