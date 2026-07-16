'use client';

import type { HTMLAttributes } from 'react';

interface LoadingIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingIndicator({ size = 'md', text, className = '', ...props }: LoadingIndicatorProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} {...props}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-300 border-t-blue-600`} aria-hidden="true" />
      {text && <span className="text-sm text-slate-600">{text}</span>}
    </div>
  );
}
