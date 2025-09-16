-- 022_add_constraint_unique_id_provider_pix_vault.sql
-- Idempotente e compatível com estado parcial (índice já criado, constraint já existente, etc.)

-- provider_events: garantir colunas (caso venham de versões antigas)
ALTER TABLE IF EXISTS provider_events
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS payload_json jsonb,
  ADD COLUMN IF NOT EXISTS signature   text;

-- (opcional) backfill mínimo do hash se existir payload_json e hash estiver nulo
UPDATE provider_events
   SET payload_hash = md5(COALESCE(payload_json::text, ''))
 WHERE payload_json IS NOT NULL
   AND payload_hash IS NULL;

-- UNIQUE (provider, payload_hash)
DO $$
DECLARE
  has_con BOOLEAN;
  idx_name TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'uq_provider_events_provider_payload_hash'
  ) INTO has_con;

  IF NOT has_con THEN
    -- procure um índice existente que sirva para a constraint
    SELECT i.relname
      INTO idx_name
      FROM pg_class i
      JOIN pg_index ix ON ix.indexrelid = i.oid
      JOIN pg_class t  ON ix.indrelid  = t.oid
     WHERE t.relname = 'provider_events'
       AND i.relname IN ('idx_provider_events_provider_payload_hash',
                         'uq_provider_events_provider_payload_hash')
     LIMIT 1;

    IF idx_name IS NULL THEN
      -- cria índice com nome "idx_..." se ainda não existir nenhum
      CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_events_provider_payload_hash
        ON provider_events(provider, payload_hash);
      idx_name := 'idx_provider_events_provider_payload_hash';
    END IF;

    -- anexa o índice à constraint (idempotente)
    BEGIN
      EXECUTE format(
        'ALTER TABLE provider_events
           ADD CONSTRAINT uq_provider_events_provider_payload_hash
           UNIQUE USING INDEX %I',
        idx_name
      );
    EXCEPTION
      WHEN duplicate_object OR duplicate_table THEN
        -- já existe (ou colidiu na renomeação); ignorar
        NULL;
    END;
  END IF;
END $$;

-- UNIQUE (provider, event_type, external_id)
DO $$
DECLARE
  has_con BOOLEAN;
  idx_name TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'uq_provider_events_provider_eventtype_externalid'
  ) INTO has_con;

  IF NOT has_con THEN
    SELECT i.relname
      INTO idx_name
      FROM pg_class i
      JOIN pg_index ix ON ix.indexrelid = i.oid
      JOIN pg_class t  ON ix.indrelid  = t.oid
     WHERE t.relname = 'provider_events'
       AND i.relname IN ('idx_provider_events_provider_eventtype_externalid',
                         'uq_provider_events_provider_eventtype_externalid')
     LIMIT 1;

    IF idx_name IS NULL THEN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_events_provider_eventtype_externalid
        ON provider_events(provider, event_type, external_id);
      idx_name := 'idx_provider_events_provider_eventtype_externalid';
    END IF;

    BEGIN
      EXECUTE format(
        'ALTER TABLE provider_events
           ADD CONSTRAINT uq_provider_events_provider_eventtype_externalid
           UNIQUE USING INDEX %I',
        idx_name
      );
    EXCEPTION
      WHEN duplicate_object OR duplicate_table THEN
        NULL;
    END;
  END IF;
END $$;

-- deposits: garantir coluna txid e UNIQUE(txid)
ALTER TABLE IF EXISTS deposits
  ADD COLUMN IF NOT EXISTS txid text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='deposits_txid_uk'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_txid ON deposits(txid);
    BEGIN
      ALTER TABLE deposits
        ADD CONSTRAINT deposits_txid_uk
        UNIQUE USING INDEX idx_deposits_txid;
    EXCEPTION
      WHEN duplicate_object OR duplicate_table THEN
        NULL;
    END;
  END IF;
END $$;
