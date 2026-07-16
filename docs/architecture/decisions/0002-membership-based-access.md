# ADR 0002: Membership-based access

- Status: Accepted for specification
- Date: 2026-07-16

## Context
Users may work for multiple organizations and need different roles and scopes in each.

## Decision
Represent access through organization memberships, optional clinic/location scope rows, and membership role assignments. Profiles do not contain a global role.

## Consequences
Authorization is expressive and tenant-specific. Queries and RLS checks must consistently validate membership status and scope.

## Alternatives considered
- One global profile role: rejected because it cannot support multi-organization access.
- Organization ID on the profile: rejected because it permits only one active tenant relationship.
