# Backup and restore runbook

This runbook describes evidence required from the authorized hosted Supabase operator. It does not connect to or modify a hosted project.

## Backup verification

- [ ] Confirm automated backup cadence, retention, encryption, region, and access ownership.
- [ ] Confirm point-in-time recovery availability, retention window, and recovery granularity.
- [ ] Confirm backup completion alerts and the last successful backup timestamp.
- [ ] Verify that backups contain the required schema and tenant data without exporting them into developer workstations.
- [ ] Record provider evidence in the restricted operations record.

## Restore rehearsal

1. Open a change record and name the recovery owner.
2. Restore into an isolated non-production project using provider-approved controls.
3. Validate schema version, RLS, representative synthetic tenant boundaries, application health, and critical read paths.
4. Measure restore duration and identify the recovery point and recovery time achieved.
5. Destroy or retain the rehearsal project according to the approved data handling policy.
6. Record gaps and remediation owners before pilot approval.

## Disaster recovery checklist

- [ ] Recovery owner and alternate are reachable.
- [ ] Provider account access is tested without sharing credentials.
- [ ] Last known-good release commit and environment configuration are identified.
- [ ] RPO and RTO are approved for the pilot.
- [ ] DNS/certificate and application rollback procedures are available.
- [ ] Privacy/security notification paths are known.

Local `supabase db reset` validates committed schema reproducibility only. It is not a backup, restore, or production recovery test.
