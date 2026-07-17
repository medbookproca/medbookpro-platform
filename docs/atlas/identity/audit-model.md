# Audit model

`audit_events` is append-oriented evidence for security-sensitive and business-significant activity. It is not a clinical record, event-sourced domain model, or general application log.

## Event envelope

Each event should include a UUID, UTC occurrence time, action key, outcome, security-event classification, actor profile when known, acting organization, optional clinic/location context, entity type and UUID, request/correlation ID, and minimized metadata. Before/after metadata is limited to safe field changes and must not contain secrets, access tokens, passwords, full clinical records, or unnecessary personal data.

IP addresses and user agents are sensitive operational metadata. The future retention and truncation strategy must be approved before implementation; storage should be limited to what is needed for abuse response and security investigation. A proxy-aware server should provide the canonical request context rather than trusting browser headers.

## Integrity and access

Normal browser clients cannot update or delete events. A trusted server or hardened security-definer function appends events after validating actor and tenant context. Readers require `audit.read` within the same organization or a separate platform authority. Redaction, if legally required, must preserve event identity, reason, actor, and an audit trail of the redaction.

## Retention

Retention is a placeholder until Canadian governance, contractual requirements, and product needs are resolved. Any purge must be a controlled, scheduled operation with dry-run capability and audit evidence. Future consideration may include immutable external storage, which is listed as an open decision.
