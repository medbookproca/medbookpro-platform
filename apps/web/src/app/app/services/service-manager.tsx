'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlert } from '@medbookpro/ui';
import { PendingSubmitButton } from '@/components/pending-submit-button';
import {
  archiveServiceAction,
  createServiceAction,
  updateServiceAction,
  type ServiceActionResult,
} from './actions';

const initial: ServiceActionResult = {};
const inputClass = 'mt-1 w-full rounded border border-slate-300 px-3 py-2';

function Feedback({ state }: { state: ServiceActionResult }) {
  return state.error ? (
    <FormAlert
      type="error"
      title="Service action failed"
      message={state.error}
    />
  ) : state.success ? (
    <FormAlert type="success" message={state.success} />
  ) : null;
}

export function CreateServiceForm() {
  const router = useRouter();
  const [state, action] = useActionState<ServiceActionResult, FormData>(
    (_, formData) => createServiceAction(formData),
    initial,
  );
  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <label className="block text-sm font-medium">
        Name
        <input name="name" required maxLength={200} className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          maxLength={2000}
          rows={3}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        Display order
        <input
          name="displayOrder"
          type="number"
          min="0"
          defaultValue="0"
          className={inputClass}
        />
      </label>
      <PendingSubmitButton pendingText="Creating service...">
        Create service
      </PendingSubmitButton>
    </form>
  );
}

function ServiceRow({
  service,
}: {
  service: {
    id: string;
    name: string;
    description: string | null;
    display_order: number;
    status: string;
  };
}) {
  const router = useRouter();
  const [updateState, updateAction] = useActionState<
    ServiceActionResult,
    FormData
  >((_, formData) => updateServiceAction(formData), initial);
  const [archiveState, archiveAction] = useActionState<
    ServiceActionResult,
    FormData
  >((_, formData) => archiveServiceAction(formData), initial);
  useEffect(() => {
    if (updateState.success || archiveState.success) router.refresh();
  }, [archiveState.success, router, updateState.success]);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <form
        action={updateAction}
        className="grid gap-4 md:grid-cols-[1fr_1.5fr_8rem_auto] md:items-end"
      >
        <input type="hidden" name="serviceId" value={service.id} />
        <label className="text-sm font-medium">
          Name
          <input
            name="name"
            defaultValue={service.name}
            required
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Description
          <input
            name="description"
            defaultValue={service.description ?? ''}
            maxLength={2000}
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium">
          Order
          <input
            name="displayOrder"
            type="number"
            min="0"
            defaultValue={service.display_order}
            className={inputClass}
          />
        </label>
        <PendingSubmitButton pendingText="Saving...">Save</PendingSubmitButton>
      </form>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {service.status}
        </span>
        {service.status === 'active' ? (
          <form action={archiveAction}>
            <input type="hidden" name="serviceId" value={service.id} />
            <PendingSubmitButton pendingText="Archiving...">
              Archive
            </PendingSubmitButton>
          </form>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <Feedback state={updateState} />
        <Feedback state={archiveState} />
      </div>
    </article>
  );
}

export function ServiceManager({
  services,
}: {
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    display_order: number;
    status: string;
  }>;
}) {
  return (
    <div className="space-y-4">
      {services.map((service) => (
        <ServiceRow key={service.id} service={service} />
      ))}
    </div>
  );
}
