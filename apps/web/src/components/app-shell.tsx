'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOutAction } from '@/app/app/actions';
import {
  getVisibleAppNavigation,
  type AppNavigationItem,
} from '@/lib/app-navigation';

interface AppShellProps {
  children: React.ReactNode;
  email: string | null;
  organizationName: string;
  locationName: string | null;
  roleKeys: string[];
}

function NavigationLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: AppNavigationItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Application" className="space-y-1">
      {items.map((item) => {
        const active =
          item.href === '/app'
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${active ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  email,
  organizationName,
  locationName,
  roleKeys,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = getVisibleAppNavigation(roleKeys);
  const currentItem = navigation.find((item) =>
    item.href === '/app'
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block"
        aria-label="Desktop application navigation"
      >
        <div className="flex h-full flex-col p-5">
          <Link
            href="/app"
            className="rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="block text-sm font-semibold uppercase tracking-wide text-blue-700">
              MedBookPro
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Clinic operations
            </span>
          </Link>
          <div className="mt-8 flex-1 overflow-y-auto">
            <NavigationLinks items={navigation} pathname={pathname} />
          </div>
          <form
            action={signOutAction}
            className="border-t border-slate-200 pt-4"
          >
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        id="mobile-navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white p-5 transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Mobile application navigation"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/app"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="block text-sm font-semibold uppercase tracking-wide text-blue-700">
              MedBookPro
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Clinic operations
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ×
          </button>
        </div>
        <div className="mt-8 overflow-y-auto">
          <NavigationLinks
            items={navigation}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {currentItem?.label ?? 'Application'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {organizationName}
                {locationName ? ` · ${locationName}` : ''}
              </p>
            </div>
            <div
              className="hidden max-w-[14rem] truncate text-right text-sm text-slate-600 sm:block"
              title={email ?? undefined}
            >
              {email ?? 'Signed-in user'}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
