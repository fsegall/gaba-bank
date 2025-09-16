-- 021_vault_tables.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vault_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vault_address TEXT NOT NULL,
  base_asset TEXT NOT NULL,             -- ex.: C... (USDC contract)
  shares NUMERIC(30,10) NOT NULL DEFAULT 0,
  principal NUMERIC(18,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, vault_address)
);

CREATE TABLE IF NOT EXISTS vault_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vault_address TEXT NOT NULL,
  kind TEXT NOT NULL,                   -- DEPOSIT|WITHDRAW|ERROR
  amount NUMERIC(18,6),
  shares NUMERIC(30,10),
  tx_hash TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='idx_vault_events_user_time'
  ) THEN
    CREATE INDEX idx_vault_events_user_time ON vault_events(user_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='idx_vault_positions_user_vault'
  ) THEN
    CREATE INDEX idx_vault_positions_user_vault ON vault_positions(user_id, vault_address);
  END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION defy_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_vault_positions_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_vault_positions_touch_updated_at
      BEFORE UPDATE ON vault_positions
      FOR EACH ROW EXECUTE FUNCTION defy_touch_updated_at();
  END IF;
END $$;
