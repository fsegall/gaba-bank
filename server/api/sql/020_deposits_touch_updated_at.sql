-- 020_deposits_touch_updated_at.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='deposits' AND column_name='updated_at'
  ) THEN
    ALTER TABLE deposits ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Função com nome exclusivo para evitar conflito
CREATE OR REPLACE FUNCTION defy_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='trg_deposits_touch_updated_at'
  ) THEN
    CREATE TRIGGER trg_deposits_touch_updated_at
      BEFORE UPDATE ON deposits
      FOR EACH ROW EXECUTE FUNCTION defy_touch_updated_at();
  END IF;
END $$;

-- Índice por status (útil para filas / monitoramento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='idx_deposits_status'
  ) THEN
    CREATE INDEX idx_deposits_status ON deposits(status);
  END IF;
END $$;
