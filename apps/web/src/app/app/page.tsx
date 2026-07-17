import { Card } from '@medbookpro/ui';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { signOutAction } from './actions';

export default async function AppPage() {
  const user = await requireAuthenticatedUser('/app');

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MedBookPro</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Authenticated application</h1>
        <Card className="mt-8">
          <p className="text-lg text-slate-700">Your Supabase session is active.</p>
          <p className="mt-2 text-sm text-slate-600">Signed in as {user.email ?? 'the authenticated user'}.</p>
          <form action={signOutAction} className="mt-6">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign out
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
