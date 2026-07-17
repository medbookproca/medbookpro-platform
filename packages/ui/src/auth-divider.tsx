'use client';

import type { HTMLAttributes } from 'react';

interface AuthDividerProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function AuthDivider({ text, className = '', ...props }: AuthDividerProps) {
  if (!text) {
    return (
      <div className={`border-t border-slate-300 ${className}`} {...props} />
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`} {...props}>
      <div className="flex-1 border-t border-slate-300" />
      <span className="text-sm text-slate-600">{text}</span>
      <div className="flex-1 border-t border-slate-300" />
    </div>
  );
}
