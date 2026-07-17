# ADR 0001: Organization as primary tenant and location as site

- Status: Accepted for specification
- Date: 2026-07-16

## Context
MedBookPro serves multiple healthcare operating entities while preserving organization and location boundaries. The existing schema also contains a `clinics` grouping table.

## Decision
Use Organization as the primary tenant boundary. A Location is a physical or virtual site owned by exactly one Organization in v1. Retain the existing Clinic table only as a compatibility operating-group aggregate until a separate product and migration decision is approved; Clinic must not become a second tenant boundary or a synonym for Location.

## Consequences
Resource ownership is explicit and supports scoped access and future reporting. Cross-organization relationships and enterprise parent organizations require separate reviewed designs. New product contracts should use Organization and Location terminology.

## Alternatives considered
- A flat clinic tenant: rejected because it cannot express customer ownership cleanly.
- Organization and location only immediately: deferred because the current identity schema contains a clinic grouping layer that requires compatibility planning.
