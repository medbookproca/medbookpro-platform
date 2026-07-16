# Identity implementation status

## Implemented locally

- The 13 approved identity-domain tables.
- UUID keys, UTC `timestamptz` values, status checks, restrictive foreign keys, indexes, and updated-at triggers.
- Idempotent Auth-to-profile creation trigger without organization auto-creation.
- Active membership, organization, clinic, location, and permission helper functions.
- Default-deny RLS policies for select, insert, update, and delete behavior.
- Local permission catalogue and centrally managed system role templates.
- Invitation storage with normalized email, expiry, state, scoped access JSON, and token digest only.
- Append-oriented audit event storage and trusted server append function.
- Synthetic local pgTAP-style RLS tests.

## Not implemented

- Hosted Supabase linking or deployment.
- Authentication UI or frontend integration.
- Invitation email delivery or acceptance API.
- Platform break-glass access, custom-role commercial availability, or external audit immutability.
- Patient, appointment, clinical, billing, CRM, communication, and AI tables.

## Type generation

Generated TypeScript types are not committed yet. The local database must first be started and migrations applied. When local CLI support is available, generate types with:

```sh
supabase gen types typescript --local > packages/database/src/database.types.ts
```

The output must be generated from the local database only and must not be hand-edited. If the local CLI cannot complete this command, document the blocker rather than fabricating types.
