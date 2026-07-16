'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { PasswordField, SubmitButton, FormAlert, PasswordRequirements } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { resetPasswordSchema, type ResetPasswordInput } from '@medbookpro/shared';
import { mockAuthService } from '@/lib/auth/mock-auth-service';
import { AuthLayout } from '@/components/auth-layout';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await mockAuthService.resetPassword({
        password: data.password,
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
      heading="Create New Password"
      description="Enter a strong password to regain access to your account"
      footer={
        <>
          Back to{' '}
          <InlineLink href="/sign-in">sign in</InlineLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorMessage && (
          <FormAlert type="error" title="Password reset failed" message={errorMessage} />
        )}
        {successMessage && (
          <FormAlert type="success" title="Password reset successful" message={successMessage} />
        )}

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p>
            <strong>This is a mock page.</strong> In a real implementation, a secure reset token from your email link would be validated server-side before allowing a password change.
          </p>
        </div>

        <PasswordField
          label="New Password"
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

        <SubmitButton isLoading={isLoading} loadingText="Resetting password...">
          Reset Password
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}
