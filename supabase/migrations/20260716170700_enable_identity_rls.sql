alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.clinics enable row level security;
alter table public.locations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.membership_clinic_scopes enable row level security;
alter table public.membership_location_scopes enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated
using (id = public.current_profile_id());
create policy profiles_update_self on public.profiles for update to authenticated
using (id = public.current_profile_id())
with check (id = public.current_profile_id() and status = 'active');
create policy profiles_delete_denied on public.profiles for delete to authenticated using (false);

create policy organizations_select_member on public.organizations for select to authenticated
using (public.has_organization_access(id) and status = 'active');
create policy organizations_insert_authenticated on public.organizations for insert to authenticated
with check (public.current_profile_id() is not null and status = 'active');
create policy organizations_update_manager on public.organizations for update to authenticated
using (public.has_permission(id, 'organizations.manage'))
with check (public.has_permission(id, 'organizations.manage'));
create policy organizations_delete_denied on public.organizations for delete to authenticated using (false);

create policy clinics_select_scoped_member on public.clinics for select to authenticated
using (public.has_clinic_access(id));
create policy clinics_insert_manager on public.clinics for insert to authenticated
with check (status = 'active' and public.has_permission(organization_id, 'clinics.create'));
create policy clinics_update_manager on public.clinics for update to authenticated
using (public.has_permission(organization_id, 'clinics.manage'))
with check (public.has_permission(organization_id, 'clinics.manage'));
create policy clinics_delete_denied on public.clinics for delete to authenticated using (false);

create policy locations_select_scoped_member on public.locations for select to authenticated
using (public.has_location_access(id));
create policy locations_insert_manager on public.locations for insert to authenticated
with check (status = 'active' and public.has_permission(organization_id, 'locations.create') and public.has_clinic_access(clinic_id));
create policy locations_update_manager on public.locations for update to authenticated
using (public.has_permission(organization_id, 'locations.manage') and public.has_location_access(id))
with check (public.has_permission(organization_id, 'locations.manage'));
create policy locations_delete_denied on public.locations for delete to authenticated using (false);

create policy memberships_select_member_or_staff on public.organization_memberships for select to authenticated
using (public.has_organization_access(organization_id) or (public.has_permission(organization_id, 'staff.read') and status <> 'revoked'));
create policy memberships_insert_staff on public.organization_memberships for insert to authenticated
with check (public.has_permission(organization_id, 'staff.invite') and status in ('invited', 'active'));
create policy memberships_update_staff on public.organization_memberships for update to authenticated
using (public.has_permission(organization_id, 'staff.manage') or public.has_permission(organization_id, 'staff.suspend'))
with check (public.has_permission(organization_id, 'staff.manage') or public.has_permission(organization_id, 'staff.suspend'));
create policy memberships_delete_denied on public.organization_memberships for delete to authenticated using (false);

create policy clinic_scopes_select_staff on public.membership_clinic_scopes for select to authenticated
using (public.has_permission(organization_id, 'staff.read'));
create policy clinic_scopes_insert_staff on public.membership_clinic_scopes for insert to authenticated
with check (public.has_permission(organization_id, 'staff.manage'));
create policy clinic_scopes_update_staff on public.membership_clinic_scopes for update to authenticated
using (public.has_permission(organization_id, 'staff.manage'))
with check (public.has_permission(organization_id, 'staff.manage'));
create policy clinic_scopes_delete_staff on public.membership_clinic_scopes for delete to authenticated
using (public.has_permission(organization_id, 'staff.manage'));

create policy location_scopes_select_staff on public.membership_location_scopes for select to authenticated
using (public.has_permission(organization_id, 'staff.read'));
create policy location_scopes_insert_staff on public.membership_location_scopes for insert to authenticated
with check (public.has_permission(organization_id, 'staff.manage'));
create policy location_scopes_update_staff on public.membership_location_scopes for update to authenticated
using (public.has_permission(organization_id, 'staff.manage'))
with check (public.has_permission(organization_id, 'staff.manage'));
create policy location_scopes_delete_staff on public.membership_location_scopes for delete to authenticated
using (public.has_permission(organization_id, 'staff.manage'));

create policy roles_select_available on public.roles for select to authenticated
using (organization_id is null or public.has_organization_access(organization_id));
create policy roles_insert_custom on public.roles for insert to authenticated
with check (kind = 'custom' and public.has_permission(organization_id, 'roles.manage'));
create policy roles_update_custom on public.roles for update to authenticated
using (kind = 'custom' and public.has_permission(organization_id, 'roles.manage'))
with check (kind = 'custom' and public.has_permission(organization_id, 'roles.manage'));
create policy roles_delete_denied on public.roles for delete to authenticated using (false);

create policy permissions_select_authenticated on public.permissions for select to authenticated
using (auth.uid() is not null);
create policy permissions_insert_denied on public.permissions for insert to authenticated with check (false);
create policy permissions_update_denied on public.permissions for update to authenticated using (false);
create policy permissions_delete_denied on public.permissions for delete to authenticated using (false);

create policy role_permissions_select_available on public.role_permissions for select to authenticated
using (exists (select 1 from public.roles r where r.id = role_id and (r.organization_id is null or public.has_organization_access(r.organization_id))));
create policy role_permissions_insert_manager on public.role_permissions for insert to authenticated
with check (exists (select 1 from public.roles r where r.id = role_id and r.kind = 'custom' and public.has_permission(r.organization_id, 'roles.manage')));
create policy role_permissions_update_manager on public.role_permissions for update to authenticated
using (exists (select 1 from public.roles r where r.id = role_id and r.kind = 'custom' and public.has_permission(r.organization_id, 'roles.manage')))
with check (exists (select 1 from public.roles r where r.id = role_id and r.kind = 'custom' and public.has_permission(r.organization_id, 'roles.manage')));
create policy role_permissions_delete_manager on public.role_permissions for delete to authenticated
using (exists (select 1 from public.roles r where r.id = role_id and r.kind = 'custom' and public.has_permission(r.organization_id, 'roles.manage')));

create policy membership_roles_select_member_or_staff on public.membership_roles for select to authenticated
using (public.has_organization_access(organization_id));
create policy membership_roles_insert_manager on public.membership_roles for insert to authenticated
with check (public.has_permission(organization_id, 'roles.manage') and exists (select 1 from public.roles r where r.id = role_id and (r.organization_id is null or r.organization_id = organization_id)));
create policy membership_roles_update_manager on public.membership_roles for update to authenticated
using (public.has_permission(organization_id, 'roles.manage'))
with check (public.has_permission(organization_id, 'roles.manage'));
create policy membership_roles_delete_manager on public.membership_roles for delete to authenticated
using (public.has_permission(organization_id, 'roles.manage'));

create policy invitations_select_staff on public.invitations for select to authenticated
using (public.has_permission(organization_id, 'staff.read'));
create policy invitations_insert_staff on public.invitations for insert to authenticated
with check (public.has_permission(organization_id, 'staff.invite') and invited_by = public.current_profile_id());
create policy invitations_update_staff on public.invitations for update to authenticated
using (public.has_permission(organization_id, 'staff.invite'))
with check (public.has_permission(organization_id, 'staff.invite'));
create policy invitations_delete_denied on public.invitations for delete to authenticated using (false);

create policy audit_events_select_reader on public.audit_events for select to authenticated
using (organization_id is not null and public.has_permission(organization_id, 'audit.read'));
create policy audit_events_insert_denied on public.audit_events for insert to authenticated with check (false);
create policy audit_events_update_denied on public.audit_events for update to authenticated using (false);
create policy audit_events_delete_denied on public.audit_events for delete to authenticated using (false);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
