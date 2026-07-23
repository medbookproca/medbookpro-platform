# MedBookPro Master Product Requirements Document

## 1. Document control

| Field                | Value                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Title                | MedBookPro Master Product Requirements Document                                                                    |
| Status               | Authoritative working product source of truth; implementation-aware                                                |
| Version              | 1.0.0-draft                                                                                                        |
| Date                 | 2026-07-22                                                                                                         |
| Product owner        | MedBookPro product leadership                                                                                      |
| Technical owners     | MedBookPro platform and security engineering                                                                       |
| Audience             | Product, engineering, QA, security/privacy, operations, support, implementation, and future contributors           |
| Repository           | `medbookproca/medbookpro-platform`                                                                                 |
| Relationship to ADRs | ADRs govern architectural decisions; this document defines product intent and requirements within those boundaries |
| Change control       | Versioned review is required for material scope, data, authorization, compliance, or lifecycle changes             |

This document is not a legal opinion, security certification, clinical safety certification, or claim that any capability is already implemented. Implemented status is based on the repository at the baseline recorded in the delivery branch. Planned requirements require design, security/privacy review, tests, and approved migrations before release.

## 2. Executive summary

MedBookPro is a Canada-first, multi-tenant clinic operating system for solo practitioners, clinics, allied health, wellness, and multidisciplinary practices. It will provide a secure organization and location foundation, identity and access controls, scheduling, patient and practitioner operations, communications, migration tooling, billing boundaries, reporting, and carefully governed integrations.

The product is intentionally progressive. The current repository implements platform foundations, Supabase Auth boundaries, organization/first-location onboarding, and local database/RLS tests. It does not yet implement practitioner records, patient records, services, appointments, billing, staff invitation workflows, production deployment, or clinical decision support.

The product must make safe tenant isolation, minimum-necessary access, accessibility, auditability, reliable workflows, and Canadian localization defaults structural properties rather than optional features.

## 3. Product vision

Give Canadian clinics a dependable operating system that makes everyday administrative work simpler without compromising patient privacy, practitioner judgment, historical integrity, or tenant boundaries.

MedBookPro should become the system of record for clinic operations while remaining interoperable with external calendars, payment systems, communications providers, accounting tools, and future healthcare ecosystems. It should support a small clinic first and scale to multi-location and larger clinic groups without requiring a second tenancy model.

## 4. Product principles

1. **Patient safety:** Product behavior must avoid creating unsafe clinical assumptions, ambiguous scheduling, or unreviewed clinical automation.
2. **Privacy by design:** Collect, expose, retain, export, and delete only what the use case requires.
3. **Tenant isolation:** Organization ownership, membership, permission, scope, and RLS boundaries are mandatory.
4. **Accessibility:** Target WCAG 2.2 AA, keyboard access, semantic HTML, visible focus, readable error states, and assistive technology support.
5. **Auditability:** Sensitive access, change, export, invitation, integration, and administrative actions need durable, redacted history.
6. **Reliability:** Atomic workflows, idempotency, retries, reconciliation, observability, and recoverability are product requirements.
7. **Interoperability:** Use stable identifiers, explicit mappings, documented APIs, import/export paths, and standards-aware integration boundaries.
8. **Practitioner usability:** Reduce clicks and cognitive load while preserving review and control.
9. **Progressive complexity:** Start with safe defaults and reveal advanced controls when they become necessary.
10. **Canada-first architecture:** English/French readiness, Canadian postal codes, provinces and territories, CAD defaults, Canadian time zones, privacy review, and residency options are first-class concerns.

## 5. Problem statement

Many clinics coordinate identity, locations, availability, intake, patient information, reminders, payments, and external tools across disconnected systems. This creates duplicate entry, inconsistent schedules, weak audit trails, uncertain ownership, difficult migrations, and privacy risk. Smaller practices also face products designed for enterprise complexity, while larger clinic groups need consistent tenancy and access controls.

MedBookPro must unify operational workflows without pretending that all clinics have the same policies, clinical disciplines, jurisdictional obligations, or integration needs.

## 6. Target market

- Solo practitioners needing simple scheduling, communication, and operational organization.
- Small clinics with a small staff and one or a few locations.
- Multi-location clinics needing location-aware access, availability, and reporting.
- Allied health practices such as physiotherapy, counselling, chiropractic, massage, and occupational therapy.
- Wellness clinics with services, memberships, packages, and communications.
- Multidisciplinary practices with different practitioner roles and service rules.
- Future larger clinic groups requiring controlled enterprise administration without collapsing organization boundaries.

The product must not assume that every tenant is a medical clinic, that every practitioner is an employee, or that every patient relationship is identical.

## 7. Personas

| Persona                             | Primary needs                                                         | Guardrails                                                       |
| ----------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Organization owner                  | Organization setup, locations, staff, roles, commercial settings      | Cannot bypass RLS or audit; ownership transfer is controlled     |
| Clinic administrator                | Operational setup, staff coordination, services, reports              | Organization membership and permissions remain authoritative     |
| Location manager                    | Location hours, rooms, local availability, staff coordination         | Restricted to assigned organization/location scope               |
| Receptionist                        | Booking, rescheduling, reminders, front desk, basic demographics      | Minimum necessary patient and billing access                     |
| Practitioner                        | Availability, schedule, service delivery, appropriate patient context | Professional lifecycle is separate from Auth identity            |
| Billing staff                       | Invoices, payments, refunds, reports, reconciliation                  | No unnecessary clinical access                                   |
| Patient                             | Booking, communications, forms, documents, future portal              | Consent, identity verification, and organization ownership apply |
| Implementation/migration specialist | Mapping, preview, import, reconciliation, migration support           | Controlled temporary access and complete audit trail             |
| Support/compliance administrator    | Troubleshooting, audit, privacy operations, account support           | Explicit support access, time limits, reason capture, and audit  |

