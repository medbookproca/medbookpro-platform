# RLS policy matrix

This matrix describes intended policy outcomes. It is not SQL. Every table is deny-by-default and will require policy tests before migration.

## Common evaluation

```text
uid := auth.uid()
profile := active profile linked to uid
membership := active membership(profile, target.organization)
scope := membership has no scopes OR target satisfies clinic/location restrictions
permission := active membership role expands to requested permission
allow := profile and membership and scope and permission and parent resources are active
```

Suspended or revoked memberships fail before role evaluation. Archived or deleted resources do not grant operational access. Security-definer helpers may encapsulate read-only membership/permission checks to avoid recursive RLS, but must set a safe search path, be non-user-controlled, expose minimal arguments, and be covered by positive and negative tests.

## Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Self safe fields; authorized directory fields only | Trusted profile-creation path | Self safe fields; trusted status changes | Deny normal clients; controlled privacy workflow |
| `organizations` | Active members; platform policy separately | Onboarding transaction or authorized platform path | Owner/admin with `organizations.manage` | Deny; archive/tombstone workflow |
| `clinics` | Active scoped members | Organization owner/admin with `clinics.create` | Scoped administrator with `clinics.manage` | Deny; archive with `clinics.archive` |
| `locations` | Active scoped members | Scoped administrator with `locations.create` | Scoped administrator with `locations.manage` | Deny; archive with `locations.archive` |
| `organization_memberships` | Safe fields for active authorized members; admins see management fields | Authorized inviter/admin; no self-escalation | Admin with `staff.manage`/`staff.suspend`; target cannot bypass status rules | Deny; revoke |
| `membership_clinic_scopes` | Subject member or authorized staff | Membership administrator; parent checks | Replace through audited management | Authorized scope manager only |
| `membership_location_scopes` | Subject member or authorized staff | Membership administrator; parent checks | Replace through audited management | Authorized scope manager only |
| `roles` | Organization roles for active members; system roles as policy metadata | Custom-role path with `roles.manage`; system platform-only | Owner/admin/custom-role policy | Deny; archive |
| `permissions` | Authenticated catalogue read, excluding sensitive operational details | Platform release path only | Platform release path only | Deny; deprecate |
| `role_permissions` | Authorized role managers | Role manager, with assignable-permission checks | Role manager | Role manager; audit |
| `membership_roles` | Member’s effective assignments; authorized managers see organization assignments | Role manager, cannot grant beyond authority | Role manager | Role manager; revoke |
| `invitations` | Invitee safe own records; authorized staff safe org records | Authorized staff with `staff.invite` | Authorized staff revoke/resend; acceptance trusted path | Deny normal clients; revoke/expire |
| `audit_events` | `audit.read` within tenant; platform policy separately | Trusted append path only | Deny except controlled redaction | Deny except controlled retention |

## Recursive-policy avoidance

Policies must not query a table whose policy recursively depends on the first table. Prefer narrowly scoped security-definer functions such as `has_active_membership(uid, organization_id)` and `has_permission(uid, organization_id, permission_key)`, with fixed `search_path`, no dynamic SQL, and ownership protected from ordinary roles. Functions must return booleans or small safe projections, not arbitrary rows.

## Service role

Supabase service-role access bypasses RLS and is never available to browser code. Future server-only usage must be isolated, audited, narrowly scoped, secret-managed, and unavailable to user-controlled route parameters without independent authorization. A service role is not a replacement for application authorization.

## Test requirements

Before executable policies are approved, tests must cover cross-organization reads/writes, suspended and revoked memberships, empty versus restricted scopes, archived parents, role changes, invitation ownership, audit immutability, service-role boundaries, and anonymous access. Tests must use synthetic local fixtures only.
