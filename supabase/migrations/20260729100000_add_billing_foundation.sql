insert into public.permissions (key, domain, action, description)
values
  ('billing.create', 'billing', 'create', 'Create draft invoices and payment records'),
  ('billing.update', 'billing', 'update', 'Update draft invoices'),
  ('billing.issue', 'billing', 'issue', 'Issue, cancel, and void invoices'),
  ('billing.record_payment', 'billing', 'record_payment', 'Record and allocate payments'),
  ('billing.manage_settings', 'billing', 'manage_settings', 'Manage tax profiles and discount rules')
on conflict (key) do update set description = excluded.description, status = 'active';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('organization.admin', 'clinic.admin') and r.organization_id is null
  and p.key in ('billing.read', 'billing.create', 'billing.update', 'billing.issue', 'billing.record_payment', 'billing.manage_settings')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'billing.specialist' and r.organization_id is null
  and p.key in ('billing.read', 'billing.create', 'billing.update', 'billing.issue', 'billing.record_payment', 'billing.manage_settings')
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key = 'receptionist' and r.organization_id is null
  and p.key in ('billing.read', 'billing.create', 'billing.record_payment')
on conflict do nothing;

create table public.billing_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references public.organizations(id) on delete cascade,
  legal_name text, address text, currency text not null default 'CAD' check (currency in ('CAD', 'USD')), invoice_prefix text not null default 'INV' check (invoice_prefix ~ '^[A-Z0-9-]{1,12}$'),
  payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 365), default_tax_profile_id uuid, created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table public.tax_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120), jurisdiction text not null default 'CA', rates jsonb not null default '[]'::jsonb check (jsonb_typeof(rates) = 'array'), is_default boolean not null default false, status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique (id, organization_id)
);
alter table public.billing_profiles add constraint billing_profiles_tax_profile_fk foreign key (default_tax_profile_id, organization_id) references public.tax_profiles(id, organization_id) on delete set null;

create table public.discount_rules (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120), discount_type text not null check (discount_type in ('fixed', 'percentage')), value numeric(12, 2) not null check (value > 0), currency text not null default 'CAD', status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique (id, organization_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, invoice_number text not null,
  patient_id uuid not null, appointment_id uuid, encounter_id uuid, currency text not null default 'CAD', status text not null default 'draft' check (status in ('draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'void', 'overdue')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0), tax numeric(12, 2) not null default 0 check (tax >= 0), discount numeric(12, 2) not null default 0 check (discount >= 0), total numeric(12, 2) not null default 0 check (total >= 0), balance numeric(12, 2) not null default 0 check (balance >= 0), due_date date,
  notes text, issued_at timestamptz, cancelled_at timestamptz, voided_at timestamptz, created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint billing_invoices_id_organization_unique unique (id, organization_id), constraint billing_invoices_number_unique unique (organization_id, invoice_number),
  constraint invoices_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict,
  constraint invoices_appointment_fk foreign key (appointment_id, organization_id) references public.appointments(id, organization_id) on delete set null,
  constraint billing_invoices_encounter_fk foreign key (encounter_id, organization_id) references public.encounters(id, organization_id) on delete set null,
  constraint billing_invoices_total_check check (total = greatest(subtotal + tax - discount, 0)), constraint billing_invoices_balance_check check (balance <= total)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, invoice_id uuid not null, description text not null check (char_length(btrim(description)) between 1 and 500), quantity numeric(12, 2) not null check (quantity > 0), unit_price numeric(12, 2) not null check (unit_price >= 0), tax_rate numeric(7, 4) not null default 0 check (tax_rate between 0 and 100), discount numeric(12, 2) not null default 0 check (discount >= 0), line_total numeric(12, 2) not null check (line_total >= 0), created_at timestamptz not null default timezone('utc', now()),
  constraint invoice_items_invoice_fk foreign key (invoice_id, organization_id) references public.invoices(id, organization_id) on delete cascade
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, patient_id uuid not null, method text not null check (method in ('cash', 'card_placeholder', 'e_transfer_placeholder', 'insurance_placeholder', 'manual_adjustment')), reference text, amount numeric(12, 2) not null check (amount > 0), currency text not null default 'CAD', status text not null default 'completed' check (status in ('pending', 'completed', 'voided', 'refunded')), received_at timestamptz not null default timezone('utc', now()), provider text not null default 'mock', notes text, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), constraint payments_id_organization_unique unique (id, organization_id), constraint payments_patient_fk foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete restrict
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, payment_id uuid not null, invoice_id uuid not null, amount numeric(12, 2) not null check (amount > 0), allocated_at timestamptz not null default timezone('utc', now()), allocated_by uuid references public.profiles(id) on delete set null,
  constraint payment_allocations_payment_fk foreign key (payment_id, organization_id) references public.payments(id, organization_id) on delete cascade, constraint payment_allocations_invoice_fk foreign key (invoice_id, organization_id) references public.invoices(id, organization_id) on delete restrict, unique (payment_id, invoice_id)
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, credit_note_number text not null, invoice_id uuid not null, amount numeric(12, 2) not null check (amount > 0), kind text not null check (kind in ('partial', 'full')), reason text not null check (char_length(btrim(reason)) between 1 and 500), status text not null default 'issued' check (status in ('draft', 'issued', 'void')), issued_at timestamptz, created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), constraint credit_notes_invoice_fk foreign key (invoice_id, organization_id) references public.invoices(id, organization_id) on delete restrict, unique (organization_id, credit_note_number)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, receipt_number text not null, payment_id uuid not null, issued_at timestamptz not null default timezone('utc', now()), created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()), constraint receipts_payment_fk foreign key (payment_id, organization_id) references public.payments(id, organization_id) on delete restrict, unique (organization_id, receipt_number), unique (payment_id)
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, entity_type text not null, entity_id uuid not null, event_type text not null, metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default timezone('utc', now()), created_by uuid references public.profiles(id) on delete set null
);