## 8. Jobs to be done

- Set up a clinic organization and its first operating location safely.
- Invite the right people with the least access needed for their work.
- Maintain accurate practitioner availability and avoid double booking.
- Find the correct patient within the correct organization quickly.
- Book, change, cancel, and communicate appointments with clear history.
- Collect intake information without creating unsafe or unnecessary clinical records.
- Migrate from an existing tool with preview, validation, reconciliation, and rollback planning.
- Understand operational performance without exposing more personal data than necessary.
- Prove who changed or accessed sensitive information.
- Connect external calendars and providers without losing control of credentials or privacy.

## 9. Scope boundaries

### In scope for the long-term product

Organization operations, locations, identity/access, practitioners, patients, services, scheduling, communications, forms, bounded clinical documentation, billing boundaries, reporting, migration, integrations, and governed extensibility.

### Outside the current implementation

The repository does not currently implement practitioners, patients, services, appointments, billing, production deployment, staff invitations, custom roles, MFA, external providers, or AI. This PRD describes future product requirements; it is not evidence that those capabilities exist.

## 10. Current implemented baseline

### Implemented in the repository

- pnpm workspaces, Turborepo, Next.js App Router, React, TypeScript strict mode, Tailwind, ESLint, Prettier, Vitest, Playwright, Zod, Supabase clients, and React Hook Form foundations.
- Supabase Auth browser/server SSR boundary, sign-in, sign-up, password recovery/reset UI, email verification, callback handling, session verification, sign-out, and protected application route.
- Auth identity/profile separation with local identity migrations, roles, permissions, memberships, invitation storage, audit events, helper functions, and RLS tests.
- Organization as primary tenant and location as subordinate site; existing `clinics` remains a compatibility grouping.
- Atomic organization and first-location onboarding through a trusted RPC, idempotency ledger, owner membership, existing owner role assignment, audit events, local migration tests, and onboarding route/form.
- `/app` placeholder context showing the selected organization and first location.
- Documentation and local-only Supabase workflow.

### Planned or not implemented

Staff invitation execution, membership administration UI, explicit location-access target model, practitioners, patients, services, scheduling, calendars, communications providers, billing, files, reporting, public APIs, AI, marketplace, production infrastructure, and legal/compliance certification.

## 11. Core domain terminology

| Term                 | Canonical meaning                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Auth identity        | Credential/session identity owned by Supabase Auth                                              |
| Profile              | Application profile linked to one Auth identity                                                 |
| Organization         | Primary tenant and owner of operational data                                                    |
| Location             | Physical or virtual operating site owned by one organization                                    |
| Clinic               | Existing compatibility/grouping structure; not a second tenant boundary or synonym for location |
| Membership           | A user’s organization relationship and lifecycle state                                          |
| Location access      | Organization-subordinate scope controlling which locations a membership may use                 |
| Role                 | Named collection of allowed permissions assigned to a membership                                |
| Permission           | Canonical `domain.action` capability; missing permission denies                                 |
| Practitioner         | Organization-owned professional profile, optionally linked to Auth                              |
| Patient              | Organization-owned person record; location and practitioner provide context, not ownership      |
| Service              | Organization-owned bookable or operational offering                                             |
| Appointment          | Scheduled interaction with UTC instants and operational timezone context                        |
| Subscription account | Commercial plan/trial/billing boundary separate from authorization                              |
| Audit event          | Append-oriented record of sensitive action, actor, subject, outcome, and redacted metadata      |

## 12. Multi-tenant model

Every tenant-owned resource must carry or resolve an organization owner. A user may hold memberships in multiple organizations. Tenant selection must come from a server/database-authorized membership, not from editable metadata or URL input alone. The organization boundary is enforced in PostgreSQL RLS in addition to application routing.

Cross-organization references require an explicit reviewed product decision. Enterprise parent organizations, shared practitioner networks, and shared patient identities are not implied by this model.

**Requirements:** `MBP-TENANT-001` direct organization ownership is required; `MBP-TENANT-002` cross-tenant reads/writes are denied by RLS; `MBP-TENANT-003` all tenant context is revalidated server-side; `MBP-TENANT-004` one user may belong to multiple organizations.

## 13. Organization and location model

An organization may technically exist without a location, but standard onboarding creates one initial location atomically. A location belongs to exactly one organization. Locations may be physical or virtual and have their own timezone, operational status, address/contact data, hours, resources, and booking rules.

The existing clinic grouping is retained only for compatibility until a reviewed migration establishes a different representation. New product language uses organization and location.

Organization lifecycle must support active, archived, suspended/future administrative states, and retention/legal-hold constraints. Location archival must not destroy appointments, audit history, or required financial/clinical references.

## 14. Identity, membership, role, permission, and access model

Supabase Auth owns credentials and sessions. Profiles, memberships, roles, scopes, invitations, and application lifecycle state remain in application tables. Membership status controls whether organization access is usable. Roles are organization-aware assignments; permissions use `domain.action` keys and allow-based resolution.

The target location model makes organization-wide access explicit and supports selected locations, expiry, grant/revocation actors, and future-location semantics. The merged onboarding implementation retains empty scope as a compatibility representation for owner organization-wide access; Phase 2C must reconcile that behavior before replacing it.

**Requirements:** `MBP-IAM-001` no browser-controlled role or permission is authoritative; `MBP-IAM-002` suspended/revoked memberships lose access; `MBP-IAM-003` role and scope changes are audited; `MBP-IAM-004` service-role access is restricted to trusted server jobs; `MBP-IAM-005` authorization is independent of subscription status.

## 15. Staff invitation and membership management requirements

