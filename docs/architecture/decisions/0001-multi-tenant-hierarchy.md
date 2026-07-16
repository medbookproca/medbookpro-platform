# ADR 0001: Multi-tenant hierarchy

- Status: Accepted for specification
- Date: 2026-07-16

## Context
MedBookPro serves multiple clinic customers while preserving organization, clinic, and location boundaries.

## Decision
Use `Organization → Clinic → Location` as the primary tenancy hierarchy. Organizations own clinics; clinics own locations.

## Consequences
Resource ownership is explicit and supports scoped access and future reporting. Cross-organization relationships require a separate reviewed design.

## Alternatives considered
- A flat clinic tenant: rejected because it cannot express customer ownership cleanly.
- Organization and location only: rejected because clinic-level administration and scope would be ambiguous.
