'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormField, SubmitButton, FormAlert } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@medbookpro/shared';
import { mockAuthService } from '@/lib/auth/mock-auth-service';
import { AuthLayout } from '@/components/auth-layout';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await mockAuthService.requestPasswordReset({
        email: data.email,
      });
      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Reset Password"
      description="We'll send you a link to reset your password"
      footer={
        <>
          Remember your password?{' '}
          <InlineLink href="/sign-in">Sign in</InlineLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorMessage && (
          <FormAlert type="error" title="Request failed" message={errorMessage} />
        )}
        {successMessage && (
          <FormAlert type="info" title="Check your email" message={successMessage} />
        )}

        <FormField
          label="Work Email"
          {...register('email')}
          registration={register('email')}
          error={errors.email?.message}
          type="email"
          placeholder="jane@clinic.ca"
          autoComplete="email"
          required
        />

        <p className="text-sm text-slate-600">
          Enter the email address associated with your account. If an account is found, you'll receive a password reset link within a few minutes.
        </p>

        <SubmitButton isLoading={isLoading} loadingText="Sending reset link...">
          Send Reset Link
        </SubmitButton>
      </form>

      <p className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        This is a password reset request demonstration. In the real system, your email would be verified before sending any reset instructions.
      </p>
    </AuthLayout>
  );
}