Phase 2C must provide a safe membership-management workflow without changing the tenant model.

- Authorized managers can invite a user by email, selected organization role, and selected location access.
- The browser never chooses authoritative organization, role, permission, or actor IDs.
- Invitation tokens are single-use, expiring, stored as digests, and never logged or returned after issuance.
- Invitation states include pending, accepted, expired, revoked, and superseded where needed.
- Existing users may accept into a new organization without changing other memberships.
- New users complete Auth onboarding separately; invitation acceptance links identity and membership safely.
- Managers can view, resend, revoke, suspend, reactivate, and revoke memberships subject to permission and last-owner protection.
- Last active owner removal, suspension, or role downgrade must be blocked or require an approved ownership-transfer workflow.
- Role templates are resolved by stable internal keys; custom roles are a later controlled capability.
- Location access must support explicit organization-wide or selected-location modes and future-location behavior.
- All invitation and membership transitions are auditable and idempotent.

Acceptance examples: `MBP-IAM-010` invitation replay cannot create duplicate membership; `MBP-IAM-011` cross-organization invitation access is denied; `MBP-IAM-012` last-owner protection is enforced; `MBP-IAM-013` invite acceptance does not expose tokens or sensitive Auth data.

## 16. Practitioner management requirements

Practitioners are organization-owned professional profiles with optional Auth linkage. A practitioner may work at multiple locations and must have separate availability, service eligibility, booking settings, and lifecycle associations. Deactivation preserves historical appointment references. Professional credentials, license data, and verification status require explicit legal/security review and must not be stored in editable Auth metadata.

MVP practitioner management covers profile, active/deactivated status, location association, service association, display name, communication preferences, and schedule ownership. Credential verification, payer enrollment, clinical specialties, and external registry integrations are future scope.

## 17. Patient management requirements

Patients belong to exactly one organization. Locations and practitioners provide context but never own the patient. Patient records require organization-scoped RLS, duplicate detection, merge history, correction workflow, export, retention, legal hold, and minimum-necessary access.

MVP patient foundation should separate demographics and contact information from future clinical notes. Patient portal linkage is optional and must not change organization ownership. Sensitive identifiers require a documented necessity, format, encryption, masking, retention, and access policy before collection.

## 18. Service catalogue requirements

Services are organization-owned offerings that may be available at selected locations and to selected practitioners. A service includes name, description, duration, buffer, price/display price, tax category, booking visibility, cancellation rules, and active/archived state. Service configuration must not be confused with clinical protocols or medical advice.

## 19. Scheduling and appointment requirements

Appointments are organization-owned and location-associated, with optional practitioner, room, equipment, service, patient, and external event references. Store instants as UTC `timestamptz` with the operational IANA timezone used for scheduling. Preserve local-time intent for recurrence.

The appointment lifecycle includes draft, requested, held, confirmed, checked-in, in-progress, completed, cancelled, no-show, and archived/retained states as product policy requires. Every material change records actor, time, reason, source, and affected availability.

Booking must enforce tenant, practitioner, location, resource, availability, buffer, booking-limit, and cancellation rules transactionally. Conflicting booking attempts must fail safely rather than silently overwrite.

## 20. Availability engine

The availability engine must calculate bookable windows from:

- Practitioner recurring availability and exceptions.
- Location operating hours and closure periods.
- Breaks, time off, holidays, and jurisdiction/location calendars.
- Rooms, equipment, and other constrained resources.
- External calendar busy times.
- Service duration and pre/post appointment buffers.
- Advance-booking, same-day, daily, and rolling booking limits.
- Waitlists, prioritization, notification, and expiry.
- Cancellation, rescheduling, late-cancellation, and no-show rules.

The engine must explain why a slot is unavailable to authorized operators without leaking another tenant’s data. It must handle DST and timezone transitions deterministically, use UTC for conflict comparison, preserve local recurrence intent, and expose a safe recalculation/reconciliation path.

**Requirements:** `MBP-SCHED-001` no double booking; `MBP-SCHED-002` all availability inputs are tenant/resource scoped; `MBP-SCHED-003` availability changes are auditable; `MBP-SCHED-004` waitlist offers expire safely; `MBP-SCHED-005` external busy data is privacy-minimized.

## 21. Calendar integration strategy

### Providers and capabilities

- **Google Calendar:** OAuth connection, practitioner-level and shared-calendar options, busy-time import, optional event export, and future two-way sync subject to scopes and review.
- **Microsoft 365/Outlook:** Microsoft identity/OAuth, delegated calendar access, shared clinic calendar support, busy-time import, and staged event synchronization.
- **Apple Calendar:** Prefer standards-based ICS subscription/export for broad compatibility; direct account synchronization requires an approved provider/API strategy.
- **CalDAV:** Support is fragmented across servers, authentication methods, recurrence behavior, and webhooks. Treat as an advanced integration with explicit compatibility testing.
- **ICS feeds:** One-way subscription/export only; no reliable writeback or conflict resolution should be assumed.

### Integration modes

1. One-way MedBookPro export to an external calendar.
2. Busy-time import from an external calendar without exposing event titles/details.
3. Two-way synchronization for approved providers after conflict, recurrence, privacy, and recovery validation.

A practitioner may connect multiple calendars. Shared clinic calendars may be connected by an authorized organization administrator, but ownership and visibility must be explicit. OAuth credentials belong to the connecting user or organization according to provider policy; tokens are encrypted, scoped minimally, never placed in browser logs, and never treated as tenant identifiers.

Webhooks are preferred where reliable; polling is required as a bounded fallback with backoff, cursors, rate limits, and reconciliation. Conflict handling must define source precedence, duplicate detection, cancelled-event behavior, stale webhook handling, and manual resolution. Recurrence must preserve provider IDs and local-time rules; unsupported recurrence must fail visibly rather than silently change.

