import { describe, expect, it } from 'vitest';
import { dashboardReportSchema, reportExportSchema, reportFiltersSchema } from './reporting-schemas';

describe('reporting schemas', () => {
  it('requires bounded tenant date filters', () => {
    expect(reportFiltersSchema.safeParse({ organizationId: '00000000-0000-0000-0000-000000000001', fromDate: '2026-01-01', toDate: '2026-01-31' }).success).toBe(true);
    expect(reportFiltersSchema.safeParse({ organizationId: 'not-a-uuid', fromDate: '2026-01-01', toDate: '2026-01-31' }).success).toBe(false);
  });
  it('keeps dashboard metrics numeric and export formats bounded', () => {
    expect(dashboardReportSchema.shape.revenue.safeParse(10).success).toBe(true);
    expect(reportExportSchema.safeParse({ reportKey: 'revenue', format: 'xlsx' }).success).toBe(true);
    expect(reportExportSchema.safeParse({ reportKey: 'revenue', format: 'html' }).success).toBe(false);
  });
});
