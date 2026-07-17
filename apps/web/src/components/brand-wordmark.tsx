'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

interface BrandWordmarkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
};

export function BrandWordmark({ href = '/', size = 'md', className = '', ...props }: BrandWordmarkProps) {
  const content = (
    <span className={`${sizeClasses[size]} text-blue-700 uppercase tracking-tight ${className}`} {...props}>
      MedBookPro
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1">
        {content}
      </Link>
    );
  }

  return content;
}
