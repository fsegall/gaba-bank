alter table orders
  add column if not exists filled_brl_centavos bigint not null default 0,
  add column if not exists avg_price_brl numeric(30,10),
  add column if not exists last_filled_at timestamptz;
