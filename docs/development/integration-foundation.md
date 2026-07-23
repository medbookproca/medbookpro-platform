# Integration Foundation

## Architecture

The integration layer contains a global provider catalogue plus organization-scoped connections, credential placeholders, webhooks, events, jobs, logs, API clients, API-key metadata, and OAuth placeholders. Security-definer RPCs resolve the active organization from the authenticated membership and re-check the required permission.

## API keys and webhooks

API keys store names, permission arrays, lifecycle state, rotation metadata, last-use metadata, and a non-secret prefix placeholder. No raw key or secret is generated. Webhooks store direction, endpoint and signature placeholders, payload metadata, delivery attempts, retry count, and status.

## Jobs and security

Integration jobs support queued, processing, completed, failed, and cancelled states with retry metadata. Direct client writes are denied by RLS. Organization isolation is enforced by composite foreign keys and permission policies; every key, connection, webhook, and job lifecycle mutation emits an audit event.

## Future scope, limitations, and rollback

FHIR, HL7, payment gateways, calendar sync, laboratories, imaging/PACS, OAuth, provider webhooks, and public API delivery remain future work. No provider credentials, live requests, production webhooks, or external services are used. Rollback removes this migration, routes, schemas, tests, and docs without changing clinical, billing, communications, document, telehealth, or portal foundations.
