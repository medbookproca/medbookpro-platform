create or replace function public.create_service(
  p_organization_id uuid,
  p_name text,
  p_description text default null,
  p_display_order integer default 0
)
returns table (service_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  caller_id uuid := auth.uid();
  created_service_id uuid;
begin
  if caller_id is null or not public.has_permission(p_organization_id, 'services.manage') then
    raise exception using errcode = '42501', message = 'SERVICE_CREATE_FORBIDDEN';
  end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 200 or p_display_order < 0 then
    raise exception using errcode = '22023', message = 'SERVICE_INVALID';
  end if;
  insert into public.services (organization_id, name, description, display_order, created_by, updated_by)
  values (p_organization_id, btrim(p_name), nullif(btrim(p_description), ''), p_display_order, caller_id, caller_id)
  returning id into created_service_id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata)
  values (caller_id, p_organization_id, 'service.created', 'service', created_service_id, true, jsonb_build_object('display_order', p_display_order));
  service_id := created_service_id;
  return next;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'SERVICE_NAME_ALREADY_EXISTS';
end;
$$;

create or replace function public.update_service(
  p_service_id uuid,
  p_name text,
  p_description text default null,
  p_display_order integer default 0
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  caller_id uuid := auth.uid();
  service_record public.services%rowtype;
begin
  select * into service_record from public.services where id = p_service_id for update;
  if not found or not public.has_permission(service_record.organization_id, 'services.manage') then
    raise exception using errcode = '42501', message = 'SERVICE_UPDATE_FORBIDDEN';
  end if;
  if service_record.status = 'archived' or char_length(btrim(coalesce(p_name, ''))) not between 1 and 200 or p_display_order < 0 then
    raise exception using errcode = '22023', message = 'SERVICE_INVALID';
  end if;
  update public.services
  set name = btrim(p_name), description = nullif(btrim(p_description), ''), display_order = p_display_order, updated_by = caller_id
  where id = service_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata)
  values (caller_id, service_record.organization_id, 'service.updated', 'service', service_record.id, true, '{}'::jsonb);
  return true;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'SERVICE_NAME_ALREADY_EXISTS';
end;
$$;

create or replace function public.archive_service(p_service_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  caller_id uuid := auth.uid();
  service_record public.services%rowtype;
begin
  select * into service_record from public.services where id = p_service_id for update;
  if not found or not public.has_permission(service_record.organization_id, 'services.manage') then
    raise exception using errcode = '42501', message = 'SERVICE_ARCHIVE_FORBIDDEN';
  end if;
  if service_record.status = 'archived' then return true; end if;
  update public.services set status = 'archived', updated_by = caller_id where id = service_record.id;
  insert into public.audit_events (actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata)
  values (caller_id, service_record.organization_id, 'service.archived', 'service', service_record.id, true, '{}'::jsonb);
  return true;
end;
$$;

revoke all on function public.create_service(uuid, text, text, integer) from public;
revoke all on function public.update_service(uuid, text, text, integer) from public;
revoke all on function public.archive_service(uuid) from public;
grant execute on function public.create_service(uuid, text, text, integer) to authenticated;
grant execute on function public.update_service(uuid, text, text, integer) to authenticated;
grant execute on function public.archive_service(uuid) to authenticated;
