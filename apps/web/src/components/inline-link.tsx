'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

interface InlineLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'default' | 'subtle';
}

export function InlineLink({ href, variant = 'default', children, className = '', ...props }: InlineLinkProps) {
  const variantClasses = {
    default: 'text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded',
    subtle: 'text-slate-600 hover:text-slate-900 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded',
  };

  return (
    <Link href={href} className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