create or replace function public.billing_permission(target_organization_id uuid, required_action text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, auth
as $$ select public.has_permission(target_organization_id, 'billing.' || required_action) $$;

create or replace function public.billing_invoice_totals(p_items jsonb, p_discount numeric)
returns table(subtotal numeric, tax numeric, discount numeric, total numeric) language sql immutable
as $$ select round(coalesce(sum((item->>'quantity')::numeric * (item->>'unitPrice')::numeric), 0), 2), round(coalesce(sum((item->>'quantity')::numeric * (item->>'unitPrice')::numeric * coalesce((item->>'taxRate')::numeric, 0) / 100), 0), 2), round(greatest(coalesce(p_discount, 0), 0), 2), round(greatest(coalesce(sum((item->>'quantity')::numeric * (item->>'unitPrice')::numeric), 0) + coalesce(sum((item->>'quantity')::numeric * (item->>'unitPrice')::numeric * coalesce((item->>'taxRate')::numeric, 0) / 100), 0) - greatest(coalesce(p_discount, 0), 0), 0), 2) from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item $$;

create or replace function public.create_invoice(p_organization_id uuid, p_patient_id uuid, p_appointment_id uuid, p_encounter_id uuid, p_currency text, p_due_date date, p_discount numeric, p_notes text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); totals record; invoice_id uuid; invoice_no text; item jsonb; profile public.billing_profiles%rowtype; begin
  if not public.billing_permission(p_organization_id, 'create') then raise exception 'Permission denied'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'At least one invoice item is required'; end if;
  if not exists (select 1 from public.patients where id = p_patient_id and organization_id = p_organization_id) then raise exception 'Patient not found in organization'; end if;
  select * into profile from public.billing_profiles where organization_id = p_organization_id;
  invoice_no := coalesce(profile.invoice_prefix, 'INV') || '-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  select * into totals from public.billing_invoice_totals(p_items, p_discount);
  insert into public.invoices(organization_id, invoice_number, patient_id, appointment_id, encounter_id, currency, subtotal, tax, discount, total, balance, due_date, notes, created_by, updated_by) values (p_organization_id, invoice_no, p_patient_id, p_appointment_id, p_encounter_id, coalesce(p_currency, 'CAD'), totals.subtotal, totals.tax, totals.discount, totals.total, totals.total, p_due_date, p_notes, caller_id, caller_id) returning id into invoice_id;
  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop insert into public.invoice_items(organization_id, invoice_id, description, quantity, unit_price, tax_rate, discount, line_total) values (p_organization_id, invoice_id, item->>'description', (item->>'quantity')::numeric, (item->>'unitPrice')::numeric, coalesce((item->>'taxRate')::numeric, 0), coalesce((item->>'discount')::numeric, 0), round((item->>'quantity')::numeric * (item->>'unitPrice')::numeric, 2)); end loop;
  insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (p_organization_id, 'invoice', invoice_id, 'invoice.created', jsonb_build_object('invoice_number', invoice_no), caller_id);
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.invoice_created', 'invoice', invoice_id, true, jsonb_build_object('invoice_number', invoice_no, 'total', totals.total)); return invoice_id;
end $$;

create or replace function public.update_invoice(p_invoice_id uuid, p_due_date date, p_discount numeric, p_notes text, p_items jsonb)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare invoice_record public.invoices%rowtype; totals record; item jsonb; caller_id uuid := auth.uid(); begin select * into invoice_record from public.invoices where id = p_invoice_id for update; if not found or invoice_record.status <> 'draft' or not public.billing_permission(invoice_record.organization_id, 'update') then raise exception 'Invoice cannot be updated'; end if; if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'At least one invoice item is required'; end if; select * into totals from public.billing_invoice_totals(p_items, p_discount); update public.invoices set due_date = p_due_date, discount = totals.discount, subtotal = totals.subtotal, tax = totals.tax, total = totals.total, balance = totals.total, notes = p_notes, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; delete from public.invoice_items where invoice_id = p_invoice_id; for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop insert into public.invoice_items(organization_id, invoice_id, description, quantity, unit_price, tax_rate, discount, line_total) values (invoice_record.organization_id, p_invoice_id, item->>'description', (item->>'quantity')::numeric, (item->>'unitPrice')::numeric, coalesce((item->>'taxRate')::numeric, 0), coalesce((item->>'discount')::numeric, 0), round((item->>'quantity')::numeric * (item->>'unitPrice')::numeric, 2)); end loop; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invoice_record.organization_id, 'billing.invoice_updated', 'invoice', p_invoice_id, true, '{}'::jsonb); return true; end $$;

