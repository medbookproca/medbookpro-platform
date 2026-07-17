-- Local-only identity catalogue. No people, credentials, patient data, or production identifiers.

insert into public.permissions (key, domain, action, description)
values
  ('organizations.read', 'organizations', 'read', 'Read organization information'),
  ('organizations.manage', 'organizations', 'manage', 'Manage organization settings'),
  ('organizations.delete', 'organizations', 'delete', 'Archive or delete an organization through approved workflows'),
  ('clinics.read', 'clinics', 'read', 'Read clinic information'),
  ('clinics.create', 'clinics', 'create', 'Create a clinic'),
  ('clinics.manage', 'clinics', 'manage', 'Manage a clinic'),
  ('clinics.archive', 'clinics', 'archive', 'Archive a clinic'),
  ('locations.read', 'locations', 'read', 'Read location information'),
  ('locations.create', 'locations', 'create', 'Create a location'),
  ('locations.manage', 'locations', 'manage', 'Manage a location'),
  ('locations.archive', 'locations', 'archive', 'Archive a location'),
  ('staff.read', 'staff', 'read', 'Read staff access records'),
  ('staff.invite', 'staff', 'invite', 'Invite staff'),
  ('staff.manage', 'staff', 'manage', 'Manage staff access'),
  ('staff.suspend', 'staff', 'suspend', 'Suspend staff access'),
  ('roles.read', 'roles', 'read', 'Read role assignments'),
  ('roles.manage', 'roles', 'manage', 'Manage organization roles'),
  ('permissions.read', 'permissions', 'read', 'Read the permission catalogue'),
  ('appointments.read', 'appointments', 'read', 'Reserved appointment read capability'),
  ('appointments.create', 'appointments', 'create', 'Reserved appointment create capability'),
  ('appointments.manage', 'appointments', 'manage', 'Reserved appointment management capability'),
  ('appointments.cancel', 'appointments', 'cancel', 'Reserved appointment cancellation capability'),
  ('patients.read_demographics', 'patients', 'read_demographics', 'Reserved demographic read capability'),
  ('patients.manage_demographics', 'patients', 'manage_demographics', 'Reserved demographic management capability'),
  ('patients.read_clinical', 'patients', 'read_clinical', 'Reserved clinical read capability'),
  ('patients.manage_clinical', 'patients', 'manage_clinical', 'Reserved clinical management capability'),
  ('services.read', 'services', 'read', 'Reserved service read capability'),
  ('services.manage', 'services', 'manage', 'Reserved service management capability'),
  ('billing.read', 'billing', 'read', 'Reserved billing read capability'),
  ('billing.manage', 'billing', 'manage', 'Reserved billing management capability'),
  ('billing.refund', 'billing', 'refund', 'Reserved billing refund capability'),
  ('communications.read', 'communications', 'read', 'Reserved communications read capability'),
  ('communications.send', 'communications', 'send', 'Reserved communication send capability'),
  ('communications.send_bulk', 'communications', 'send_bulk', 'Reserved bulk communication capability'),
  ('automations.read', 'automations', 'read', 'Reserved automation read capability'),
  ('automations.manage', 'automations', 'manage', 'Reserved automation management capability'),
  ('automations.publish', 'automations', 'publish', 'Reserved automation publish capability'),
  ('reports.read', 'reports', 'read', 'Reserved report read capability'),
  ('reports.export', 'reports', 'export', 'Reserved report export capability'),
  ('audit.read', 'audit', 'read', 'Read tenant audit events'),
  ('settings.read', 'settings', 'read', 'Read organization settings'),
  ('settings.manage', 'settings', 'manage', 'Manage organization settings')
on conflict (key) do update set description = excluded.description, domain = excluded.domain, action = excluded.action, status = 'active';

insert into public.roles (key, name, description, kind)
values
  ('platform.super_admin', 'Platform Super Administrator', 'Globally managed platform role; assignment is not seeded locally.', 'system'),
  ('organization.owner', 'Organization Owner', 'Full organization administration subject to platform safeguards.', 'system'),
  ('organization.admin', 'Organization Administrator', 'Day-to-day organization administration.', 'system'),
  ('clinic.admin', 'Clinic Administrator', 'Clinic and location administration.', 'system'),
  ('location.manager', 'Location Manager', 'Operational access for assigned locations.', 'system'),
  ('receptionist', 'Receptionist', 'Front-desk operational access.', 'system'),
  ('practitioner', 'Practitioner', 'Reserved practitioner operational access.', 'system'),
  ('billing.specialist', 'Billing Specialist', 'Reserved billing access.', 'system'),
  ('marketing.staff', 'Marketing Staff', 'Reserved communications and reporting access.', 'system'),
  ('data.migration.specialist', 'Data Migration Specialist', 'Controlled migration support access.', 'system'),
  ('read.only.auditor', 'Read-Only Auditor', 'Read-only audit and organization visibility.', 'system')
on conflict (key) where organization_id is null do update set name = excluded.name, description = excluded.description, status = 'active';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'platform.super_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'organization.owner'
  and p.key not in ('patients.manage_clinical', 'communications.send_bulk', 'automations.publish')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'organization.admin'
  and p.key in (
    'organizations.read', 'organizations.manage', 'clinics.read', 'clinics.create', 'clinics.manage', 'clinics.archive',
    'locations.read', 'locations.create', 'locations.manage', 'locations.archive', 'staff.read', 'staff.invite',
    'staff.manage', 'staff.suspend', 'roles.read', 'roles.manage', 'permissions.read', 'services.read', 'services.manage',
    'reports.read', 'reports.export', 'audit.read', 'settings.read', 'settings.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'clinic.admin'
  and p.key in ('organizations.read', 'clinics.read', 'clinics.manage', 'locations.read', 'locations.create', 'locations.manage', 'locations.archive', 'staff.read', 'staff.invite', 'staff.manage', 'staff.suspend', 'roles.read', 'services.read', 'services.manage', 'reports.read', 'audit.read', 'settings.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'location.manager'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'locations.manage', 'staff.read', 'appointments.read', 'appointments.manage', 'services.read', 'reports.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'receptionist'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'staff.read', 'appointments.read', 'appointments.create', 'appointments.manage', 'appointments.cancel', 'services.read', 'communications.read', 'settings.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'practitioner'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'appointments.read', 'appointments.manage', 'patients.read_demographics', 'patients.read_clinical', 'services.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'billing.specialist'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'billing.read', 'billing.manage', 'billing.refund', 'reports.read', 'reports.export')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'marketing.staff'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'communications.read', 'communications.send', 'reports.read', 'reports.export')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'data.migration.specialist'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'staff.read', 'services.read', 'services.manage', 'patients.read_demographics', 'patients.manage_demographics', 'reports.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'read.only.auditor'
  and p.key in ('organizations.read', 'clinics.read', 'locations.read', 'staff.read', 'roles.read', 'permissions.read', 'reports.read', 'reports.export', 'audit.read', 'settings.read')
on conflict do nothing;
