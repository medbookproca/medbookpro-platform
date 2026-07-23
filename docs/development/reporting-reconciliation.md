# Reporting Reconciliation

Phase 2J reads the existing organization, location, patient, appointment, practitioner, encounter, communications, billing, and audit boundaries. It adds no clinical or financial source tables. Reporting views expose aggregates only where the caller has `reports.read`; RPCs repeat the organization permission check and apply date, location, and practitioner filters server-side.

The dashboard is operational and descriptive. It does not infer clinical quality, make predictions, generate AI insights, or create cross-tenant comparisons. Communication reports summarize queue and delivery metadata, billing reports summarize invoice and payment totals, and clinical reports summarize encounter activity without returning clinical note content.

Saved filters are organization-owned metadata and export requests are placeholders that create audit records without producing files. Future data warehouse, Power BI, Tableau, Looker Studio, scheduled reports, and external BI connectors require separate privacy, governance, retention, and least-privilege review.
