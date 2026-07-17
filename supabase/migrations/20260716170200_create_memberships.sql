create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended', 'revoked')),
  invited_at timestamptz,
  accepted_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  status_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint memberships_status_dates_check check (
    (status <> 'accepted' or accepted_at is not null)
    and (status <> 'suspended' or suspended_at is not null)
    and (status <> 'revoked' or revoked_at is not null)
  )
);

create unique index memberships_one_current_idx on public.organization_memberships (organization_id, profile_id)
where status in ('invited', 'active', 'suspended');
create index memberships_profile_status_idx on public.organization_memberships (profile_id, status);
create index memberships_organization_status_idx on public.organization_memberships (organization_id, status);
alter table public.organization_memberships add constraint memberships_id_organization_unique unique (id, organization_id);

create table public.membership_clinic_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  membership_id uuid not null references public.organization_memberships (id) on delete cascade,
  clinic_id uuid not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint membership_clinic_scopes_unique unique (membership_id, clinic_id),
  constraint membership_clinic_scopes_membership_fk foreign key (membership_id, organization_id)
    references public.organization_memberships (id, organization_id) on delete cascade,
  constraint membership_clinic_scopes_clinic_fk foreign key (clinic_id, organization_id)
    references public.clinics (id, organization_id) on delete restrict
);

create table public.membership_location_scopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  membership_id uuid not null references public.organization_memberships (id) on delete cascade,
  clinic_id uuid not null,
  location_id uuid not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint membership_location_scopes_unique unique (membership_id, location_id),
  constraint membership_location_scopes_membership_fk foreign key (membership_id, organization_id)
    references public.organization_memberships (id, organization_id) on delete cascade,
  constraint membership_location_scopes_location_fk foreign key (location_id, clinic_id, organization_id)
    references public.locations (id, clinic_id, organization_id) on delete restrict
);

create index membership_clinic_scopes_membership_idx on public.membership_clinic_scopes (membership_id);
create index membership_clinic_scopes_clinic_idx on public.membership_clinic_scopes (clinic_id);
create index membership_location_scopes_membership_idx on public.membership_location_scopes (membership_id);
create index membership_location_scopes_location_idx on public.membership_location_scopes (location_id);

create trigger memberships_set_updated_at before update on public.organization_memberships for each row execute function public.set_updated_at();
