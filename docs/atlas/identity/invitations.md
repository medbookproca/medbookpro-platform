# Invitations

Invitations are application records; email delivery is deliberately out of scope.

## Creation

An authorized staff member creates an invitation for one organization, optionally with clinic/location scopes and proposed role assignments. The server trims and lower-cases the email for matching, validates parent relationships, limits the number and frequency of invitations, and stores only a cryptographic token hash. The raw acceptance token is delivered by a future trusted channel and is never stored.

There is at most one active invitation for an organization and normalized email. A resend revokes or supersedes the prior invitation and creates an auditable replacement. The expiry is short and explicit; expired invitations cannot be accepted.

## Existing and new users

If the email maps to an existing verified Auth identity, acceptance links the existing profile after reauthentication or a valid session. It does not change the user’s existing organizations or roles. For a new user, the future flow completes Supabase Auth signup and verification before creating or linking a profile. Email existence must not be disclosed through unauthenticated responses.

## Acceptance

Acceptance is a server-side transaction that verifies token hash, status, expiry, intended email, and resource status, then creates or activates the membership and assigns only the approved roles and scopes. Role assignment is not taken from browser input. A user cannot accept an invitation into a suspended or archived organization.

Revocation, expiry, duplicate handling, creation, resend, acceptance, and rejection each emit audit events. The token is single-use; failed attempts are rate-limited and suspicious patterns are monitored. No email provider is selected yet.
