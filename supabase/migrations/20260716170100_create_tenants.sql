create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  slug text not null check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  legal_name text,
  default_timezone text not null default 'America/Edmonton',
  default_country_code text not null default 'CA' check (char_length(default_country_code) = 2),
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index organizations_slug_idx on public.organizations (slug);
create index organizations_status_idx on public.organizations (status);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 200),
  slug text check (slug is null or (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  timezone text,
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index clinics_organization_slug_idx on public.clinics (organization_id, slug) where slug is not null;
create index clinics_organization_status_idx on public.clinics (organization_id, status);
alter table public.clinics add constraint clinics_id_organization_unique unique (id, organization_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 200),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  timezone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  province text,
  postal_code text,
  country_code text not null default 'CA' check (char_length(country_code) = 2),
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint locations_name_per_clinic unique (clinic_id, name),
  constraint locations_clinic_organization_fk foreign key (clinic_id, organization_id)
    references public.clinics (id, organization_id) on delete restrict
);

create index locations_organization_status_idx on public.locations (organization_id, status);
create index locations_clinic_status_idx on public.locations (clinic_id, status);
alter table public.locations add constraint locations_id_clinic_organization_unique unique (id, clinic_id, organization_id);

create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger clinics_set_updated_at before update on public.clinics for each row execute function public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
