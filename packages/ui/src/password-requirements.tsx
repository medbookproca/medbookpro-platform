'use client';

import { PASSWORD_MIN_LENGTH } from '@medbookpro/shared';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  const requirements = [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { label: 'At least one number', met: /\d/.test(password) },
    { label: 'At least one symbol (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  return (
    <div className={`space-y-2 rounded-lg bg-slate-50 p-4 ${className}`}>
      <p className="text-sm font-medium text-slate-900">Password requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-sm">
            <span className={req.met ? 'text-green-600' : 'text-slate-400'}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-slate-900' : 'text-slate-600'}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
