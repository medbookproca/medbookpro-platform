'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const loading = isLoading || pending;
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
}
