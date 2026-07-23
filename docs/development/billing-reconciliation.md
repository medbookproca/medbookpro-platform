# Billing Reconciliation

Phase 2I adds an organization-owned billing foundation that references existing patients, appointments, and clinical encounters through composite tenant foreign keys. Communications is not modified; future reminders may reference invoice identifiers only when an approved workflow defines the minimum necessary disclosure. Future insurance claims, accounting exports, QuickBooks, Xero, Stripe, Moneris, Clover, and provincial billing remain integration boundaries.

Invoices own immutable financial totals and a draft-to-issued-to-paid lifecycle. Payments are provider-neutral records with placeholder methods, allocations are explicit, receipts reference payments, and credit notes adjust remaining invoice balance without deleting history. Canadian currency and future GST/HST/PST rates are represented without pretending tax advice or accounting policy has been finalized.

All billing writes are security-definer RPCs with server-side permission checks and audit events. Billing tables are organization-scoped, direct writes are denied by RLS, and provider references are opaque mock values only. Raw card data, insurance submissions, provider credentials, and production payment data are intentionally absent.
