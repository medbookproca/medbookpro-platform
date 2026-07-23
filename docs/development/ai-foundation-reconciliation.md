# AI Foundation Reconciliation

The AI foundation is an organization-aware application boundary only. It does not call a model, store provider credentials, or make clinical decisions.

## Existing domains

- Patients and encounters remain the source of truth for clinical context. AI request references are nullable and tenant-scoped.
- SOAP notes, care plans, diagnoses, procedures, documents, referrals, and patient education are represented as future request types, not generated records.
- Telehealth, communications, billing, reporting, and integrations remain separate domains. AI events may be linked later through reviewed domain workflows.
- The patient portal has no AI permissions or routes. Patient-facing assistance requires a separate reviewed product decision.
- Future mobile clients must use the same RPC and permission boundaries; they do not receive provider secrets.

## Safety boundary

Requests and responses are placeholders with human-review fields, disclaimers, blocked states, and audit events. No autonomous diagnosis, prescribing, treatment recommendation, chart mutation, or patient communication is implemented. Production PHI must not be used in local development.
