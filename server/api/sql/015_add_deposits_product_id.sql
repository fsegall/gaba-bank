-- 015_add_deposits_product_id.sql
-- Alinha deposits.product_id (TEXT) e FK -> products(id TEXT)

-- 1) coluna (no-op se já existir)
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS product_id TEXT;

-- 2) se por acaso for UUID, converte para TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'deposits'
      AND column_name  = 'product_id'
      AND udt_name     = 'uuid'
  ) THEN
    ALTER TABLE public.deposits
      ALTER COLUMN product_id TYPE TEXT USING product_id::text;
  END IF;
END$$;

-- 3) índice
CREATE INDEX IF NOT EXISTS idx_deposits_product_id
  ON public.deposits(product_id);

-- 4) FK idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deposits_product_id_fk'
  ) THEN
    ALTER TABLE public.deposits
      ADD CONSTRAINT deposits_product_id_fk
      FOREIGN KEY (product_id) REFERENCES public.products(id);
  END IF;
END$$;
