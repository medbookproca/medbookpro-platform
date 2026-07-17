create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  key text not null check (key = lower(key) and key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 200),
  description text,
  kind text not null check (kind in ('system', 'custom')),
  status text not null default 'active' check (status in ('active', 'archived')),
  version integer not null default 1 check (version > 0),
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint roles_kind_organization_check check ((kind = 'system' and organization_id is null) or (kind = 'custom' and organization_id is not null))
);

create unique index roles_system_key_idx on public.roles (key) where organization_id is null;
create unique index roles_organization_key_idx on public.roles (organization_id, key) where organization_id is not null;
create index roles_organization_status_idx on public.roles (organization_id, status);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key = lower(key) and key ~ '^[a-z0-9_]+\.[a-z0-9_]+$'),
  domain text not null,
  action text not null,
  description text not null,
  status text not null default 'active' check (status in ('active', 'deprecated')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint permissions_key_parts_check check (key = domain || '.' || action)
);

create index permissions_domain_status_idx on public.permissions (domain, status);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete restrict,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_idx on public.role_permissions (permission_id);

create table public.membership_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  membership_id uuid not null references public.organization_memberships (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint membership_roles_unique unique (membership_id, role_id),
  constraint membership_roles_membership_fk foreign key (membership_id, organization_id)
    references public.organization_memberships (id, organization_id) on delete cascade
);

create index membership_roles_membership_idx on public.membership_roles (membership_id);
create index membership_roles_role_idx on public.membership_roles (role_id);

create trigger roles_set_updated_at before update on public.roles for each row execute function public.set_updated_at();
create trigger permissions_set_updated_at before update on public.permissions for each row execute function public.set_updated_at();