Users must be able to disconnect and revoke access. Disconnect stops new sync, removes/invalidates stored tokens, records an audit event, and applies a documented policy to previously imported busy blocks/events. Sync logs record status, provider, connection, object counts, errors safely, and last successful cursor without storing secrets or unnecessary external content.

**Rollout:** first one-way ICS/export, then provider-specific busy-time import, then practitioner-level Google/Microsoft connections, then shared calendars and carefully bounded two-way sync. Apple/CalDAV remain capability-specific rather than assumed parity.

## 22. Migration and import strategy

### Vendor coverage

The migration framework should plan adapters for Jane App, ClinicSense, Cliniko, SimplePractice, Vagaro, Mindbody, Fresha, Acuity, Calendly, Square Appointments, HubSpot, Salesforce, Zoho, Pipedrive, Google Contacts, and Microsoft/Outlook Contacts. Availability, export formats, API access, rate limits, licensing, and field semantics vary; vendor names are not commitments of current integration support.

### Canonical model and pipeline

1. Upload or connect source data through a tenant-authorized import job.
2. Detect source, version, encoding, and export manifest.
3. Map source records into canonical organizations, locations, users, practitioners, patients, services, appointments, contacts, files, and audit references where supported.
4. Validate required fields, formats, tenant ownership, references, timezone, recurrence, duplicate candidates, and unsupported clinical/document content.
5. Show a preview with counts, errors, warnings, proposed merges, skipped records, and sensitive-field handling.
6. Require an authorized confirmation with an idempotency key.
7. Process in background batches with checkpoints, retries, dead-letter handling, and progress.
8. Reconcile source counts, target counts, skipped records, duplicate decisions, and reference integrity.
9. Provide an exportable reconciliation report and audit history.

Adapters must be isolated from canonical domain logic. Mapping versions are immutable once used. Rollback means deleting/quarantining only import-owned records through an approved job, never destructive deletion of pre-existing tenant data. Clinical notes, documents, attachments, consent evidence, and hidden metadata require special migration risk review; importing them is not a default MVP capability.

### Priority

Prioritize CSV plus contacts and appointment exports first, then Jane App, Cliniko, ClinicSense, SimplePractice, and Acuity based on customer demand and export/API safety. Evaluate Vagaro, Mindbody, Fresha, Square Appointments, Calendly, CRM platforms, and calendar contacts as separately scoped adapters. Each adapter requires a data dictionary, sample-safe fixtures, legal/vendor review, and reconciliation tests.

**Requirements:** `MBP-MIG-001` preview is mandatory; `MBP-MIG-002` imports are idempotent and resumable; `MBP-MIG-003` source data is never used as local production data; `MBP-MIG-004` every import has reconciliation and audit output; `MBP-MIG-005` clinical-note/document migration is opt-in and separately reviewed.

## 23. Communications hub

The communications hub will support transactional email first, SMS through an approved provider later, WhatsApp only as a future option subject to consent/provider/legal review, and push notifications where a first-party app exists. Use cases include confirmations, reminders, recalls, campaigns, and operational notices.

Communication requires recipient consent and opt-out rules, channel-specific preferences, purpose classification, localization, quiet hours, template versioning, sender identity, delivery status, bounce/failure handling, retry limits, and auditability. Transactional messages must not be blocked by marketing opt-out when legally permitted, but the distinction must be explicit. Templates must avoid unnecessary patient details and support English/French readiness.

No Twilio, WhatsApp, OpenAI, Stripe, or other provider is introduced by this PRD phase.

## 24. Forms and intake

Forms should support reusable organization-owned templates, versioning, draft/submit/void states, conditional questions, consent capture, localization, accessibility, patient completion, staff completion, review status, and export. Form responses must have a defined data classification and retention policy before storage.

MVP forms focus on administrative intake and consent, not unrestricted clinical charting. Templates must record which version produced a response. Changes after submission are append/correction events, not silent overwrites.

## 25. Clinical documentation boundaries

### MVP boundary

The MVP may store limited operational notes, appointment notes, structured intake, consent evidence, and safe administrative attachments only where a reviewed data classification exists. It must not imply that a free-text field is a complete medical record.

### Future clinical functionality

Future phases may include structured clinical notes, treatment plans, measurements, forms-to-chart workflows, document retention, clinical corrections, co-signatures, provenance, and discipline-specific templates. Clinical records require practitioner review, legal/privacy retention decisions, export and correction workflows, stronger audit, and jurisdiction-specific review. AI must never make autonomous clinical decisions.

## 26. Billing and payments

Commercial requirements include clinic subscriptions, patient payments, invoices, refunds, deposits, packages, memberships, tax calculation, and future insurance-related workflows. Subscription authorization remains separate from membership/RLS authorization. Provider customer IDs are opaque external references.

Patient payment data should use hosted/tokenized provider boundaries; MedBookPro should not store raw payment-card data. Invoices and refunds need state machines, idempotency, authorization, receipt/audit history, reconciliation, and failure recovery. Canadian GST/HST/PST/QST and location/jurisdiction tax behavior require accounting/legal review. Insurance claims and adjudication are future considerations, not MVP commitments.

Accounting integrations should use explicit export/sync contracts and reconciliation rather than treating a provider as the source of tenant identity.

## 27. Subscription and entitlement model

Subscription accounts own plan, trial, billing status, provider references, limits, feature entitlements, and commercial lifecycle. Organizations may be associated with a subscription account; future enterprise accounts may cover multiple organizations only through a reviewed model. Entitlements may gate product capabilities, but they must not replace RLS or membership authorization.

States include trial, active, past_due, paused, cancelled, expired, and grace where product policy requires. Changes are idempotent, audited, and resilient to webhook reordering. Healthcare records are retained according to policy when billing changes.

