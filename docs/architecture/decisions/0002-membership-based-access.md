# ADR 0002: Membership-based access

- Status: Accepted for specification
- Date: 2026-07-16

## Context
Users may work for multiple organizations and need different roles and scopes in each.

## Decision
Represent access through organization memberships, explicit organization-wide or selected location access, and membership role assignments. Existing clinic/location scope rows remain compatibility structures until a reviewed migration establishes explicit access mode semantics. Profiles do not contain a global role.

## Consequences
Authorization is expressive and tenant-specific. Queries and RLS checks must consistently validate membership status, organization ownership, permission, and subordinate location scope. Missing permission denies access.

## Alternatives considered
- One global profile role: rejected because it cannot support multi-organization access.
- Organization ID on the profile: rejected because it permits only one active tenant relationship.
