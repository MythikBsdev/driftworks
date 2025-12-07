create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'invoice_status'
      and n.nspname = 'public'
  ) then
    create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
  end if;
end
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  category text not null default 'Normal',
  description text,
  price numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  percentage numeric not null check (percentage >= 0 and percentage <= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  role text not null,
  rate numeric not null check (rate >= 0 and rate <= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  cid text,
  invoice_number text not null unique,
  loyalty_action text not null default 'none',
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders(id) on delete cascade,
  item_name text not null,
  catalog_item_id uuid references public.inventory_items(id),
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0
);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  cid text not null,
  stamp_count integer not null default 0 check (stamp_count >= 0),
  total_stamps integer not null default 0 check (total_stamps >= 0),
  total_redemptions integer not null default 0 check (total_redemptions >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, cid)
);

create table if not exists public.employee_sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
  employee_id uuid not null references public.app_users(id) on delete cascade,
  invoice_number text not null,
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discord_purchases (
  id uuid primary key default gen_random_uuid(),
  guild_id text,
  channel_id text,
  message_id text,
  user_id text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id) on delete cascade,
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
  owner_id uuid not null references public.app_users(id) on delete cascade,
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

drop trigger if exists set_timestamp_app_users on public.app_users;
create trigger set_timestamp_app_users
  before update on public.app_users
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_inventory on public.inventory_items;
create trigger set_timestamp_inventory
  before update on public.inventory_items
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_discounts on public.discounts;
create trigger set_timestamp_discounts
  before update on public.discounts
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_commissions on public.commission_rates;
create trigger set_timestamp_commissions
  before update on public.commission_rates
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_sales_orders on public.sales_orders;
create trigger set_timestamp_sales_orders
  before update on public.sales_orders
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_clients on public.clients;
create trigger set_timestamp_clients
  before update on public.clients
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_invoices on public.invoices;
create trigger set_timestamp_invoices
  before update on public.invoices
  for each row
  execute procedure public.handle_updated_at();

drop trigger if exists set_timestamp_loyalty_accounts on public.loyalty_accounts;
create trigger set_timestamp_loyalty_accounts
  before update on public.loyalty_accounts
  for each row
  execute procedure public.handle_updated_at();

comment on table public.app_users is 'Application accounts managed within Driftworks';
comment on table public.user_sessions is 'Session tokens for Driftworks dashboard users';
comment on table public.inventory_items is 'Inventory of products and services available for sale';
comment on table public.discounts is 'Percentage based discounts available during checkout';
comment on table public.commission_rates is 'Commission rate per user role';
comment on table public.sales_orders is 'Completed sales register orders';
comment on table public.sales_order_items is 'Line items associated with sales orders';
comment on table public.employee_sales is 'Sales recorded against individual employees';
comment on table public.discord_purchases is 'Purchases recorded from Discord !buy command';
comment on table public.clients is 'Client records managed by a Driftworks account';
comment on table public.invoices is 'Invoices issued to clients';
comment on table public.invoice_items is 'Invoice line items';
comment on table public.loyalty_accounts is 'Loyalty stamp balances per customer CID';
