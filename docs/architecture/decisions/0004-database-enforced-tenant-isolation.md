# ADR 0004: Database-enforced tenant isolation

- Status: Accepted for specification
- Date: 2026-07-16

## Context
Browser context and application code can be bypassed or become stale; tenant isolation needs a final enforcement layer.

## Decision
Enforce organization, clinic, and location access through PostgreSQL Row Level Security, with carefully secured helper functions where needed to avoid recursive policies.

## Consequences
Cross-tenant reads and writes remain denied even when application checks fail. Policy design, helper security, and synthetic isolation tests become release requirements.

## Alternatives considered
- Application-only authorization: rejected as insufficient defense in depth.
- Service-role access from the browser: rejected because it bypasses RLS.