create or replace function public.issue_invoice(p_invoice_id uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.invoices%rowtype; caller_id uuid := auth.uid(); begin select * into row_record from public.invoices where id = p_invoice_id for update; if not found or row_record.status <> 'draft' or not public.billing_permission(row_record.organization_id, 'issue') then raise exception 'Invoice cannot be issued'; end if; update public.invoices set status = 'issued', issued_at = timezone('utc', now()), updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; insert into public.billing_events(organization_id, entity_type, entity_id, event_type, created_by) values (row_record.organization_id, 'invoice', p_invoice_id, 'invoice.issued', caller_id); insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'billing.invoice_issued', 'invoice', p_invoice_id, true, '{}'::jsonb); return true; end $$;

create or replace function public.void_invoice(p_invoice_id uuid, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.invoices%rowtype; caller_id uuid := auth.uid(); begin select * into row_record from public.invoices where id = p_invoice_id for update; if not found or row_record.status in ('paid', 'void') or not public.billing_permission(row_record.organization_id, 'issue') then raise exception 'Invoice cannot be voided'; end if; update public.invoices set status = 'void', voided_at = timezone('utc', now()), notes = left(coalesce(notes || ' ', '') || coalesce(p_reason, ''), 2000), updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'billing.invoice_voided', 'invoice', p_invoice_id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500))); return true; end $$;

create or replace function public.cancel_invoice(p_invoice_id uuid, p_reason text default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare row_record public.invoices%rowtype; caller_id uuid := auth.uid(); begin select * into row_record from public.invoices where id = p_invoice_id for update; if not found or row_record.status not in ('draft', 'issued', 'overdue') or not public.billing_permission(row_record.organization_id, 'issue') then raise exception 'Invoice cannot be cancelled'; end if; update public.invoices set status = 'cancelled', cancelled_at = timezone('utc', now()), notes = left(coalesce(notes || ' ', '') || coalesce(p_reason, ''), 2000), updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, row_record.organization_id, 'billing.invoice_cancelled', 'invoice', p_invoice_id, true, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500))); return true; end $$;

