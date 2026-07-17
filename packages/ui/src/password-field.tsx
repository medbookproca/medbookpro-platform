'use client';

import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { FieldValues, Path, UseFormRegisterReturn } from 'react-hook-form';

interface PasswordFieldProps<T extends FieldValues> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> {
  label: string;
  name: Path<T>;
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
}

export function PasswordField<T extends FieldValues>({
  label,
  registration,
  error,
  required = false,
  ...inputProps
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = `field-${registration.name}`;

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-900">
        {label}
        {required && <span className="ml-1 text-red-600" aria-label="required">*</span>}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={showPassword ? 'text' : 'password'}
          {...registration}
          {...inputProps}
          aria-invalid={!!error}
          aria-describedby={error ? `error-${registration.name}` : undefined}
          className={`w-full rounded-lg border px-4 py-2.5 pr-12 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 ${
            error
              ? 'border-red-500 bg-red-50 text-slate-900 placeholder-red-400'
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
          } disabled:bg-slate-100 disabled:text-slate-500`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <span className="text-lg">👁️‍🗨️</span>
          ) : (
            <span className="text-lg">👁️</span>
          )}
        </button>
      </div>
      {error && (
        <p id={`error-${registration.name}`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