## 28. Reporting and analytics

Operational reporting should cover schedules, utilization, cancellations, no-shows, service volume, revenue boundaries, staff activity, imports, communications, and audit summaries according to permissions. Reports must be organization/location scoped, timezone-aware, reproducible for a defined period, and exportable with redaction.

Product analytics must be privacy-aware and must not collect patient clinical content, secrets, tokens, or unnecessary identifiers. Aggregated metrics should be preferred. Every report/export requires permission and appropriate auditability.

## 29. Search requirements

Search must be tenant-scoped, permission-aware, typo-tolerant where safe, and explicit about result type. Patient search must minimize exposure in suggestions, support exact/partial identifiers according to policy, mask sensitive fields, and log sensitive exports rather than every keystroke. Cross-tenant search is prohibited.

## 30. Audit and activity history

Audit events cover organization and location lifecycle, membership/role/access changes, invitations, practitioner associations, patient access and changes, appointment changes, exports, integrations, imports, support access, security events, and administrative actions. Events include actor, organization, optional location, action, subject, timestamp, request correlation, outcome, source, and redacted metadata.

Audit storage is append-oriented and access-restricted. Retention, legal hold, export, integrity monitoring, redaction, and correction policies must be defined. Application logs are not a substitute for durable tenant-aware audit history.

## 31. File and document management

Files require organization ownership, classification, metadata, malware scanning, content-type/size limits, access checks, signed short-lived URLs, retention, legal hold, audit, export, and deletion restrictions. Clinical and legal documents need stricter classification than ordinary operational attachments. Object-store paths must not be treated as authorization.

## 32. Integrations platform

Integrations use provider adapters behind stable internal contracts. Each connection has tenant/user ownership, scopes, credentials, state, health, last-sync metadata, rate-limit behavior, disconnect/revocation, audit, and support-safe diagnostics. Provider failures must not corrupt core appointment or patient state.

## 33. Public API and webhook strategy

Future public APIs require versioned resources, OAuth/API-key policy, tenant-scoped authorization, idempotency, pagination, rate limits, audit, webhooks, signing/secrets rotation, replay protection, and deprecation policy. Webhook consumers must verify signatures, tolerate retries/out-of-order delivery, and expose delivery history without leaking payload secrets.

## 34. AI roadmap

Potential AI uses include administrative assistance, scheduling assistance, migration mapping assistance, summarization/drafting support, and support tooling. AI outputs must be labelled, reviewable, attributable, reversible, and auditable.

AI must not make autonomous clinical decisions, diagnose, prescribe, triage unsafely, alter a clinical record without authorized human review, or use tenant data for unapproved training. Privacy safeguards include data minimization, provider risk review, regional processing evaluation, retention controls, prompt/output redaction, tenant isolation, opt-in policy, and incident handling. Enablement should progress from synthetic/local evaluation to administrative assistance, then carefully reviewed drafting; clinical-adjacent features require separate governance.

## 35. Marketplace and extensibility roadmap

Future marketplace capabilities may allow approved integrations, templates, services, and workflow extensions. Every extension requires scopes, tenant consent, data classification, revocation, review, billing boundaries, support ownership, rate limits, and audit. Marketplace apps must not receive broad service-role access or bypass RLS.

## 36. Privacy and compliance considerations

MedBookPro should support Canadian data-residency options and privacy-by-design controls, but the repository does not establish legal compliance or certification. Legal counsel and privacy professionals must assess PIPEDA, applicable provincial private-sector and health-information laws, contractual obligations, and sector-specific requirements.

Requirements include consent purpose and evidence, minimum necessary access, role/scope enforcement, data inventory, retention schedules, export/access requests, correction workflows, deletion restrictions, legal holds, breach-response readiness, processor/vendor risk review, audit access, and documented data flows. Residency is a deployment and vendor decision, not merely a UI setting.

## 37. Security requirements

- PostgreSQL RLS is the final tenant boundary; application checks are supplementary.
- Least privilege applies to users, roles, services, jobs, integrations, support, and database grants.
- MFA is a roadmap requirement for privileged users and eventually all users; it is not implemented in the current repository.
- Sessions use the existing Auth boundary with secure cookie/session handling, expiry/revocation policy, and reauthentication for sensitive actions.
- Data is encrypted in transit and at rest through approved infrastructure; key ownership/rotation requires operational documentation.
- Secrets never appear in source, browser bundles, logs, audit metadata, URLs, or error messages.
- Rate limiting and abuse prevention protect Auth, invitations, booking, imports, communications, APIs, and webhooks.
- Background jobs use trusted execution, idempotency, scoped credentials, retries, dead-letter handling, and safe logs.
- Incident response includes detection, containment, evidence preservation, notification assessment, recovery, and post-incident review.
- Backup and restoration are tested, tenant-aware, encrypted, and subject to retention/legal-hold policy.

## 38. Accessibility requirements

Target WCAG 2.2 AA unless a future approved decision changes the target. All workflows need keyboard navigation, focus management, semantic labels, descriptive errors, sufficient contrast, non-colour cues, reduced-motion support, screen-reader compatibility, responsive layout, and accessible tables/calendars. Accessibility testing includes automated checks, keyboard/manual review, and representative assistive technology testing.

## 39. Localization and Canada-first defaults

The product must be English/French ready even where translation coverage is initially incomplete. Use locale-aware date, number, currency, and time formatting. Support Canadian provinces and territories, Canadian postal-code validation, Canadian time zones, CAD defaults, `en-CA` default locale, and future `fr-CA` workflows. Tax configuration must support Canadian jurisdiction review without hard-coding a legal conclusion.

## 40. Non-functional requirements