create or replace function public.record_payment(p_organization_id uuid, p_patient_id uuid, p_method text, p_amount numeric, p_currency text, p_reference text, p_received_at timestamptz default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); payment_id uuid; begin if not public.billing_permission(p_organization_id, 'record_payment') then raise exception 'Permission denied'; end if; if not exists (select 1 from public.patients where id = p_patient_id and organization_id = p_organization_id) then raise exception 'Patient not found in organization'; end if; insert into public.payments(organization_id, patient_id, method, amount, currency, reference, received_at, notes, created_by) values (p_organization_id, p_patient_id, p_method, p_amount, coalesce(p_currency, 'CAD'), p_reference, coalesce(p_received_at, timezone('utc', now())), p_notes, caller_id) returning id into payment_id; insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (p_organization_id, 'payment', payment_id, 'payment.recorded', jsonb_build_object('amount', p_amount, 'method', p_method, 'provider', 'mock'), caller_id); insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.payment_recorded', 'payment', payment_id, true, jsonb_build_object('amount', p_amount, 'method', p_method)); return payment_id; end $$;

create or replace function public.allocate_payment(p_payment_id uuid, p_invoice_id uuid, p_amount numeric)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare payment_record public.payments%rowtype; invoice_record public.invoices%rowtype; caller_id uuid := auth.uid(); allocated numeric; begin select * into payment_record from public.payments where id = p_payment_id for update; select * into invoice_record from public.invoices where id = p_invoice_id for update; if not found or not public.billing_permission(payment_record.organization_id, 'record_payment') or invoice_record.organization_id <> payment_record.organization_id or payment_record.status <> 'completed' or invoice_record.status in ('cancelled', 'void', 'paid') then raise exception 'Payment allocation is not permitted'; end if; select coalesce(sum(amount), 0) into allocated from public.payment_allocations where payment_id = p_payment_id; if p_amount > payment_record.amount - allocated or p_amount > invoice_record.balance then raise exception 'Allocation exceeds available balance'; end if; insert into public.payment_allocations(organization_id, payment_id, invoice_id, amount, allocated_by) values (payment_record.organization_id, p_payment_id, p_invoice_id, p_amount, caller_id); update public.invoices set balance = balance - p_amount, status = case when balance - p_amount = 0 then 'paid' else 'partially_paid' end, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (payment_record.organization_id, 'payment', p_payment_id, 'payment.allocated', jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount), caller_id); insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, payment_record.organization_id, 'billing.payment_allocated', 'payment', p_payment_id, true, jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount)); return true; end $$;

