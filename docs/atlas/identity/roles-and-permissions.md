# Roles and permissions

## Permission catalogue

Permissions use stable `domain.action` keys. Reserved initial keys are:

```text
organizations.read organizations.manage organizations.delete
clinics.read clinics.create clinics.manage clinics.archive
locations.read locations.create locations.manage locations.archive
staff.read staff.invite staff.manage staff.suspend
roles.read roles.manage permissions.read
appointments.read appointments.create appointments.manage appointments.cancel
patients.read_demographics patients.manage_demographics patients.read_clinical patients.manage_clinical
services.read services.manage
billing.read billing.manage billing.refund
communications.read communications.send communications.send_bulk
automations.read automations.manage automations.publish
reports.read reports.export audit.read
settings.read settings.manage
```

The reserved clinical and operational keys do not authorize tables that do not yet exist. Permission keys are canonical, never silently renamed, and are deactivated rather than reused.

## System role templates

The initial templates are Platform Super Administrator, Organization Owner, Organization Administrator, Clinic Administrator, Location Manager, Receptionist, Practitioner, Billing Specialist, Marketing Staff, Data Migration Specialist, and Read-Only Auditor. Templates document recommended permissions; they are not a substitute for database-enforced checks.

## Role storage

System roles are centrally referenced and cannot be edited by organizations. Custom roles, if enabled, are organization-owned records with organization-scoped names and permissions. Whether custom roles ship in the first commercial release is open. Copying system roles into every organization is not preferred because it creates drift and makes security corrections harder.

Roles are assigned through `membership_roles`; profiles never carry a global role. A role assignment is valid only when its membership is active, the role is active, the role is available to that organization, and the requested resource is inside membership scope.

## Resolution model

1. Resolve `auth.uid()` to an active profile.
2. Resolve an active membership for the requested organization.
3. Evaluate clinic/location scope against the target resource.
4. Resolve active membership roles.
5. Expand roles to active permissions.
6. Require the requested permission and resource-specific ownership/parent checks.

The initial model is allow-based: no matching permission means deny. Explicit deny permissions are not supported initially. A future deny model would require precedence, migration, and testing rules before adoption.

There is no implicit elevation from a child role, and users cannot grant permissions they do not themselves hold or that policy does not explicitly delegate. Role changes affect authorization immediately after transaction commit; cached browser context is advisory and must be revalidated server-side.

## Role deletion and platform separation

Custom roles are archived, not hard-deleted, while assignments or audit history reference them. Removing a permission from a role takes effect for current assignments after commit. Platform authorization is a separate trust boundary and is never inferred from organization roles. Controlled support access remains an open decision.
