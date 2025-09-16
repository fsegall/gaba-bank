create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  cpf text,
  kyc_status text not null default 'pending',
  risk_tier text default 'standard',
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  user_id uuid references users(id) on delete cascade,
  asset text not null,
  balance numeric(30,10) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, asset)
);

create table if not exists deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  valor_centavos bigint not null,
  txid text not null,
  psp_ref text,
  status text not null default 'iniciado',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text,
  payload_hash text not null,
  payload_json jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received'
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id text,
  side text not null,
  symbol text not null,
  amount_brl_centavos bigint not null,
  slippage_bps int default 50,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  filled_qty numeric(30,10) default 0
);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  symbol text not null,
  qty numeric(30,10) not null,
  price_brl numeric(30,10) not null,
  pool_price_brl numeric(30,10),
  oracle_price_brl numeric(30,10),
  provider_ref text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  risk text not null,
  autobuy_on_deposit boolean not null default true
);

create table if not exists product_allocations (
  product_id text references products(id) on delete cascade,
  symbol text not null,
  weight numeric(8,6) not null,
  min numeric(8,6),
  max numeric(8,6),
  primary key (product_id, symbol)
);