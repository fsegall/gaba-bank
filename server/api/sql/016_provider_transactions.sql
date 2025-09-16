-- 016_provider_transactions.sql
-- Tabela e funções para transações de provedores (Inter/Circle/Anchor)
-- Idempotência por (provider, external_id) + função upsert

-- Extensão UUID (pgcrypto)
create extension if not exists pgcrypto;

-- Enum de status (started|pending|completed|failed)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'provider_tx_status') then
    create type provider_tx_status as enum ('started','pending','completed','failed');
  end if;
end$$;

-- Função updated_at (idempotente)
create or replace function set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

-- Tabela principal
create table if not exists public.provider_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null check (provider in ('inter','circle','anchor')),
  kind text not null check (kind in ('deposit','withdraw')),
  external_id text not null,
  status provider_tx_status not null default 'started',
  amount_in_units bigint,
  amount_out_units bigint,
  asset_code text not null,
  asset_issuer text,
  interactive_url text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (provider, external_id)
);

-- Trigger updated_at (só cria se não existir)
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_provider_transactions_updated_at'
  ) then
    create trigger trg_provider_transactions_updated_at
      before update on public.provider_transactions
      for each row execute function set_updated_at();
  end if;
end$$;

-- Índices úteis
create index if not exists idx_provider_tx_user_created_at
  on public.provider_transactions (user_id, created_at desc);

create index if not exists idx_provider_tx_status
  on public.provider_transactions (status);

create index if not exists idx_provider_tx_kind
  on public.provider_transactions (kind);

create index if not exists idx_provider_tx_asset
  on public.provider_transactions (asset_code);

-- Upsert idempotente para webhooks e reprocessos
create or replace function public.upsert_provider_tx(
  p_provider text,
  p_kind text,
  p_external_id text,
  p_status provider_tx_status,
  p_user_id uuid default null,
  p_amount_in_units bigint default null,
  p_amount_out_units bigint default null,
  p_asset_code text default null,
  p_asset_issuer text default null,
  p_interactive_url text default null,
  p_metadata jsonb default null
) returns uuid
language plpgsql
as $body$
declare
  v_id uuid;
begin
  insert into public.provider_transactions (
    user_id, provider, kind, external_id, status,
    amount_in_units, amount_out_units,
    asset_code, asset_issuer, interactive_url, metadata
  ) values (
    p_user_id, p_provider, p_kind, p_external_id, p_status,
    p_amount_in_units, p_amount_out_units,
    coalesce(p_asset_code, 'BRL'), p_asset_issuer, p_interactive_url, p_metadata
  )
  on conflict (provider, external_id) do update
    set status          = excluded.status,
        amount_in_units = coalesce(excluded.amount_in_units, public.provider_transactions.amount_in_units),
        amount_out_units= coalesce(excluded.amount_out_units, public.provider_transactions.amount_out_units),
        asset_code      = coalesce(excluded.asset_code, public.provider_transactions.asset_code),
        asset_issuer    = coalesce(excluded.asset_issuer, public.provider_transactions.asset_issuer),
        interactive_url = coalesce(excluded.interactive_url, public.provider_transactions.interactive_url),
        metadata        = coalesce(excluded.metadata, public.provider_transactions.metadata),
        updated_at      = now()
  returning id into v_id;

  return v_id;
end
$body$;

comment on table public.provider_transactions
  is 'Transações de provedores (Inter Pix, Circle, Anchors SEP-24). Idempotência por (provider, external_id). Valores em centavos/unidades.';
