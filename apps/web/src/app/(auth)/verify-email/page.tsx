'use client';

import { Suspense, useState } from 'react';
import { FormAlert, LoadingIndicator } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { AuthLayout } from '@/components/auth-layout';

type VerificationState = 'awaiting' | 'sent' | 'verified' | 'expired' | 'invalid';

function VerifyEmailContent() {
  const [state, setState] = useState<VerificationState>('awaiting');

  const stateContent: Record<VerificationState, { heading: string; description: string; content: React.ReactNode }> = {
    awaiting: {
      heading: 'Verify Your Email',
      description: 'A verification email has been sent to your account',
      content: (
        <div className="space-y-5 text-center">
          <LoadingIndicator text="Awaiting email verification..." />
          <p className="text-sm text-slate-600">
            Check your inbox and spam folder for a verification link. Click the link to confirm your email address.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => setState('sent')}
              className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Email Sent
            </button>
            <button
              onClick={() => setState('expired')}
              className="inline-flex justify-center rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Link Expired
            </button>
          </div>
        </div>
      ),
    },
    sent: {
      heading: 'Email Sent',
      description: 'Look for our verification email',
      content: (
        <div className="space-y-5">
          <FormAlert
            type="success"
            title="Email sent"
            message="We've sent a verification email to your account. Please check your inbox and click the verification link to activate your account."
          />
          <p className="text-sm text-slate-600">
            The link will expire in 24 hours. If you don't see the email, check your spam folder or contact support.
          </p>
          <button
            onClick={() => setState('verified')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Email Verified
          </button>
        </div>
      ),
    },
    verified: {
      heading: 'Email Verified',
      description: 'Your account is now active',
      content: (
        <div className="space-y-5">
          <FormAlert
            type="success"
            title="Email verified"
            message="Congratulations! Your email has been verified. You can now sign in to your MedBookPro account."
          />
          <InlineLink href="/sign-in" className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Sign In
          </InlineLink>
        </div>
      ),
    },
    expired: {
      heading: 'Link Expired',
      description: 'Your verification link has expired',
      content: (
        <div className="space-y-5">
          <FormAlert
            type="warning"
            title="Link expired"
            message="Your verification link has expired. Please request a new verification email."
          />
          <button
            onClick={() => setState('sent')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Resend Verification Email
          </button>
        </div>
      ),
    },
    invalid: {
      heading: 'Invalid Link',
      description: 'The verification link is invalid or has already been used',
      content: (
        <div className="space-y-5">
          <FormAlert
            type="error"
            title="Invalid link"
            message="The verification link is invalid or has already been used. Please request a new verification email."
          />
          <button
            onClick={() => setState('sent')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Request New Email
          </button>
        </div>
      ),
    },
  };

  const current = stateContent[state];

  return (
    <AuthLayout
      heading={current.heading}
      description={current.description}
      footer={
        state === 'verified' ? null : (
          <>
            Already verified?{' '}
            <InlineLink href="/sign-in">Sign in</InlineLink>
          </>
        )
      }
    >
      <div className="space-y-5">
        {state === 'awaiting' && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p>
              This is a demonstration page showing different email verification states. In a real system, the state would depend on whether the verification link is valid.
            </p>
          </div>
        )}
        {current.content}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
