# Communications Foundation

## Scope

The foundation provides notification templates, a queue, mock deliveries, notification events, organization defaults, and patient notification preferences. It is an operational boundary for future reminders and transactional communications, not a live messaging service.

## Lifecycle

`pending` and `retrying` records may be queued. A mock send moves a record through `processing` to `sent` and creates a delivery and event. Failed or expired records can be retried; pending work can be cancelled. The database RPCs own these transitions so tenant and permission checks are transactional.

## Templates and providers

Templates contain a key, channel, subject, body, variable metadata, language, status, and monotonically increasing versions. The TypeScript provider interface currently exposes only a local mock provider. No network call is made. Future providers must be selected by reviewed configuration and must not receive more data than the message requires.

## Preferences and settings

Contact addresses remain in `patient_contacts`. Notification preferences are separate because channel enablement, reminder consent, marketing consent, language, and quiet-hour rules have different lifecycle and audit needs. Organization settings currently store reminder timing, sender and timezone placeholders; branding is metadata only.

## Security and privacy

Every communications table carries an organization boundary. Direct writes are denied by RLS. RPCs use `auth.uid()`, permission checks, composite foreign keys, and `audit_events`. Queue destinations are sensitive personal data and must not be included in logs or copied into client telemetry. Production data must never be used for local testing.

## Future work and rollback

Live email/SMS, push, WhatsApp, portal messaging, automation, consent policy enforcement, quiet-hour evaluation, provider webhooks, and delivery reconciliation remain out of scope. Shared migrations are immutable; rollback is a reviewed forward migration or controlled environment restore, not editing this migration in place.
