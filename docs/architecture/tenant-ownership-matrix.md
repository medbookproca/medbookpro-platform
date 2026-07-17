# Tenant Ownership Matrix

This matrix is the design target for future domain migrations. It does not change the current database.

| Entity | Primary tenant owner | Required `organization_id` | Optional `location_id` | User-scoped | RLS boundary | Deletion strategy | Audit requirement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth user | Supabase Auth | No | No | Yes | Auth/session boundary | Auth-provider lifecycle | Login/security events; never credentials |
| Profile | Profile/user | No | No | Yes | Self or controlled profile access | Deactivate/archive | Profile changes |
| Organization | Organization | Yes, self | No | No | Active membership + permission | Archive/suspend | All lifecycle and ownership changes |
| Clinic compatibility group | Organization | Yes | No | No | Organization + compatibility scope | Archive | Group/location changes |
| Location | Organization | Yes | No | No | Organization + location access | Archive | Operational and access changes |
| Membership | Organization | Yes | No | Via profile | Active membership status | Lifecycle status; retain history | Invite, activate, suspend, revoke, leave |
| Membership location access | Organization | Yes | Yes | Via membership | Membership + explicit scope | Revoke/expire | Every grant, change, and revocation |
| Role | Organization or global catalog | For custom roles | Future location scope | No | Membership permission evaluation | Archive/version | Role creation, change, assignment |
| Permission | Global catalog | No | No | No | Reference data; grants are evaluated in tenant context | Deprecate | Permission catalog changes |
| Role permission | Role owner | Through role | Through future role scope | No | Role and organization boundary | Remove with audit | Permission grant/removal |
| Membership role | Organization | Yes | Future optional scope | Via membership | Active membership + role validity | Revoke/expire | Assignment, expiry, removal |
| Practitioner | Organization | Yes | No | Optional Auth link | Organization + permission | Deactivate/archive | Profile/access/credential changes |
| Practitioner location | Organization | Yes | Yes | Via practitioner | Organization + location | End-date/archive | Association and scheduling changes |
| Patient | Organization | Yes | No | No | Organization + permission/location context | Archive/anonymize under policy | Access, correction, export, merge |
| Patient identifier | Organization via patient | Yes | No | No | Patient organization boundary | Retention/anonymize | Identifier changes and merge |
| Patient contact | Organization via patient | Yes | No | No | Patient organization boundary | Retention/anonymize | Contact/consent changes |
| Service | Organization | Yes | No | No | Organization + permission | Deactivate/archive | Service contract changes |
| Location service | Organization | Yes | Yes | No | Organization + location scope | Deactivate/archive | Availability/price changes |
| Practitioner service | Organization | Yes | Optional | Via practitioner | Organization + practitioner/location scope | End-date/archive | Eligibility changes |
| Appointment | Organization | Yes | Yes | No | Organization + location + permission | Preserve; status/amendment | Create, change, cancel, access, export |
| Subscription account | Commercial account | Yes in v1 | No | No | Billing-admin boundary, never auth grant | Preserve billing history | Plan, status, entitlement changes |
| Trial | Subscription account | Via account | No | No | Billing boundary | Preserve history | Start, extend, end |
| Entitlement | Subscription account | Via account | No | No | Server-side entitlement evaluation | Expire/version | Limit and plan changes |
| Invitation | Organization | Yes | Future optional | Target email/profile | Staff permission + invite lifecycle | Expire/revoke; retain history | Issue, resend, accept, revoke |
| Audit event | Organization when tenant action | Nullable for global/security event | Optional | Actor reference | Read by audit permission; append service | Retention/legal hold | Append-only for sensitive actions |

## Interpretation rules

1. A nullable `location_id` does not mean cross-tenant access; it means the action is organization-wide or has no site context.
2. A user can be associated with multiple organizations only through separate memberships.
3. Patient ownership never follows the practitioner or the appointment location.
4. Subscription ownership controls entitlements and billing workflows, not RLS access.
5. Existing tables that lack direct organization ownership require a reviewed migration or a documented, short ownership path before sensitive data is added.
