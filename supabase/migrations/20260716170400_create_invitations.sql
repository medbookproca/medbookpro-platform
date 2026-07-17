create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized)) and email_normalized ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  target_profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  token_digest bytea not null unique,
  invited_by uuid not null references public.profiles (id) on delete restrict,
  accepted_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  proposed_access jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_access) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invitations_status_dates_check check (
    (status <> 'accepted' or accepted_at is not null and accepted_by is not null)
    and (status <> 'revoked' or revoked_at is not null)
  )
);

create unique index invitations_one_pending_idx on public.invitations (organization_id, email_normalized) where status = 'pending';
create index invitations_target_profile_idx on public.invitations (target_profile_id, status);
create index invitations_organization_status_idx on public.invitations (organization_id, status);
create index invitations_expiry_idx on public.invitations (expires_at) where status = 'pending';

create trigger invitations_set_updated_at before update on public.invitations for each row execute function public.set_updated_at();
