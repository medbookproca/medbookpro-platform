'use client';

import { InlineLink } from './inline-link';
import { BrandWordmark } from './brand-wordmark';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  heading: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ heading, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <BrandWordmark href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{heading}</h1>
          {description && (
            <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>
          )}
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center text-sm">
            {footer}
          </div>
        )}

        {/* Security/Privacy Notice */}
        <div className="mt-8 rounded-lg bg-blue-50 px-4 py-3 text-center text-xs text-blue-800">
          <p>
            Your account will be protected using secure authentication controls.{' '}
            <InlineLink href="/privacy" variant="subtle" className="font-medium underline">
              Privacy &amp; Terms
            </InlineLink>
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <InlineLink href="/" variant="subtle">
            ← Back to MedBookPro
          </InlineLink>
        </div>
      </div>
    </div>
  );
}
