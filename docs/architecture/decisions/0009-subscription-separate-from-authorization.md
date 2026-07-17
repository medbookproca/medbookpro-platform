# ADR 0009: Subscription ownership separate from authorization

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Billing plans and provider customer IDs describe commercial entitlements, not whether a user may access a tenant or location.

## Decision

Subscription accounts own plans, trials, statuses, limits, and entitlements. Memberships, roles, permissions, and RLS own application authorization. Provider IDs are opaque references and never serve as tenant keys.

## Consequences

Billing suspension can be represented without deleting healthcare records or confusing payment state with access identity. Enterprise multi-organization billing remains an extension point.

## Alternatives considered

- Provider customer ID as tenant ID: rejected because provider identity is external and commercial.
- Plan name directly in RLS: rejected because entitlement and authorization have different lifecycles.
