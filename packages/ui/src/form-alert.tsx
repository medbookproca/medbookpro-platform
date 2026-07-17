'use client';

import type { HTMLAttributes } from 'react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface FormAlertProps extends HTMLAttributes<HTMLDivElement> {
  type: AlertType;
  title?: string;
  message: string;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: '✕',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'ℹ',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: '⚠',
  },
};

export function FormAlert({ type, title, message, className = '', ...props }: FormAlertProps) {
  const style = alertStyles[type];

  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 ${style.bg} ${style.border} ${className}`}
      {...props}
    >
      <div className="flex gap-3">
        <span className={`text-lg font-bold ${style.text}`}>{style.icon}</span>
        <div>
          {title && <p className={`font-medium ${style.text}`}>{title}</p>}
          <p className={`text-sm ${style.text}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