create or replace function public.create_credit_note(p_invoice_id uuid, p_amount numeric, p_kind text, p_reason text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare invoice_record public.invoices%rowtype; caller_id uuid := auth.uid(); note_id uuid; note_no text; begin select * into invoice_record from public.invoices where id = p_invoice_id for update; if not found or not public.billing_permission(invoice_record.organization_id, 'issue') or p_amount > invoice_record.balance or (p_kind = 'full' and p_amount <> invoice_record.balance) then raise exception 'Credit note is not permitted'; end if; note_no := 'CN-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6); insert into public.credit_notes(organization_id, credit_note_number, invoice_id, amount, kind, reason, issued_at, created_by) values (invoice_record.organization_id, note_no, p_invoice_id, p_amount, p_kind, p_reason, timezone('utc', now()), caller_id) returning id into note_id; update public.invoices set balance = balance - p_amount, status = case when balance - p_amount = 0 then 'paid' else 'partially_paid' end, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id; insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (invoice_record.organization_id, 'credit_note', note_id, 'credit_note.created', jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount), caller_id); insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, invoice_record.organization_id, 'billing.credit_note_created', 'credit_note', note_id, true, jsonb_build_object('amount', p_amount, 'invoice_id', p_invoice_id)); return note_id; end $$;

create or replace function public.generate_receipt(p_payment_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare payment_record public.payments%rowtype; caller_id uuid := auth.uid(); receipt_id uuid; receipt_no text; begin select * into payment_record from public.payments where id = p_payment_id; if not found or payment_record.status <> 'completed' or not public.billing_permission(payment_record.organization_id, 'record_payment') then raise exception 'Receipt cannot be generated'; end if; receipt_no := 'RC-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6); insert into public.receipts(organization_id, receipt_number, payment_id, created_by) values (payment_record.organization_id, receipt_no, p_payment_id, caller_id) returning id into receipt_id; insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (payment_record.organization_id, 'receipt', receipt_id, 'receipt.generated', jsonb_build_object('payment_id', p_payment_id), caller_id); insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, payment_record.organization_id, 'billing.receipt_generated', 'receipt', receipt_id, true, jsonb_build_object('payment_id', p_payment_id)); return receipt_id; end $$;

create or replace function public.update_tax_profile(p_organization_id uuid, p_id uuid, p_name text, p_jurisdiction text, p_rates jsonb, p_is_default boolean, p_status text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); profile_id uuid; begin if not public.billing_permission(p_organization_id, 'manage_settings') then raise exception 'Permission denied'; end if; if p_is_default then update public.tax_profiles set is_default = false where organization_id = p_organization_id; end if; insert into public.tax_profiles(id, organization_id, name, jurisdiction, rates, is_default, status, created_by, updated_by) values (coalesce(p_id, gen_random_uuid()), p_organization_id, p_name, p_jurisdiction, p_rates, p_is_default, p_status, caller_id, caller_id) on conflict (id) do update set name = excluded.name, jurisdiction = excluded.jurisdiction, rates = excluded.rates, is_default = excluded.is_default, status = excluded.status, updated_by = caller_id, updated_at = timezone('utc', now()) returning id into profile_id; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.tax_updated', 'tax_profile', profile_id, true, '{}'::jsonb); return profile_id; end $$;

create or replace function public.update_discount_rules(p_organization_id uuid, p_id uuid, p_name text, p_discount_type text, p_value numeric, p_currency text, p_status text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); rule_id uuid; begin if not public.billing_permission(p_organization_id, 'manage_settings') then raise exception 'Permission denied'; end if; insert into public.discount_rules(id, organization_id, name, discount_type, value, currency, status, created_by, updated_by) values (coalesce(p_id, gen_random_uuid()), p_organization_id, p_name, p_discount_type, p_value, coalesce(p_currency, 'CAD'), p_status, caller_id, caller_id) on conflict (id) do update set name = excluded.name, discount_type = excluded.discount_type, value = excluded.value, currency = excluded.currency, status = excluded.status, updated_by = caller_id, updated_at = timezone('utc', now()) returning id into rule_id; insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.discount_updated', 'discount_rule', rule_id, true, '{}'::jsonb); return rule_id; end $$;

do $$ declare table_name text; begin foreach table_name in array array['billing_profiles', 'tax_profiles', 'discount_rules', 'invoices', 'invoice_items', 'payments', 'payment_allocations', 'credit_notes', 'receipts', 'billing_events'] loop execute format('alter table public.%I enable row level security', table_name); execute format('grant select on public.%I to authenticated', table_name); execute format('create policy %I on public.%I for select to authenticated using (public.billing_permission(organization_id, ''read''))', table_name || '_read', table_name); execute format('create policy %I on public.%I for all to authenticated using (false) with check (false)', table_name || '_writes_denied', table_name); end loop; end $$;

grant execute on function public.billing_permission(uuid, text) to authenticated;
grant execute on function public.billing_invoice_totals(jsonb, numeric) to authenticated;
grant execute on function public.create_invoice(uuid, uuid, uuid, uuid, text, date, numeric, text, jsonb) to authenticated;
grant execute on function public.update_invoice(uuid, date, numeric, text, jsonb) to authenticated;
grant execute on function public.issue_invoice(uuid) to authenticated;
grant execute on function public.void_invoice(uuid, text) to authenticated;
grant execute on function public.cancel_invoice(uuid, text) to authenticated;
grant execute on function public.record_payment(uuid, uuid, text, numeric, text, text, timestamptz, text) to authenticated;
grant execute on function public.allocate_payment(uuid, uuid, numeric) to authenticated;
grant execute on function public.create_credit_note(uuid, numeric, text, text) to authenticated;
grant execute on function public.generate_receipt(uuid) to authenticated;
grant execute on function public.update_tax_profile(uuid, uuid, text, text, jsonb, boolean, text) to authenticated;
grant execute on function public.update_discount_rules(uuid, uuid, text, text, numeric, text, text) to authenticated;

create trigger billing_profiles_set_updated_at before update on public.billing_profiles for each row execute function public.set_updated_at();
create trigger tax_profiles_set_updated_at before update on public.tax_profiles for each row execute function public.set_updated_at();
create trigger discount_rules_set_updated_at before update on public.discount_rules for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();

create or replace function public.allocate_payment(p_payment_id uuid, p_invoice_id uuid, p_amount numeric)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare payment_record public.payments%rowtype; invoice_record public.invoices%rowtype; caller_id uuid := auth.uid(); allocated numeric;
begin
  select * into payment_record from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment allocation is not permitted'; end if;
  select * into invoice_record from public.invoices where id = p_invoice_id for update;
  if not found or not public.billing_permission(payment_record.organization_id, 'record_payment') or invoice_record.organization_id <> payment_record.organization_id or payment_record.status <> 'completed' or invoice_record.status in ('cancelled', 'void', 'paid') then raise exception 'Payment allocation is not permitted'; end if;
  select coalesce(sum(amount), 0) into allocated from public.payment_allocations where payment_id = p_payment_id;
  if p_amount > payment_record.amount - allocated or p_amount > invoice_record.balance then raise exception 'Allocation exceeds available balance'; end if;
  insert into public.payment_allocations(organization_id, payment_id, invoice_id, amount, allocated_by) values (payment_record.organization_id, p_payment_id, p_invoice_id, p_amount, caller_id);
  update public.invoices set balance = balance - p_amount, status = case when balance - p_amount = 0 then 'paid' else 'partially_paid' end, updated_by = caller_id, updated_at = timezone('utc', now()) where id = p_invoice_id;
  insert into public.billing_events(organization_id, entity_type, entity_id, event_type, metadata, created_by) values (payment_record.organization_id, 'payment', p_payment_id, 'payment.allocated', jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount), caller_id);
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, payment_record.organization_id, 'billing.payment_allocated', 'payment', p_payment_id, true, jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount)); return true;
end $$;

