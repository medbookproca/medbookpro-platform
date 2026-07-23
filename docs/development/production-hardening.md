# Production Hardening

## Security architecture

The platform uses organization-scoped records, composite organization foreign keys, allow-based permissions, fixed `search_path` security-definer RPCs, and deny-by-default direct writes where mutations require workflow checks. Browser code receives only publishable Supabase configuration; service-role access is reserved for trusted server environments.

## RLS and audit

Pilot-domain tables enable RLS. Staff access is bounded by active organization membership, role permissions, and clinic/location scopes. Patient portal helpers are separate from staff access. Audit events capture sensitive workflow actions and are append-only at the database trigger layer; audit metadata must never contain secrets or full clinical records.

## Performance

Indexes added in the hardening migration target organization plus time/status access for patients, appointments, notifications, invoices, documents, telehealth, integrations, and AI. Future production load testing must use synthetic data and inspect `EXPLAIN (ANALYZE, BUFFERS)` in a representative environment. No production query plans were collected.

## Compliance readiness

The foundation supports PIPEDA-oriented accountability, minimum-necessary organization access, consent records, retention metadata, access logging, and privacy boundaries. HIPAA-oriented safeguards are treated as an additional control baseline where applicable. No legal or regulatory certification is claimed.

## Backup and restore

Before pilot launch, establish encrypted, tested Supabase backups, documented recovery-point and recovery-time objectives, restricted restore access, and a quarterly restore rehearsal. Production data must never be copied into local development.

## Monitoring plan

The health endpoint remains safe and non-sensitive. Application code now has a redacting structured diagnostic hook for future metrics, tracing, Sentry, or OpenTelemetry adapters. No external monitoring service is enabled.

## Incident response

Triage, contain, preserve audit evidence, assess affected organizations, notify responsible Canadian privacy stakeholders, rotate compromised credentials, and document corrective action. The incident playbook must be reviewed before pilot launch.

## Known risks, rollback

Known risks include unmeasured production workload, untested restore procedures, provider-specific privacy review, retention policy execution, and incomplete operational alerting. The hardening migration is additive and can be rolled back only through a reviewed forward migration; do not rewrite migrations already shared.
