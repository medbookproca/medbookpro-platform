# Production Hardening Reconciliation

Phase 3A reviews the existing foundation without adding business features or enabling production integrations.

| Module                 | Review result                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Organizations and RBAC | Organization context is derived from active membership and permission helpers; custom-role writes remain permission-bound. |
| Patients               | Patient rows are organization-scoped with composite organization foreign keys and RLS; portal access is a separate path.   |
| Appointments           | Organization, patient, practitioner, and schedule indexes support common reads; mutations remain RPC-bound.                |
| Clinical               | Encounters and clinical artifacts use organization-scoped composite references and status transitions.                     |
| Communications         | Queue and preference records remain organization-scoped; delivery providers are placeholders.                              |
| Billing                | Invoice/payment records remain organization-scoped; payment provider code is mock-only.                                    |
| Documents              | Document access and retention metadata remain separate from content storage; no production files are used locally.         |
| Telehealth             | Sessions and events are organization-scoped; no live telehealth provider is enabled.                                       |
| Integrations           | Connections, jobs, webhooks, and keys use placeholder boundaries; no credential is provisioned.                            |
| AI                     | Requests require human review; no provider call or autonomous clinical action exists.                                      |
| Patient portal         | Portal helpers are distinct from staff permissions and do not expose staff-only AI or operational data.                    |
| Reporting              | Reporting RPCs require organization permission and use bounded date ranges.                                                |

## Review findings

- All 174 public security-definer functions in the local schema define a fixed `search_path`.
- Domain tables reviewed for the pilot all have RLS enabled and direct writes are either permission-bound or denied.
- Audit history now has database-enforced append-only behavior, including privileged local roles.
- Targeted indexes cover organization/time or organization/status access patterns for high-volume pilot tables.
- No hosted Supabase project, production secret, external provider, or deployment configuration was changed.

Known limitations remain documented in `production-hardening.md`; this is readiness work, not a legal certification or production launch approval.
