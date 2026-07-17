# Core Domain Reconciliation Report

This report compares the Phase 2A model with the identity database already committed in `supabase/migrations`. No migration or RLS policy is changed by this report.

## Already aligned

- Supabase Auth identity is separate from `public.profiles`.
- Organizations are the top-level ownership anchor for the current identity schema.
- A profile can hold memberships in multiple organizations.
- Membership status is relational and organization-specific.
- Roles, permissions, role-permission grants, and membership-role assignments are separate entities.
- Permission keys use an allow-based `domain.action` convention.
- Organizations, clinics, locations, memberships, invitations, and audit events have direct organization context where applicable.
- RLS is enabled on the existing identity tables.
- Security helper functions centralize active profile, membership, scope, and permission checks.
- Audit events prohibit ordinary authenticated inserts, updates, and deletes and provide an append helper for trusted service access.
- Existing Auth integration uses cookie SSR clients, callback exchange, verified claims, and a protected route.

## Documentation gap only

- Existing ADRs describe the identity hierarchy but do not define the full organization/location terminology for patient, practitioner, service, appointment, and billing domains.
- Existing audit documentation does not enumerate patient access, exports, appointment changes, or support access as required future categories.
- Existing identity docs do not define subscription ownership, entitlement boundaries, healthcare retention, patient merge history, or UTC appointment rules.
- Existing environment/database client documentation still references the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `packages/database`, while the web Auth integration uses the publishable key convention.

## Future migration needed

- Add core organization fields: display name, currency, locale, business identifiers, branding, onboarding state, and subscription relationship.
- Add or normalize location kind, code, booking visibility, phone/email, and branding overrides.
- Add explicit membership lifecycle values for deactivated/left and explicit organization-wide versus selected location access.
- Add practitioner, practitioner-location, patient, patient identifier/contact, service, location-service, practitioner-service, and appointment tables.
- Add subscription account, trial, entitlement, and future commercial relationship tables.
- Expand audit subject/source/correlation semantics where the current columns are insufficient.
- Add synthetic cross-tenant RLS tests for every new domain table.

## Potential architectural conflicts

### Existing `clinics` layer versus canonical location terminology

The current database models `organizations → clinics → locations`, while this specification uses organization for the tenant and location for the site. The `clinics` table may be a useful operating-group aggregate, but it must not become a second tenant boundary or be exposed as an ambiguous synonym. A future rename/removal decision requires migration planning and product review.

### Implicit all-location access

Current RLS interprets no location-scope rows as organization-wide access, and clinic scope rows can broaden access. This is functional but not as explicit or auditable as the target model. Future implementation should introduce explicit access-mode semantics without breaking current owners.

### Location-scoped roles

Current membership roles are organization-level. The target model reserves location-scoped role assignments. Adding them requires precedence and inheritance decisions before migration.

### Database client key naming

The web Auth integration uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the existing shared database package still validates `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This is a configuration/API consistency issue, not a reason to reintroduce the legacy key into browser Auth code.

## Product decision required

- Whether `clinics` remains a first-class operating-group concept or is deprecated in favor of organization/location only.
- Whether an organization may be created without a location in the onboarding product experience.
- Whether organization-wide access is represented by an explicit mode, an all-location grant, or both.
- Whether enterprise billing may cover multiple organizations in the first commercial model.
- What patient number and duplicate/merge policy is approved for Canada-first operations.
