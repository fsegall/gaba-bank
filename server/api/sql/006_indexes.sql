create index if not exists idx_deposits_user on deposits(user_id);
create index if not exists idx_wallets_user on wallets(user_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_trades_order on trades(order_id);
