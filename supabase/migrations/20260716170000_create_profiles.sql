create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text,
  preferred_name text,
  status text not null default 'active' check (status in ('active', 'suspended', 'deactivated')),
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 200),
  constraint profiles_preferred_name_length check (preferred_name is null or char_length(preferred_name) between 1 and 200)
);

create index profiles_status_idx on public.profiles (status);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
grant execute on function public.handle_new_auth_user() to supabase_auth_admin;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