| Area            | Requirement direction                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Availability    | Define service-level targets by capability; protect critical Auth, booking, and data access paths                  |
| Performance     | Fast interactive navigation, bounded search/report latency, and explicit import/sync progress                      |
| Scalability     | Scale organizations, locations, memberships, appointments, imports, and integrations independently where practical |
| Reliability     | Idempotency, transactional writes, retries, reconciliation, and safe degradation                                   |
| Observability   | Metrics, structured safe logs, traces, health checks, audit, and alertable job/provider health                     |
| Recoverability  | Tested backups, restoration, replay, reconciliation, and incident runbooks                                         |
| Maintainability | Small packages, clear boundaries, reviewed migrations, ADRs, and versioned adapters                                |
| Testability     | Unit, component, E2E, RLS/pgTAP, contract, import fixture, and failure-path tests                                  |
| Portability     | Avoid unnecessary provider lock-in; keep canonical models and export paths                                         |
| Browser support | Current supported Chrome, Edge, Safari, and Firefox versions subject to tested support policy                      |
| Mobile          | Responsive web workflows; native apps are future scope                                                             |

## 41. Data lifecycle

Data transitions through collection, validation, active use, archival, retention/legal hold, export/correction, anonymization where lawful, and approved deletion. Lifecycle state must be enforced by authorization and query behavior. Healthcare, billing, audit, and legal records must not be casually hard-deleted. Every lifecycle policy needs owner, retention rationale, audit behavior, and recovery implications.

## 42. Notification lifecycle

Notification states include drafted, scheduled, queued, sending, delivered, failed, bounced, cancelled, suppressed, and expired. Each notification records purpose, channel, template version, locale, consent decision, safe recipient reference, provider status, retry count, and audit correlation. Opt-out and quiet-hour behavior must be deterministic and channel-aware.

## 43. Appointment lifecycle

Appointment states are requested, held, confirmed, checked-in, in-progress, completed, cancelled, no-show, and retained/archived as appropriate. Transitions require authorization, validation of availability/resources, reason where material, notifications according to policy, and audit. External synchronization must not create an unreviewed clinical or booking state.

## 44. Invitation lifecycle

Invitation states are created/pending, delivered, accepted, expired, revoked, and superseded. Token issuance is digest-only in storage, single-use, time-limited, rate-limited, and audited without token content. Acceptance must be safe for existing and new Auth users and must not change unrelated memberships.

## 45. Import-job lifecycle

Import jobs progress through created, uploaded, detected, mapped, validating, preview-ready, confirmed, queued, processing, paused, failed, completed, rolled back, and reconciled. Jobs checkpoint work, retry transient errors, isolate permanent errors, expose safe progress, and produce immutable mapping/reconciliation evidence.

## 46. Calendar-sync lifecycle

Connections progress through authorization requested, connected, syncing, healthy, degraded, disconnected, revoked, and error. Sync operations record provider cursor, webhook/polling source, counts, conflict state, retry status, and last success. Disconnect/revocation invalidates credentials and stops future work while preserving safe audit history.

## 47. Error-handling principles

Errors are safe, actionable, typed where possible, and mapped to user-appropriate messages. Do not expose SQL, table names, stack traces, tokens, provider secrets, or unnecessary personal data. Preserve correlation IDs for support, distinguish validation/conflict/authorization/unavailable/unexpected errors, and make retries safe. Never display success before a transaction commits.

## 48. UX principles

Use clear progressive flows, Canadian defaults that remain reviewable, concise terminology, visible state, recoverable errors, accessible focus, non-destructive confirmations, explicit consent, safe empty states, responsive layouts, and honest labels for planned/unavailable capabilities. Avoid dashboards or marketing surfaces that imply functionality not implemented.

## 49. Administrative surfaces

Administrative surfaces will cover organization/location settings, membership/invitations, role/access review, practitioner/location associations, services, scheduling policies, communications, integrations, imports, subscriptions, audit, privacy requests, support access, and feature flags. Each surface must be permission-scoped, tenant-scoped, audited, and safe for partial failure.

## 50. Support and operations requirements

Support requires tenant-aware diagnostics, safe correlation IDs, audit search, job/provider health, runbooks, controlled impersonation or support access only after an approved design, reason capture, time limits, visible audit, and no routine access to patient content. Operations needs backup/restore runbooks, incident response, migration recovery, provider outage handling, rate-limit response, and privacy escalation paths.

## 51. Environments and release strategy

Local development uses deterministic fictional data and local Supabase only. Shared environments receive immutable reviewed migrations. Staging must use synthetic or approved de-identified data. Production deployment requires approved environment configuration, migration review, backup/recovery readiness, privacy/security sign-off, monitoring, rollback/recovery plan, and explicit change ownership.

There are no deployment requirements in the current documentation branch. Netlify, Cloudflare, hosted Supabase, and external providers remain outside this PRD implementation task.

## 52. Testing strategy

Testing must include unit schemas/helpers, accessible component behavior, App Router/server action behavior, Playwright workflows, RLS/pgTAP tenant isolation, migration application, generated type drift, integration contract fixtures, import reconciliation, calendar conflict/retry cases, notification preference cases, security negative cases, accessibility, localization, and backup/restore exercises.

Tests must use fictional identities and data, never production data or personal email addresses. Failure paths and concurrency are first-class tests.

## 53. Feature flags

Feature flags must be server-enforced for sensitive capabilities, tenant-aware, auditable, time-bounded, and safe by default. Flags must not replace authorization or RLS. Every flag has an owner, rollout plan, kill behavior, exposure measurement, and removal date.

## 54. Analytics and product telemetry

Telemetry may measure funnel completion, latency, errors, feature usage, import/sync health, and aggregate operational outcomes. Do not collect patient names, clinical content, tokens, passwords, raw form responses, full URLs containing sensitive data, or unnecessary cross-tenant identifiers. Tenant consent, retention, regional processing, access control, and vendor review apply.

