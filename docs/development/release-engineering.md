# Release Engineering

## Observability

`/health` is a safe liveness response. `/ready` validates required public configuration without contacting a hosted service. `/diagnostics` returns only safe release and correlation metadata. `/version` exposes version, commit, and build timestamp metadata. Middleware adds a bounded `x-request-id` and `server-timing` response header. Structured diagnostic logging redacts fields whose names indicate secrets, tokens, credentials, cookies, email, or phone data.

No external monitoring, Sentry, OpenTelemetry collector, metrics exporter, or cloud service is enabled.

## Versioning and release metadata

The private workspace uses a semantic root version in `package.json`. `pnpm release:metadata` prints version, commit, and build timestamp metadata. `pnpm release:check` validates semantic-version shape. CI supplies commit and build timestamp values without committing generated secrets or files.

## CI gates

Pull requests and pushes to `main` run frozen dependency installation, lint, strict typecheck, unit tests, release metadata validation, and build. A separate database job resets the local Supabase schema and runs all pgTAP tests. A dependent browser job installs Chromium and runs Playwright; reports upload only when that job fails and are retained for 14 days.

## Release checklist

- Review the PR and all CI jobs.
- Confirm `pnpm install --frozen-lockfile`, lint, typecheck, tests, build, Playwright, database reset, and pgTAP pass.
- Review migration ordering and generated database types.
- Confirm release metadata, security review, privacy review, backup status, and restore rehearsal.
- Confirm no credentials, patient data, or hosted-infrastructure changes are in the diff.
- Record approvers, release version, commit, migration status, and rollback owner.

## Rollback checklist

Stop promotion, identify the last known-good commit, preserve audit and CI evidence, and revert through a reviewed PR. Database changes require a forward-compatible rollback migration or restore plan; never rewrite an applied migration. Disable a faulty feature through reviewed configuration only when that flag exists, and escalate privacy or clinical-impact incidents through the incident response process.

## Performance review

Pilot-facing indexes cover common organization/time/status access paths. Server components remain the default for authenticated data reads, and no new client bundle or provider SDK was added. Representative synthetic load tests and `EXPLAIN (ANALYZE, BUFFERS)` review remain pre-launch gates.
