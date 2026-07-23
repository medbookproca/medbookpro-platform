import { Card } from '@medbookpro/ui';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';

export default async function MockPaymentPage() { await requireAuthenticatedUser('/app/billing/mock-payment'); return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><Card><h1 className="text-3xl font-semibold">Mock payment</h1><p className="mt-3 text-slate-600">Payments are recorded through the billing RPCs using placeholder methods. No gateway, card data, or external API is used.</p></Card></div></main>; }
