import { z } from 'zod';

export const reportFiltersSchema = z.object({ organizationId: z.string().uuid(), fromDate: z.string().date(), toDate: z.string().date(), locationId: z.string().uuid().nullable().optional(), practitionerId: z.string().uuid().nullable().optional() });
export const dashboardReportSchema = z.object({ organizationId: z.string().uuid(), fromDate: z.string().date(), toDate: z.string().date(), appointments: z.number().nonnegative(), patients: z.number().nonnegative(), revenue: z.number().nonnegative(), outstanding: z.number().nonnegative(), payments: z.number().nonnegative(), encounters: z.number().nonnegative(), notifications: z.number().nonnegative() });
export const revenueReportSchema = z.object({ organizationId: z.string().uuid(), periodStart: z.string().date(), invoiceCount: z.number().int().nonnegative(), subtotal: z.number(), tax: z.number(), discount: z.number(), total: z.number(), balance: z.number() });
export const appointmentReportSchema = z.object({ organizationId: z.string().uuid(), activityDate: z.string().date(), status: z.string(), appointmentCount: z.number().int().nonnegative() });
export const patientGrowthReportSchema = z.object({ organizationId: z.string().uuid(), periodStart: z.string().date(), newPatientCount: z.number().int().nonnegative() });
export const communicationReportSchema = z.object({ organizationId: z.string().uuid(), activityDate: z.string().date(), channel: z.string(), status: z.string(), notificationCount: z.number().int().nonnegative(), deliveryCount: z.number().int().nonnegative() });
export const clinicalReportSchema = z.object({ organizationId: z.string().uuid(), activityDate: z.string().date(), status: z.string(), encounterCount: z.number().int().nonnegative() });
export const reportExportSchema = z.object({ reportKey: z.string().min(1), format: z.enum(['csv', 'xlsx', 'pdf']), filters: z.record(z.unknown()).default({}) });
