# Reporting Foundation

## Architecture and catalog

Reporting uses permission-filtered SQL views over the operational schema: dashboard summary, revenue, appointment statistics, patient growth, practitioner activity, invoice status, payment summary, communication summary, clinical activity, and staff activity. Views return counts, statuses, dates, and totals rather than patient contact details or clinical note bodies.

## RPC design

Server-side RPCs accept an organization and bounded date range, with location and practitioner filters where meaningful. They return JSON aggregates for dashboard clients and repeat the report permission check. Dashboard access, export placeholders, and saved-filter changes are audited. Export formats are metadata-only placeholders for future CSV, Excel, and PDF boundaries.

## Performance

The current foundation uses live views because the source tables are small and no refresh policy has been approved. Indexes on organization/date fields in the operational domains support the initial queries. A future materialized or warehouse-backed model must define freshness, backfill, retention, tenant isolation, and correction behavior before adoption.

## Security and privacy

Views are filtered by `reports.read`, RPCs are security-definer with explicit organization checks, and saved filters use RLS with direct writes denied. Reports must not expose raw addresses, communication destinations, clinical content, payment-card data, or secrets. Local development must use synthetic data only.

## Future integrations and limitations

AI analytics, predictive analytics, Power BI, Tableau, Looker Studio, scheduled reports, email reports, PDF generation, Excel generation, and external data warehouses are out of scope. Rollback is a reviewed forward migration or controlled restore; applied migrations are not edited in place.
