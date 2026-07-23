import { Card } from '@medbookpro/ui';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';

export default async function PatientBillingPage() {
  await requirePatientPortalAccount('/app/patient/billing');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_patient_billing');
  if (error) throw error;
  const billing = data as { invoices?: Array<{ invoiceNumber: string; status: string; balance: number; currency: string }>; payments?: Array<{ amount: number; currency: string; status: string }>; receipts?: Array<{ receiptNumber: string }> };
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-semibold">Billing</h1><p className="mt-3 text-slate-600">Your invoices, payments, and receipts. No payment provider is connected.</p><div className="mt-8 grid gap-4 md:grid-cols-3"><Card><h2 className="font-semibold">Invoices</h2><p className="mt-2 text-2xl">{billing.invoices?.length ?? 0}</p></Card><Card><h2 className="font-semibold">Payments</h2><p className="mt-2 text-2xl">{billing.payments?.length ?? 0}</p></Card><Card><h2 className="font-semibold">Receipts</h2><p className="mt-2 text-2xl">{billing.receipts?.length ?? 0}</p></Card></div><div className="mt-8 space-y-4">{billing.invoices?.map((invoice) => <Card key={invoice.invoiceNumber}><p className="font-semibold">{invoice.invoiceNumber}</p><p className="text-sm text-slate-600">{invoice.status} · Balance {invoice.currency} {invoice.balance.toFixed(2)}</p></Card>)}</div></div></main>;
}
