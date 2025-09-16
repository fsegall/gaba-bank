-- 019_provider_events_backcompat.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- (Opcional) coluna para guardar assinatura HMAC do PSP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='provider_events' AND column_name='signature'
  ) THEN
    ALTER TABLE provider_events ADD COLUMN signature TEXT;
  END IF;
END $$;

-- Unicidade por payload (idempotência forte por conteúdo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='uq_provider_events_provider_payload_hash'
  ) THEN
    CREATE UNIQUE INDEX uq_provider_events_provider_payload_hash
      ON provider_events(provider, payload_hash);
  END IF;
END $$;

-- (Opcional) Unicidade por external_id quando existir (muitos PSPs mandam esse id)
-- Usamos um UNIQUE INDEX NORMAL (sem predicate) porque external_id pode ser nulo;
-- o Postgres permite múltiplos NULLs sem conflitar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='uq_provider_events_provider_eventtype_externalid'
  ) THEN
    CREATE UNIQUE INDEX uq_provider_events_provider_eventtype_externalid
      ON provider_events(provider, event_type, external_id);
  END IF;
END $$;

-- Índice para consultas por tempo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname='idx_provider_events_received_at'
  ) THEN
    CREATE INDEX idx_provider_events_received_at
      ON provider_events(received_at DESC);
  END IF;
END $$;
