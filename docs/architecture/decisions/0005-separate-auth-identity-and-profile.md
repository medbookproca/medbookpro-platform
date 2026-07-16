# ADR 0005: Separate Auth identity and profile

- Status: Accepted for specification
- Date: 2026-07-16

## Context
Supabase Auth owns credential and session concerns, while MedBookPro needs application-specific profile and access data.

## Decision
Keep Auth identity and secrets in `auth.users`; link one application `profiles` row by UUID. Store memberships, roles, scopes, and application lifecycle state outside Auth.

## Consequences
Credential handling remains delegated to Auth and application authorization remains explicit. Lifecycle callbacks and profile cleanup must be idempotent and reviewed.

## Alternatives considered
- Duplicate credentials in application tables: rejected as unsafe and unnecessary.
- Store all application access in Auth metadata: rejected because it is not a suitable relational authorization boundary.
