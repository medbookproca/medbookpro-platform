'use client';

import { useFormStatus } from 'react-dom';

export function PendingSubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-700 px-4 py-2 font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? pendingText : children}
    </button>
  );
}