## 55. MVP definition

The MVP is a secure organization-centric clinic operations foundation with:

- Auth identity/profile boundary and protected sessions.
- Organization and first-location onboarding.
- Membership, role, permission, and location-access foundations.
- Staff invitations and basic membership management.
- Practitioner profiles and location associations.
- Patient demographic foundation with organization ownership and safe search.
- Service catalogue.
- Appointment scheduling with practitioner/location availability, timezone correctness, cancellation, reminders boundary, and audit.
- Accessible responsive web workflows, Canadian defaults, local tests, and production readiness gates.

Clinical documentation, advanced billing, broad migrations, two-way calendars, AI, marketplace, and full communications automation are not required to call the MVP complete.

## 56. Version 1.0 acceptance criteria

Version 1.0 requires:

1. An authenticated user can safely create or join an organization without cross-tenant access.
2. Owners/admins can invite, manage, suspend, and scope staff with last-owner protection.
3. Practitioners, patients, locations, services, and appointments have reviewed ownership, RLS, lifecycle, and audit behavior.
4. Scheduling prevents conflicts and handles UTC/timezone, availability, buffers, holidays, and cancellation policy.
5. Accessible English workflows and Canadian defaults are tested; French readiness is structurally supported.
6. Safe export, retention, correction, and audit workflows exist for implemented data classes.
7. Backups, restore, incident, provider outage, import, and migration recovery are tested.
8. Security/privacy review, legal review where required, and production deployment gates are complete.
9. No known critical tenant-isolation, authorization, data-loss, or secret-exposure defect remains.

## 57. Explicit Version 1.0 non-goals

Autonomous clinical decisions, diagnosis, prescribing, broad clinical decision support, universal EHR replacement, insurance adjudication, raw card storage, unreviewed patient identity federation, unlimited marketplace extensions, unsupported vendor parity, anonymous cross-tenant analytics, and legal/compliance certification claims are non-goals.

## 58. Product roadmap

| Phase                                                  | Scope                                                                                 | Gate                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------- |
| Phase 1 — Platform foundation                          | Workspace, Auth boundary, SSR, basic protected shell, tooling                         | Secure Auth and CI baseline             |
| Phase 2A — Core domain architecture                    | Domain model, ERD, ADRs, ownership, lifecycle, audit, Canada-first decisions          | Architecture and product reconciliation |
| Phase 2B — Organization and first-location onboarding  | Atomic organization/location onboarding, owner membership, idempotency, RLS           | Local DB/RLS and onboarding validation  |
| Phase 2C — Staff invitations and membership management | Invitations, membership states, owner protection, explicit location access            | IAM/RLS/security review                 |
| Phase 2D — Practitioner foundation                     | Practitioner profiles, associations, lifecycle, booking settings                      | Professional data and access review     |
| Phase 2E — Patient foundation                          | Organization-owned patient demographics, search, duplicate/merge direction, retention | Privacy/data lifecycle review           |
| Phase 2F — Services and scheduling                     | Services, availability, resources, appointments, cancellation, audit                  | Conflict/timezone/access tests          |
| Phase 2F.5 — Calendar and scheduling integrations      | ICS/export, busy import, Google/Microsoft staged sync                                 | Provider/privacy/conflict review        |
| Phase 2G — Subscription and entitlements               | Commercial accounts, trials, plans, entitlements, provider webhooks                   | Billing/security/legal review           |
| Phase 2H — Migration and import framework              | Canonical adapters, preview, mapping, background jobs, reconciliation                 | Data migration and rollback review      |
| Phase 3 — Production readiness                         | Deployment, monitoring, backup/restore, incident/privacy operations, production gates | Security/privacy/operations sign-off    |

Logical future phases: communications hub, payments/accounting, forms/intake, bounded clinical documentation, reporting/analytics, AI assistance, and marketplace/extensions. These may be sequenced or split after dependency and customer research.

## 59. Dependency map

| Capability             | Depends on                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Phase 2C IAM           | Phase 1 Auth, Phase 2A terminology, Phase 2B organization/membership foundation    |
| Practitioner           | IAM, organization/location, audit, lifecycle                                       |
| Patient                | IAM, organization ownership, search, privacy/retention, audit                      |
| Services               | Organization/location, practitioner associations, commercial policy                |
| Scheduling             | Practitioner, services, locations, resources, timezone and lifecycle model         |
| Calendar sync          | Scheduling, integration credentials, privacy, conflict/reconciliation              |
| Communications         | Patient/contact model, consent, templates, provider platform, audit                |
| Billing                | Organization/subscription boundary, tax/accounting review, payment provider        |
| Imports                | Canonical domain models, background jobs, audit, rollback, data classification     |
| Clinical documentation | Patient foundation, practitioner workflow, privacy/legal review, retention, audit  |
| AI                     | Approved data boundaries, human review, telemetry/privacy, provider risk review    |
| Production             | All critical workflows, migrations, backups, observability, security/privacy gates |

## 60. Risks and mitigations

| Risk                                | Mitigation                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Tenant data leakage                 | RLS, qualified helpers, negative tests, least privilege, review gates                               |
| Ambiguous clinic/location semantics | Preserve compatibility clinic only; use canonical organization/location language; ADR before change |
| Implicit future-location access     | Phase 2C explicit access-mode migration and owner conversion tests                                  |
| Last-owner lockout                  | Database/application protection and ownership-transfer workflow                                     |
| DST/calendar conflicts              | UTC instants plus IANA timezone, provider contract tests, reconciliation                            |
| Migration data loss/duplicates      | Preview, mapping versions, idempotency, checkpoints, reconciliation, rollback-owned records         |
| Privacy over-collection             | Data classification, minimum necessary access, redaction, retention and vendor review               |
| Provider outage/rate limits         | Queues, backoff, circuit behavior, status visibility, manual reconciliation                         |
| Clinical automation harm            | No autonomous decisions; human review, provenance, restricted rollout                               |
| Product complexity                  | Progressive complexity, persona testing, safe defaults, phased roadmap                              |
| Regulatory mismatch                 | Canadian legal/privacy review and jurisdiction-specific configuration                               |
| Operational recovery failure        | Tested backups, restoration, incident runbooks, game days                                           |

