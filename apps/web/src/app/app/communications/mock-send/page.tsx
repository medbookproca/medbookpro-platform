import { Card } from '@medbookpro/ui';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';

export default async function MockSendPage() { await requireAuthenticatedUser('/app/communications/mock-send'); return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><Card><h1 className="text-3xl font-semibold">Mock send</h1><p className="mt-3 text-slate-600">Use the queue page to send a queued item through the local mock provider. No email, SMS, push, WhatsApp, or external API call is made.</p></Card></div></main>; }
