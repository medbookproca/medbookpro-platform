# Release Candidate checklists

## Go / No-Go record

| Decision                 | Owner | Evidence | Status  |
| ------------------------ | ----- | -------- | ------- |
| Security sign-off        |       |          | Pending |
| Backup/restore evidence  |       |          | Pending |
| Accessibility acceptance |       |          | Pending |
| Pilot acceptance         |       |          | Pending |
| Rollback readiness       |       |          | Pending |

## Known issues register

| Issue                                  | Impact                   | Mitigation                                        | Owner | Decision                     |
| -------------------------------------- | ------------------------ | ------------------------------------------------- | ----- | ---------------------------- |
| External monitoring not enabled        | Alerting is manual       | Use health checks and maintenance contacts        |       | Accepted for pilot / Blocked |
| Manual accessibility audit outstanding | WCAG evidence incomplete | Complete route-by-route assistive technology pass |       | Accepted for pilot / Blocked |
| Provider recovery evidence outstanding | RPO/RTO unknown          | Complete restore rehearsal                        |       | Accepted for pilot / Blocked |

## Operational risks register

| Risk                             | Likelihood | Impact | Control                                       |
| -------------------------------- | ---------- | ------ | --------------------------------------------- |
| Misconfigured environment        | Medium     | High   | Preflight checklist and readiness endpoint    |
| Incorrect access assignment      | Medium     | High   | Least privilege, RLS tests, access review     |
| Recovery slower than expected    | Medium     | High   | Restore rehearsal and named recovery owner    |
| Unreported accessibility barrier | Medium     | Medium | Keyboard and screen-reader acceptance testing |
