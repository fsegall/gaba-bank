BEGIN;

-- ========== 1) ETH -> XLM em todos os produtos ==========
-- 1a) Somar ETH no XLM (peso, min, max) quando XLM já existe no produto
UPDATE product_allocations x
SET
  weight = x.weight + e.weight,
  "min"  = CASE
             WHEN x."min" IS NULL AND e."min" IS NULL THEN NULL
             ELSE COALESCE(x."min", 0) + COALESCE(e."min", 0)
           END,
  "max"  = CASE
             WHEN x."max" IS NULL AND e."max" IS NULL THEN NULL
             ELSE COALESCE(x."max", 0) + COALESCE(e."max", 0)
           END
FROM product_allocations e
WHERE x.product_id = e.product_id
  AND x.symbol = 'XLM'
  AND e.symbol = 'ETH';

-- 1b) Remover ETH que já foi absorvido por XLM
DELETE FROM product_allocations e
USING product_allocations x
WHERE e.product_id = x.product_id
  AND e.symbol = 'ETH'
  AND x.symbol = 'XLM';

-- 1c) Se restou ETH (produto sem XLM), apenas renomear ETH -> XLM
UPDATE product_allocations
SET symbol = 'XLM'
WHERE symbol = 'ETH';

-- ========== 2) No defy-explorer: ALT -> XLM ==========
-- 2a) Somar ALT no XLM (peso, min, max) quando XLM já existe
UPDATE product_allocations x
SET
  weight = x.weight + a.weight,
  "min"  = CASE
             WHEN x."min" IS NULL AND a."min" IS NULL THEN NULL
             ELSE COALESCE(x."min", 0) + COALESCE(a."min", 0)
           END,
  "max"  = CASE
             WHEN x."max" IS NULL AND a."max" IS NULL THEN NULL
             ELSE COALESCE(x."max", 0) + COALESCE(a."max", 0)
           END
FROM product_allocations a
WHERE x.product_id = a.product_id
  AND x.product_id = 'defy-explorer'
  AND x.symbol = 'XLM'
  AND a.symbol = 'ALT';

-- 2b) Remover ALT que foi absorvido por XLM
DELETE FROM product_allocations a
USING product_allocations x
WHERE a.product_id = x.product_id
  AND a.product_id = 'defy-explorer'
  AND a.symbol = 'ALT'
  AND x.symbol = 'XLM';

-- 2c) Se não havia XLM no defy-explorer, renomear ALT -> XLM
UPDATE product_allocations
SET symbol = 'XLM'
WHERE product_id = 'defy-explorer'
  AND symbol = 'ALT';

COMMIT;
