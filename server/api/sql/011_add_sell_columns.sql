-- ORDERS: campos usados pelo /sell (mock)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS requested_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS received_brl_centavos BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS filled_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS avg_price_brl_x100 BIGINT DEFAULT 0 NOT NULL;

-- Se não existir a coluna 'side', garanta que exista (ENUM ou TEXT conforme seu schema)
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS side TEXT; -- (descomente se precisar)

-- TRADES: campos usados pelo /sell (mock)
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS filled_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS received_brl_centavos BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS fee_native_units BIGINT DEFAULT 0 NOT NULL;

-- Opcional: índices úteis
CREATE INDEX IF NOT EXISTS idx_orders_user_side_created_at ON orders(user_id, side, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);
