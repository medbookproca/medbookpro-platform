'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormField, PasswordField, SubmitButton, FormAlert, AuthDivider } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { signInSchema, type SignInInput } from '@medbookpro/shared';
import { mockAuthService } from '@/lib/auth/mock-auth-service';
import { AuthLayout } from '@/components/auth-layout';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await mockAuthService.signIn({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
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
      heading="Sign In"
      description="Access your MedBookPro clinic account"
      footer={
        <>
          Don't have an account?{' '}
          <InlineLink href="/sign-up">Create one</InlineLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorMessage && (
          <FormAlert type="error" title="Sign in failed" message={errorMessage} />
        )}
        {successMessage && (
          <FormAlert type="success" title="Sign in successful" message={successMessage} />
        )}

        <FormField
          label="Work Email"
          {...register('email')}
          registration={register('email')}
          error={errors.email?.message}
          type="email"
          placeholder="you@clinic.ca"
          autoComplete="email"
          required
        />

        <PasswordField
          label="Password"
          {...register('password')}
          registration={register('password')}
          error={errors.password?.message}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-slate-700">Remember me</span>
          </label>
          <InlineLink href="/forgot-password" variant="subtle">
            Forgot password?
          </InlineLink>
        </div>

        <SubmitButton isLoading={isLoading} loadingText="Signing in...">
          Sign In
        </SubmitButton>
      </form>

      <AuthDivider text="or" className="my-6" />

      <p className="text-center text-sm text-slate-600">
        Not ready to sign in?{' '}
        <InlineLink href="/" variant="subtle">
          Explore the platform
        </InlineLink>
      </p>
    </AuthLayout>
  );
}
