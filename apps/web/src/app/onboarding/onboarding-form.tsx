'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, FormAlert, FormField, SubmitButton } from '@medbookpro/ui';
import { onboardingFormSchema, type OnboardingFormInput } from '@medbookpro/shared';
import { createOrganizationOnboarding } from './actions';

const inputClassName = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100';

export default function OnboardingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID().replaceAll('-', ''));
  const { register, handleSubmit, watch, formState: { errors } } = useForm<OnboardingFormInput>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: { organization: { countryCode: 'CA', timezone: 'America/Edmonton', currency: 'CAD', locale: 'en-CA' }, location: { locationType: 'physical', countryCode: 'CA', timezone: 'America/Edmonton', publicBookingEnabled: false } },
  });
  const locationType = watch('location.locationType');
  const physicalAddressRequired = useMemo(() => locationType === 'physical', [locationType]);

  const onSubmit = async (data: OnboardingFormInput) => {
    setIsLoading(true);
    setServerError(null);
    const result = await createOrganizationOnboarding({ ...data, idempotencyKey });
    if (!result.ok) setServerError(result.message);
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MedBookPro</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Set up your organization</h1>
        <p className="mt-2 text-slate-600">Create your organization and first operating location to continue.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {serverError && <FormAlert type="error" title="Onboarding could not be completed" message={serverError} />}
          <Card>
            <h2 className="text-xl font-semibold">Organization</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField name="organization.legalName" label="Legal name" registration={register('organization.legalName')} error={errors.organization?.legalName?.message} required autoComplete="organization" />
              <FormField name="organization.displayName" label="Operating name" registration={register('organization.displayName')} error={errors.organization?.displayName?.message} required autoComplete="organization" />
              <FormField name="organization.countryCode" label="Country code" registration={register('organization.countryCode')} error={errors.organization?.countryCode?.message} required maxLength={2} />
              <FormField name="organization.timezone" label="Default timezone" registration={register('organization.timezone')} error={errors.organization?.timezone?.message} required />
              <FormField name="organization.currency" label="Currency" registration={register('organization.currency')} error={errors.organization?.currency?.message} required maxLength={3} />
              <FormField name="organization.locale" label="Locale" registration={register('organization.locale')} error={errors.organization?.locale?.message} required />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">First location</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField name="location.name" label="Location name" registration={register('location.name')} error={errors.location?.name?.message} required autoComplete="organization" />
              <FormField name="location.code" label="Location code" registration={register('location.code')} error={errors.location?.code?.message} helpText="Optional internal code." />
              <label className="space-y-2 text-sm font-medium text-slate-900">Location type<select {...register('location.locationType')} className={inputClassName}><option value="physical">Physical</option><option value="virtual">Virtual</option></select></label>
              <FormField name="location.timezone" label="Timezone" registration={register('location.timezone')} error={errors.location?.timezone?.message} required />
              <FormField name="location.addressLine1" label="Address line 1" registration={register('location.addressLine1')} error={errors.location?.addressLine1?.message} required={physicalAddressRequired} autoComplete="street-address" />
              <FormField name="location.addressLine2" label="Address line 2" registration={register('location.addressLine2')} error={errors.location?.addressLine2?.message} autoComplete="address-line2" />
              <FormField name="location.city" label="City" registration={register('location.city')} error={errors.location?.city?.message} autoComplete="address-level2" />
              <FormField name="location.provinceOrState" label="Province or state" registration={register('location.provinceOrState')} error={errors.location?.provinceOrState?.message} autoComplete="address-level1" />
              <FormField name="location.postalCode" label="Postal code" registration={register('location.postalCode')} error={errors.location?.postalCode?.message} autoComplete="postal-code" />
              <FormField name="location.countryCode" label="Country code" registration={register('location.countryCode')} error={errors.location?.countryCode?.message} required maxLength={2} />
              <FormField name="location.phone" label="Phone" registration={register('location.phone')} error={errors.location?.phone?.message} type="tel" autoComplete="tel" />
              <FormField name="location.email" label="Email" registration={register('location.email')} error={errors.location?.email?.message} type="email" autoComplete="email" />
            </div>
          </Card>
          <SubmitButton isLoading={isLoading} loadingText="Creating organization...">Create organization and continue</SubmitButton>
        </form>
      </div>
    </main>
  );
}
