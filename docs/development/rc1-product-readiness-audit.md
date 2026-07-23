# RC1 Product Readiness Audit

## Scope and baseline

This audit covers the RC1 product-readiness review on branch
`fix/rc1-product-readiness`, based on main commit `3b4352c` (PR #29). It does
not modify hosted Supabase, production infrastructure, credentials, or real
patient data.

The local application is `apps/web`. Local browser configuration belongs in
`apps/web/.env.local`; the root `.env.local` is not present. The pre-existing
untracked `apps/web/env.local` was preserved and not read, changed, staged, or
deleted. Environment values are never included in this audit.

## Hydration and runtime diagnostics

`apps/web/src/app/layout.tsx` renders a static, deterministic document shell.
A clean Playwright context showed no unexpected `html` or `body` attributes and
no hydration or page errors on the Services route. The reported
`data-qb-installed="true"` attribute was not reproduced and is consistent with
a browser extension, so no suppression or production workaround was added.

Request correlation IDs and server timing already run in middleware. The
organization context lookup is request-cached and emits a development-only
safe diagnostic with duration and success state, without user, organization, or
secret values.

## Services blocker and correction

The Services navigation and page were missing. The `services` table existed,
but direct writes were denied by RLS and there was no route, action, or RPC for
authorized staff to create services. This made the visible workflow
structurally impossible.

This branch adds tenant-scoped `create_service`, `update_service`, and
`archive_service` RPCs with fixed search paths, server-derived auth context,
permission checks, input validation, audit events, and safe duplicate handling.
The new Services page uses these RPCs and provides pending, success, error,
edit, archive, and refresh behavior. No service-role key is used.

## Exposed module audit

| Module | Current state | RC1 assessment |
| --- | --- | --- |
| Dashboard | Read-only summary and navigation | Available |
| Patients | Tenant-scoped create, edit, status, and detail flows | Available; synthetic flow covered by existing tests |
| Practitioners | Create, edit, status, and assignment foundations | Available; full pilot workflow still needs operational verification |
| Services | Create, update, archive, tenant filtering, and refresh | Corrected on this branch |
| Appointments | RPC-backed create, update, and status flows | Available; redirect error handling corrected; full browser workflow remains a release gate |
| Clinical | Encounter, SOAP, care-plan, and form actions | Foundation available; full browser workflow remains a release gate |
| Documents | Metadata, archive, and restore foundation | No file-upload provider; deferred integration |
| Reports | Read-only reporting views and export placeholders | Foundation only |
| Communications | Metadata and mock-send foundation | No external provider enabled |
| Billing | Invoice and payment foundation | Not a complete pilot billing workflow |
| Telehealth | Provider-neutral metadata placeholders | No video provider enabled |
| AI | Governance and foundation surfaces | No live AI provider enabled |
| Integrations | Provider-neutral integration metadata | No credentials or live providers |
| Staff | Invitation and membership management | Available; operational invitation verification remains a release gate |
| Patient portal | Separate patient route foundation | Requires separate portal acceptance testing |

## Performance and interaction review

The Services page uses server-side tenant filtering and ordered fields rather
than loading unrelated organizations. Request-level React caching prevents
duplicate organization-context work within a render. Development timing logs
showed warm local Services requests completing in the sub-second range; these
are diagnostic observations, not production benchmarks.

Shared submit controls now disable during server actions and show pending text.
Services mutations refresh the server-rendered catalogue after success.
Appointment and clinical create actions no longer swallow Next.js redirect
control flow as generic errors. Remaining forms should be standardized on the
same action-state error and pending pattern before a broad pilot.

## Accessibility and safety

The reviewed screens use semantic headings, labels, forms, landmarks, visible
focus styles, responsive grid layouts, and `role="alert"` for route errors.
Remaining validation requires keyboard-only, screen-reader, contrast, zoom,
and narrow viewport review across every module. Several legacy forms still
need consistent inline error summaries and destructive-action styling.

User-facing failures remain generic. Development diagnostics retain a safe
event name and root-cause category while redacting secrets and avoiding raw
database, authentication, hostname, or patient data in responses.

## Validation evidence and remaining blockers

The Services flow was exercised locally with synthetic data: two services were
created, one edited, one archived, and state persisted after refresh. Database
reset and SQL tests passed after adding the service-management migration and
regression suite.

Before pilot approval, complete the full browser workflow for clinic setup,
staff invitation, patient, practitioner, service assignment, appointment, and
clinical encounter; repeat it for portal isolation; and complete manual
accessibility review. Billing, documents, communications, telehealth,
integrations, and AI remain intentionally incomplete or provider-neutral.

**Recommendation:** not yet pilot-ready as a complete clinic operating
workflow. The Services blocker is corrected, but the remaining end-to-end and
manual acceptance gates must pass before a pilot go decision.
