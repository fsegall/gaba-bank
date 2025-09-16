-- Idempotência por referência do cliente
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS client_ref TEXT;

-- Índice único parcial: evita duplicar SELL/BUY com mesmo client_ref por usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_orders_user_side_clientref_part'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_orders_user_side_clientref_part
             ON orders(user_id, side, client_ref)
             WHERE client_ref IS NOT NULL';
  END IF;
END $$;

-- (Opcional) Colunas usadas pelo /sell mock que podem não existir ainda:
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS requested_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS received_brl_centavos BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS filled_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS avg_price_brl_x100 BIGINT DEFAULT 0 NOT NULL;

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS filled_units BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS received_brl_centavos BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS fee_native_units BIGINT DEFAULT 0 NOT NULL;
