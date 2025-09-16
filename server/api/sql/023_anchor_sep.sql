-- 023_anchor_sep.sql
-- Tabelas mínimas para SEP-10/12/24 sem depender de "users"

create table if not exists anchors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  transfer_server_url text not null,
  auth_url text not null,
  kyc_server_url text not null,
  asset_code text not null,
  asset_issuer text not null,
  created_at timestamptz default now()
);

create table if not exists anchor_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  anchor_id uuid not null references anchors(id),
  account_g text not null,                       -- G...
  challenge_xdr text not null,
  jwt text,
  status text not null default 'started',        -- started|ok|error
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_anchor_auth_sessions_account on anchor_auth_sessions(account_g);

create table if not exists anchor_kyc (
  id uuid primary key default gen_random_uuid(),
  anchor_id uuid not null references anchors(id),
  account_g text not null unique,
  kyc_status text not null default 'unknown',    -- unknown|pending|approved|denied|more_info
  required_fields jsonb default '{}'::jsonb,
  last_synced_at timestamptz
);

create table if not exists anchor_transactions (
  id uuid primary key default gen_random_uuid(),
  anchor_id uuid not null references anchors(id),
  account_g text not null,                       -- G... do cliente
  kind text not null check (kind in ('deposit','withdraw')),
  external_id text unique,                       -- id do Anchor (idempotência)
  interactive_url text,
  status text not null default 'incomplete',     -- SEP-24 statuses
  amount_in_units bigint,
  amount_out_units bigint,
  asset_code text not null,
  asset_issuer text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_anchor_tx_account on anchor_transactions(account_g);
create index if not exists idx_anchor_tx_status on anchor_transactions(status);

-- helpers
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_touch_anchor_auth_sessions on anchor_auth_sessions;
create trigger trg_touch_anchor_auth_sessions
before update on anchor_auth_sessions
for each row execute function touch_updated_at();

drop trigger if exists trg_touch_anchor_transactions on anchor_transactions;
create trigger trg_touch_anchor_transactions
before update on anchor_transactions
for each row execute function touch_updated_at();
