# Launch readiness

Phase 3C operational guide for a controlled pilot. This repository does not deploy, provision infrastructure, or manage hosted secrets.

## Deployment process

1. Confirm the release commit, version metadata, CI checks, database tests, and Playwright checks are green.
2. Review the environment and secret checklist with the release owner.
3. Apply the approved deployment through the organization’s authorized hosting process.
4. Run `/health`, `/ready`, `/version`, and `/diagnostics` smoke checks without recording response secrets.
5. Run the pilot acceptance checklist with a synthetic or approved test account only.
6. Record evidence, owner, timestamp, and decision in the release record.

## Operations

Use `/health` for liveness, `/ready` for required public configuration readiness, `/version` for release identity, and `/diagnostics` for a safe request correlation ID and timing investigation. Never publish environment values, tokens, cookies, patient data, or full request payloads in support tickets.

## Environment validation checklist

- [ ] Node and pnpm versions match repository requirements.
- [ ] `NEXT_PUBLIC_APP_URL` uses the approved HTTPS origin.
- [ ] Public Supabase values point to the approved environment.
- [ ] Service-role keys, if required by a future trusted server job, are absent from browser bundles.
- [ ] Redirect URLs, cookie domain, email settings, and certificate status are verified.
- [ ] No production data is copied into local or test environments.

## Production configuration and secret management

Use the hosting provider’s encrypted secret store and least-privilege access groups. Public `NEXT_PUBLIC_*` values are intentionally browser-visible; all other values are server-only by default. Rotate keys through the provider’s documented process, record the rotation owner, and do not place values in GitHub issues, logs, screenshots, or `.env` files committed to the repository. See [environment variables](environment-variables.md).

## Certificate management

The hosting owner must verify certificate issuance, renewal, HTTPS-only redirects, and the canonical hostname before pilot traffic. Renewals must be observable, tested in a non-production environment where possible, and included in the rollback plan. This repository does not provision or rotate certificates.

## Backup and recovery

See [backup and restore](launch-readiness-backup-restore.md). Production recovery evidence must come from the hosted Supabase project owner; local database reset proves schema reproducibility, not production restore capability.

## Support and incident response

Start with [administrator guide](launch-readiness-administrator-guide.md), [clinic onboarding](launch-readiness-onboarding.md), and [support escalation](launch-readiness-support.md). For a suspected privacy or security incident, stop reproduction with real data, preserve timestamps and correlation IDs, restrict access to the incident record, and escalate to the named privacy/security owner.

## Release Candidate checklist

- [ ] Required CI checks are green on the immutable release commit.
- [ ] Database reset and tests pass from a clean checkout.
- [ ] Browser smoke tests pass with no external APIs.
- [ ] Version and commit metadata identify the candidate.
- [ ] Security sign-off is complete.
- [ ] Backup and restore evidence is attached.
- [ ] Accessibility findings have owners and accepted risks.
- [ ] Pilot owner, support owner, and rollback owner are named.

## Pilot clinic acceptance

- [ ] Clinic confirms organization, location, staff, practitioner, and patient workflows needed for the pilot.
- [ ] Staff can navigate with keyboard and receive visible focus.
- [ ] Access boundaries are tested with approved non-production accounts.
- [ ] Support contact and maintenance window are known.
- [ ] No real patient data is used for acceptance unless separately approved and governed.

## Go / No-Go

**Go** requires all mandatory checklist items, evidence links, named owners, and an approved rollback path. **No-Go** applies to unresolved tenant isolation, credential exposure, failed recovery evidence, failed smoke tests, inaccessible critical workflows, unknown release identity, or missing incident ownership.

## Rollback

Stop the rollout, preserve the release identifier and correlation IDs, revert through the approved hosting mechanism to the last known-good immutable release, and verify health/readiness/version. Do not roll back database changes by deleting data; use a reviewed forward migration or provider recovery procedure. Record customer impact and follow-up actions.

## Known issues and operational risks

- External monitoring and alert delivery are not enabled.
- Backup retention, restore timing, and point-in-time recovery depend on the hosted provider plan and must be verified.
- Manual accessibility and assistive-technology testing remains outstanding.
- Clinic-specific privacy agreements, retention schedules, and support SLAs remain to be approved.
- No production deployment was performed by this phase.
