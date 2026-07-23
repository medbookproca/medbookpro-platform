# Patient Portal Reconciliation

The patient portal is a separate access boundary from the staff application. A portal account maps one authenticated user to one patient and organization through `patient_portal_accounts`; it does not grant staff membership or organization-context access.

## Existing foundations reused

- `patients` remains the canonical patient record.
- `patient_consents` remains the canonical consent history.
- `patient_notification_preferences` remains the canonical communication-preference record.
- Existing appointment, billing, communications, and audit tables remain authoritative.

The portal adds only account/session/settings/event records needed for the portal boundary. It uses `patient_update_preferences` rather than the existing staff `update_preferences` function to avoid changing the established communications contract.

## Security boundary

Portal RPCs resolve the patient and organization from the active account linked to `auth.uid()`. Client-provided organization or patient identifiers are never trusted for access. New portal tables have restrictive RLS policies; writes are performed only through security-definer RPCs with ownership checks.

## Deferred work

External identity providers, password flows, family access, mobile clients, document upload, push notifications, telehealth, AI, and payment providers are intentionally outside this foundation. Production authentication and account provisioning require a separately reviewed design.
