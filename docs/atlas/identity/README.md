# Multi-tenant identity foundation

This specification separates Supabase Auth identities from MedBookPro application profiles and models access through organization memberships, scoped resources, roles, permissions, invitations, and append-oriented audit events.

## Scope

Included: organizations, clinics, locations, staff access, role and permission resolution, invitations, audit boundaries, and future RLS policy design.

Excluded: patient and clinical records, appointments, billing, communications, automation, email delivery, authentication UI, executable migrations, and production configuration.

## Core invariants

1. A user can belong to many organizations and have different roles in each.
2. No authorization decision relies on a global role column on `profiles`.
3. Organization, clinic, and location access is denied by default and enforced in the database.
4. Suspended, revoked, expired, or otherwise inactive access cannot authorize requests.
5. Supabase Auth owns credentials and sessions; MedBookPro owns application membership and authorization.
6. UUIDs identify records; timestamps are UTC `timestamptz` values.

The proposed schema remains subject to the open decisions in [open-decisions.md](open-decisions.md).
