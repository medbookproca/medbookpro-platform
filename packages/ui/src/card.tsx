import type { HTMLAttributes } from 'react';
export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) { return <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} {...props}>{children}</section>; }
