alter table orders
  add column if not exists exec_provider text,
  add column if not exists exec_order_ref text,
  add column if not exists route_json jsonb,
  add column if not exists exec_fee_native numeric(30,10);

create index if not exists orders_exec_provider_idx on orders(exec_provider);
create index if not exists orders_exec_order_ref_idx on orders(exec_order_ref);

alter table trades
  add column if not exists exec_provider text,
  add column if not exists route_json jsonb,
  add column if not exists exec_fee_native numeric(30,10);

-- idempotência de fill por (provider, ref)
create unique index if not exists trades_provider_ref_uk
  on trades(exec_provider, provider_ref)
  where provider_ref is not null;
