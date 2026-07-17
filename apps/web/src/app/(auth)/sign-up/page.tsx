'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormField, PasswordField, SubmitButton, FormAlert, PasswordRequirements } from '@medbookpro/ui';
import { InlineLink } from '@/components/inline-link';
import { signUpSchema, type SignUpInput } from '@medbookpro/shared';
import { mockAuthService } from '@/lib/auth/mock-auth-service';
import { AuthLayout } from '@/components/auth-layout';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await mockAuthService.signUp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
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
      heading="Create Account"
      description="Set up your MedBookPro clinic account"
      footer={
        <>
          Already have an account?{' '}
          <InlineLink href="/sign-in">Sign in</InlineLink>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorMessage && (
          <FormAlert type="error" title="Account creation failed" message={errorMessage} />
        )}
        {successMessage && (
          <FormAlert type="success" title="Account created" message={successMessage} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('agreeToTerms')}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            I agree to the{' '}
            <InlineLink href="/terms" variant="default">
              terms of service
            </InlineLink>{' '}
            and{' '}
            <InlineLink href="/privacy" variant="default">
              privacy policy
            </InlineLink>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
        )}

        <SubmitButton isLoading={isLoading} loadingText="Creating account...">
          Create Account
        </SubmitButton>
      </form>

      <p className="mt-6 border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
        MedBookPro does not request patient information during account creation. Clinic access will be controlled by your organization membership.
      </p>
    </AuthLayout>
  );
}