create or replace function public.update_tax_profile(p_organization_id uuid, p_id uuid, p_name text, p_jurisdiction text, p_rates jsonb, p_is_default boolean, p_status text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); profile_id uuid;
begin
  if not public.billing_permission(p_organization_id, 'manage_settings') then raise exception 'Permission denied'; end if;
  if p_id is not null and exists (select 1 from public.tax_profiles where id = p_id and organization_id <> p_organization_id) then raise exception 'Tax profile belongs to another organization'; end if;
  if p_is_default then update public.tax_profiles set is_default = false where organization_id = p_organization_id; end if;
  insert into public.tax_profiles(id, organization_id, name, jurisdiction, rates, is_default, status, created_by, updated_by) values (coalesce(p_id, gen_random_uuid()), p_organization_id, p_name, p_jurisdiction, p_rates, p_is_default, p_status, caller_id, caller_id)
  on conflict (id) do update set name = excluded.name, jurisdiction = excluded.jurisdiction, rates = excluded.rates, is_default = excluded.is_default, status = excluded.status, updated_by = caller_id, updated_at = timezone('utc', now()) returning id into profile_id;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.tax_updated', 'tax_profile', profile_id, true, '{}'::jsonb); return profile_id;
end $$;

create or replace function public.update_discount_rules(p_organization_id uuid, p_id uuid, p_name text, p_discount_type text, p_value numeric, p_currency text, p_status text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public, auth
as $$ declare caller_id uuid := auth.uid(); rule_id uuid;
begin
  if not public.billing_permission(p_organization_id, 'manage_settings') then raise exception 'Permission denied'; end if;
  if p_id is not null and exists (select 1 from public.discount_rules where id = p_id and organization_id <> p_organization_id) then raise exception 'Discount rule belongs to another organization'; end if;
  insert into public.discount_rules(id, organization_id, name, discount_type, value, currency, status, created_by, updated_by) values (coalesce(p_id, gen_random_uuid()), p_organization_id, p_name, p_discount_type, p_value, coalesce(p_currency, 'CAD'), p_status, caller_id, caller_id)
  on conflict (id) do update set name = excluded.name, discount_type = excluded.discount_type, value = excluded.value, currency = excluded.currency, status = excluded.status, updated_by = caller_id, updated_at = timezone('utc', now()) returning id into rule_id;
  insert into public.audit_events(actor_profile_id, organization_id, action, entity_type, entity_id, security_event, metadata) values (caller_id, p_organization_id, 'billing.discount_updated', 'discount_rule', rule_id, true, '{}'::jsonb); return rule_id;
end $$;