## 61. Open product questions

1. Which Canadian residency regions and hosting options are required for initial target customers?
2. What exact provincial privacy/health-information obligations apply to each target segment?
3. What is the approved ownership-transfer and last-owner emergency process?
4. When and how will implicit empty-scope owner access become explicit access mode?
5. Are location-scoped roles needed, or are organization roles plus location grants sufficient?
6. Which professional credential fields may be stored, verified, and retained?
7. What patient identifier, duplicate, merge, correction, and portal-link policies are approved?
8. What clinical documentation is in Version 1.0, and what is explicitly excluded?
9. Which calendar providers and synchronization modes are highest priority for initial customers?
10. Which migration vendors have sufficient export/API access and customer demand for first adapters?
11. Which communications channels and consent rules are required in each province/segment?
12. What tax/accounting jurisdictions and payment providers are required for launch?
13. What support-access model, notification, recording, and approval process is acceptable?
14. What availability, recovery time, recovery point, and support targets are commercially required?
15. What telemetry is acceptable for each tenant and privacy posture?

These questions align with the open decisions in `docs/architecture/core-domain-open-questions.md` and must not be silently resolved in implementation.

## 62. Decision log references

- ADR 0001: Organization is primary tenant; location is subordinate site; clinic remains compatibility grouping.
- ADR 0002: Membership-based access supports multiple organizations and location scopes.
- ADR 0003: Allow-based `domain.action` permissions; missing permission denies.
- ADR 0004: PostgreSQL RLS enforces tenant isolation.
- ADR 0005: Supabase Auth identity is separate from application profile.
- ADR 0006: Patients are organization-owned.
- ADR 0007: Practitioner profile is separate from Auth identity.
- ADR 0008: Explicit membership-location access is the target model; current empty scopes are compatibility behavior.
- ADR 0009: Subscription and entitlement ownership is separate from authorization.
- ADR 0010: Appointment instants use UTC with timezone context.
- ADR 0011: Archive rather than casually destructively delete operational records.
- ADR 0012: Sensitive domain actions use durable audit events.

ADR status must be respected: 0001–0005 are accepted architecture decisions; 0006–0012 were recorded as Phase 2A proposed decisions and remain subject to the repository’s approval process where marked proposed.

## 63. Glossary

- **Auth identity:** Supabase-managed credential and session identity.
- **Organization:** Primary tenant and operational owner.
- **Location:** Physical or virtual operating site.
- **Clinic:** Compatibility/grouping structure, not an independent tenant.
- **Membership:** User-to-organization relationship and state.
- **Role:** Named permission bundle.
- **Permission:** `domain.action` capability.
- **RLS:** PostgreSQL Row Level Security.
- **Practitioner:** Organization-owned professional profile.
- **Patient:** Organization-owned person record.
- **Service:** Bookable or operational offering.
- **Appointment:** Scheduled interaction with time/resource context.
- **Entitlement:** Commercially controlled product capability or limit.
- **Import job:** Background migration operation with preview, checkpoints, and reconciliation.
- **Busy time:** External calendar interval used to reduce double booking without importing unnecessary details.
- **Minimum necessary:** The least data and access needed for the stated purpose.

## 64. Traceability

| PRD area                           | Repository source of truth                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace and implemented baseline | `README.md`, `docs/architecture/workspace-structure.md`, current `apps/web` routes                                                    |
| Auth/session boundaries            | `docs/development/supabase-auth.md`, `docs/development/auth-ui.md`, ADR 0005, `apps/web/src/lib/supabase`                             |
| Organization/location terminology  | `docs/architecture/core-domain-model.md`, `core-domain-erd.md`, ADR 0001, `tenant-ownership-matrix.md`                                |
| Membership/roles/permissions       | ADRs 0002–0004, `docs/atlas/identity/roles-and-permissions.md`, `rls-policy-matrix.md`                                                |
| Onboarding                         | `docs/development/organization-onboarding.md`, `supabase/migrations/20260717100000_add_organization_onboarding.sql`, local pgTAP test |
| Patient/practitioner ownership     | ADRs 0006–0007, core-domain model and ERD                                                                                             |
| Location access                    | ADR 0008, `docs/architecture/core-domain-reconciliation.md`, identity helpers/RLS                                                     |
| Subscription separation            | ADR 0009, core-domain model and ERD                                                                                                   |
| UTC scheduling                     | ADR 0010, core-domain model and ERD                                                                                                   |
| Archival/lifecycle                 | ADR 0011, core-domain model, tenant ownership matrix                                                                                  |
| Auditability                       | ADR 0012, `docs/atlas/identity/audit-model.md`, audit migration                                                                       |
| Migrations and testing             | `docs/development/database-migrations.md`, `database-testing.md`, `local-supabase.md`, `supabase/tests`                               |
| Open decisions and roadmap         | `core-domain-open-questions.md`, `core-domain-implementation-plan.md`                                                                 |

When this PRD conflicts with an accepted ADR, the ADR governs until a reviewed ADR change is approved. When the PRD identifies a planned capability not represented in the repository, implementation must begin with reconciliation, design, security/privacy review, and appropriate migration planning.
