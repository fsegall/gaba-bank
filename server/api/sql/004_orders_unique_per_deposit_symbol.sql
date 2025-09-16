-- se por acaso você já criou a constraint com nome igual, remova silenciosamente
alter table orders drop constraint if exists orders_deposit_symbol_uk;

-- garanta unicidade por depósito+símbolo (idempotente)
create unique index if not exists orders_deposit_symbol_uk
  on orders(deposit_id, symbol);
