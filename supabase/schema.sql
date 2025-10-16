-- Driftworks invoice system schema
create extension if not exists "pgcrypto";

create type if not exists public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  full_name text,
  username text unique,
  avatar_url text,
  role text default 'admin'
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null,
  due_date date not null,
  status public.invoice_status not null default 'draft',
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger set_timestamp_clients
  before update on public.clients
  for each row
  execute procedure public.handle_updated_at();

create trigger set_timestamp_invoices
  before update on public.invoices
  for each row
  execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Clients select own" on public.clients;
create policy "Clients select own" on public.clients
  for select using (owner_id = auth.uid());

drop policy if exists "Clients mutate own" on public.clients;
create policy "Clients mutate own" on public.clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Invoices select own" on public.invoices;
create policy "Invoices select own" on public.invoices
  for select using (owner_id = auth.uid());

drop policy if exists "Invoices mutate own" on public.invoices;
create policy "Invoices mutate own" on public.invoices
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Invoice items read" on public.invoice_items;
create policy "Invoice items read" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.owner_id = auth.uid()
    )
  );

drop policy if exists "Invoice items mutate" on public.invoice_items;
create policy "Invoice items mutate" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.owner_id = auth.uid()
    )
  );

comment on table public.profiles is 'Profile information for Driftworks users';
comment on table public.clients is 'Client records managed by a Driftworks account';
comment on table public.invoices is 'Invoices issued to clients';
comment on table public.invoice_items is 'Invoice line items';