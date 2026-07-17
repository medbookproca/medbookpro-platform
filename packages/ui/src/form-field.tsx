'use client';

import type { InputHTMLAttributes } from 'react';
import type { FieldValues, Path, UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string;
  name: Path<T>;
  registration: UseFormRegisterReturn;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export function FormField<T extends FieldValues>({
  label,
  registration,
  error,
  helpText,
  required = false,
  ...inputProps
}: FormFieldProps<T>) {
  const fieldId = `field-${registration.name}`;

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-900">
        {label}
        {required && <span className="ml-1 text-red-600" aria-label="required">*</span>}
      </label>
      <input
        id={fieldId}
        {...registration}
        {...inputProps}
        aria-invalid={!!error}
        aria-describedby={error ? `error-${registration.name}` : helpText ? `help-${registration.name}` : undefined}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${
          error
            ? 'border-red-500 bg-red-50 text-slate-900 placeholder-red-400'
            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
        } disabled:bg-slate-100 disabled:text-slate-500`}
      />
      {error && (
        <p id={`error-${registration.name}`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      {!error && helpText && (
        <p id={`help-${registration.name}`} className="text-sm text-slate-600">
          {helpText}
        </p>
      )}
    </div>
  );
}
