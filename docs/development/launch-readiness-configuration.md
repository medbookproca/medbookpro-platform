# Pilot environment configuration

This guide is for the authorized environment owner. Values belong in the hosting provider’s encrypted configuration store, never in Git.

## Configuration checklist

- [ ] `NEXT_PUBLIC_APP_URL` is the approved HTTPS origin.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anonymous key identify the approved environment.
- [ ] No service-role key is present in browser-executed modules or public build output.
- [ ] Redirect URLs, cookie settings, email sender configuration, and allowed origins are reviewed.
- [ ] Node and pnpm runtime versions match `.nvmrc` and `package.json` engines.
- [ ] Feature flags and integration placeholders are explicitly disabled unless approved.
- [ ] Configuration changes have an owner, review record, and rollback value.

## Secret handling

Use individual operator access, least privilege, MFA, audited secret access, and documented rotation. Do not copy secrets into local files from production, paste them into support tickets, or print them in diagnostics. A leaked key is treated as compromised: revoke or rotate it through the provider process, investigate usage, and record the incident.

## Certificates and domains

The deployment owner verifies DNS, certificate issuance and renewal, HTTPS redirects, canonical hostname, and cookie security attributes. Certificate changes are tested before the pilot window and have a named rollback owner. This repository does not provision domains or certificates.
