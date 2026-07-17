# Tenancy model

## Hierarchy

```text
Organization
└── Clinic
    └── Location
```

An **organization** is the legal or commercial customer account. A **clinic** is an operating clinic owned or managed by one organization. A **location** is a physical or virtual service location belonging to one clinic. A **user** is a Supabase Auth identity. A **profile** is the one-to-one application record for that identity. A **membership** grants a profile access to one organization and may carry clinic or location restrictions.

Organizations own clinics; clinics own locations. A child cannot be active unless its parent is active. Soft deletion and archival preserve references and audit history while preventing new access.

## Membership and scope

Membership is organization-wide by default only when it has no scope rows at all. Scope is restrictive, never additive:

- No clinic scope and no location scope: all active clinics and locations in the organization.
- One or more clinic scope rows and no location scope: only the listed active clinics and their locations.
- One or more location scope rows: only the listed locations, and each location must belong to an allowed clinic if clinic scope rows also exist.
- Scope rows referencing archived, deleted, or unrelated resources do not grant access.
- A location scope never expands access outside its parent clinic.

This explicit interpretation avoids treating an empty scope set and a partially configured scope as equivalent. Future migrations should reject orphaned scope rows and conflicting parentage.

## Lifecycle states

Organizations, clinics, and locations should have an explicit lifecycle such as `active`, `archived`, and `deleted`/tombstoned. Memberships use `invited`, `active`, `suspended`, and `revoked`. Archived resources are readable only where policy explicitly permits historical reporting and never grant new operational access.

## Platform administrators

Platform administrators are not clinic roles. A future platform authorization boundary must be separate from tenant membership, use tightly controlled assignments, default deny, and produce audit events. A platform administrator must not automatically receive organization data through ordinary browser policies; any elevated support access requires an approved, time-bounded mechanism that remains unresolved in [open-decisions.md](open-decisions.md).

## Tenant resolution

The server resolves `auth.uid()` to a profile, then verifies an active membership and its resource scope for every organization-owned operation. Browser-selected organization, clinic, and location identifiers are context hints only and never authorization evidence.
