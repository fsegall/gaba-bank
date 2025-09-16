-- 013_add_trades_chunk_ref.sql
-- Adiciona identificador idempotente por chunk de execução
-- e garante unicidade quando informado.

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS chunk_ref text;

-- Índice único parcial: permite NULL (sem restrição), mas
-- obriga unicidade quando chunk_ref for informado.
CREATE UNIQUE INDEX IF NOT EXISTS uq_trades_chunk_ref
  ON trades(chunk_ref)
  WHERE chunk_ref IS NOT NULL;

-- Opcional (documentação)
COMMENT ON COLUMN trades.chunk_ref IS 'Idempotency key por chunk (determinístico no caller)';
