'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useState } from 'react';
import { FormField, PasswordField, SubmitButton, FormAlert, PasswordRequirements } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { acceptInvitationSchema, type AcceptInvitationInput } from '@medbookpro/shared';
import { mockAuthService } from '@/lib/auth/mock-auth-service';
import { AuthLayout } from '@/components/auth-layout';

type InvitationState = 'valid' | 'existing-user' | 'expired' | 'revoked' | 'already-accepted';

function InvitationContent() {
  const [invitationState, setInvitationState] = useState<InvitationState>('valid');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: AcceptInvitationInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await mockAuthService.acceptInvitation('mock-invitation-code', {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Valid invitation form
  if (invitationState === 'valid') {
    return (
      <AuthLayout
        heading="Accept Invitation"
        description="You've been invited to join a clinic on MedBookPro"
        footer={
          <>
            Already have an account?{' '}
            <InlineLink href="/sign-in">Sign in</InlineLink>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorMessage && (
            <FormAlert type="error" title="Acceptance failed" message={errorMessage} />
          )}
          {successMessage && (
            <FormAlert type="success" title="Invitation accepted" message={successMessage} />
          )}

          {/* Mock Invitation Details */}
          <div className="rounded-lg bg-blue-50 px-4 py-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">Invited Email</p>
              <p className="text-blue-800">jane.smith@clinic.ca</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Organization</p>
              <p className="text-blue-800">[Organization Name]</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Assigned Role</p>
              <p className="text-blue-800">[Role Placeholder]</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Invitation Expires</p>
              <p className="text-blue-800">[Date Placeholder]</p>
            </div>
          </div>

          <FormField
            label="First Name"
            {...register('firstName')}
            registration={register('firstName')}
            error={errors.firstName?.message}
            placeholder="Jane"
            autoComplete="given-name"
            required
          />

          <FormField
            label="Last Name"
            {...register('lastName')}
            registration={register('lastName')}
            error={errors.lastName?.message}
            placeholder="Smith"
            autoComplete="family-name"
            required
          />

          <PasswordField
            label="Password"
            {...register('password')}
            registration={register('password')}
            error={errors.password?.message}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
          />

          {passwordValue && <PasswordRequirements password={passwordValue} />}

          <PasswordField
            label="Confirm Password"
            {...register('confirmPassword')}
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
          />

          <SubmitButton isLoading={isLoading} loadingText="Accepting invitation...">
            Accept Invitation
          </SubmitButton>

          <div className="pt-4 space-y-2 text-center">
            <button
              type="button"
              onClick={() => setInvitationState('existing-user')}
              className="text-sm text-slate-600 hover:text-slate-900 block"
            >
              Already have an account?
            </button>
            <button
              type="button"
              onClick={() => setInvitationState('expired')}
              className="text-sm text-slate-600 hover:text-slate-900 block"
            >
              Try expired state
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // Existing user (already has MedBookPro account)
  if (invitationState === 'existing-user') {
    return (
      <AuthLayout
        heading="Accept Invitation"
        description="You already have a MedBookPro account"
        footer={
          <InlineLink href="/sign-in">Sign in to continue</InlineLink>
        }
      >
        <div className="space-y-5">
          <FormAlert
            type="info"
            title="Account exists"
            message="We found an existing MedBookPro account for this email. Sign in to accept this invitation and connect it to your account."
          />
          <button
            onClick={() => setInvitationState('valid')}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Back to invitation form
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Expired invitation
  if (invitationState === 'expired') {
    return (
      <AuthLayout
        heading="Invitation Expired"
        description="This invitation link is no longer valid"
        footer={
          <InlineLink href="/sign-in">Sign in</InlineLink>
        }
      >
        <div className="space-y-5">
          <FormAlert
            type="warning"
            title="Invitation expired"
            message="This invitation has expired. Please contact your organization administrator to request a new invitation."
          />
          <button
            onClick={() => setInvitationState('valid')}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Back to invitation form
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Revoked invitation
  if (invitationState === 'revoked') {
    return (
      <AuthLayout
        heading="Invitation Revoked"
        description="This invitation has been revoked"
        footer={
          <InlineLink href="/">Back to home</InlineLink>
        }
      >
        <div className="space-y-5">
          <FormAlert
            type="error"
            title="Invitation revoked"
            message="This invitation has been revoked by the organization administrator. Please contact them if you believe this was done in error."
          />
          <button
            onClick={() => setInvitationState('valid')}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Back to invitation form
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Already accepted
  return (
    <AuthLayout
      heading="Invitation Already Accepted"
      description="This invitation has already been used"
      footer={
        <InlineLink href="/sign-in">Sign in</InlineLink>
      }
    >
      <div className="space-y-5">
        <FormAlert
          type="info"
          title="Already accepted"
          message="This invitation has already been accepted. You can sign in to your account to continue."
        />
        <button
          onClick={() => setInvitationState('valid')}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Back to invitation form
        </button>
      </div>
    </AuthLayout>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvitationContent />
    </Suspense>
  );
}
