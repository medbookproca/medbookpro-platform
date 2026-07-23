# Billing Foundation

## Architecture

The domain includes billing profiles, invoices, invoice items, payments, allocations, credit notes, receipts, tax profiles, discount rules, and billing events. Patient, appointment, and encounter references use organization-aware foreign keys. Financial records are retained rather than casually deleted.

## Lifecycles

Invoices start as `draft`, can be updated, then become `issued`, `partially_paid`, or `paid`. Authorized staff can cancel or void eligible invoices. Payments are recorded as completed mock/manual records and allocated transactionally. Credit notes reduce the remaining balance and retain their reason. Receipts are generated once per payment.

## Tax and discounts

Tax profiles store named jurisdiction rates as metadata and support future GST/HST/PST expansion. Discount rules are organization-owned and support fixed or percentage values. Calculation is intentionally bounded and not a substitute for Canadian accounting or legal review.

## Provider abstraction

The application exposes a mock payment-provider interface only. No Stripe, Square, Moneris, PayPal, Clover, gateway SDK, network call, token, or card number is accepted by this phase.

## Security, privacy, and future work

RLS permits tenant-scoped reads with `billing.read`; direct writes are denied. RPCs enforce billing permissions and audit invoice, payment, allocation, receipt, credit-note, tax, and discount changes. Patient financial information is sensitive and must not be logged or used in local development. Insurance claims, accounting exports, QuickBooks, Xero, provincial billing, refunds, PDF receipts, and live gateways are out of scope.

## Rollback and limitations

The migration is immutable after shared application. Rollback requires a reviewed forward migration or controlled restore. This foundation does not calculate jurisdiction-specific tax law, reconcile bank statements, submit claims, or process live payments.
