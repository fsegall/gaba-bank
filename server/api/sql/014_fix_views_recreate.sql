-- 014_fix_views_recreate.sql
-- Recria views dependentes de 'orders' e 'trades' de forma idempotente.

-- 1) Garanta que índices únicos já existem (não falha se já criados)
CREATE UNIQUE INDEX IF NOT EXISTS uq_trades_provider_ref
  ON trades(exec_provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

-- 2) Drop das views antes de recriar (evita erro 42P16 ao mudar colunas da base)
DROP VIEW IF EXISTS vw_wallet_brl_check;
DROP VIEW IF EXISTS vw_orders_with_trades;

-- 3) Recria a view de ordens + agregados de trades
CREATE VIEW vw_orders_with_trades AS
WITH t AS (
  SELECT
    order_id,
    COUNT(*)                          AS trades_count,
    SUM(qty)                          AS sum_qty,
    SUM(price_brl * qty)              AS sum_brl,
    MIN(created_at)                   AS first_trade_at,
    MAX(created_at)                   AS last_trade_at,
    ARRAY_AGG(DISTINCT exec_provider) AS providers
  FROM trades
  GROUP BY order_id
)
SELECT
  o.*,                                 -- mantém todas as colunas atuais de orders
  COALESCE(t.trades_count, 0)          AS trades_count,
  t.sum_qty,
  t.sum_brl,
  CASE WHEN COALESCE(t.sum_qty, 0) > 0 THEN t.sum_brl / t.sum_qty ELSE NULL END
                                        AS avg_price_realized_brl,
  t.first_trade_at,
  t.last_trade_at,
  t.providers
FROM orders o
LEFT JOIN t ON t.order_id = o.id;

-- 4) Recria a view de conciliação de BRL
CREATE VIEW vw_wallet_brl_check AS
SELECT
  w.user_id,
  w.balance                                      AS wallet_brl,
  COALESCE((
    SELECT SUM(valor_centavos)/100.0
    FROM deposits d
    WHERE d.user_id = w.user_id
      AND d.status IN ('creditado_saldo', 'confirmado')
  ), 0)                                          AS brl_creditado,
  COALESCE((
    SELECT SUM(filled_brl_centavos)/100.0
    FROM orders o
    WHERE o.user_id = w.user_id
  ), 0)                                          AS brl_consumido_por_ordens,
  COALESCE((
    SELECT SUM(valor_centavos)/100.0
    FROM deposits d
    WHERE d.user_id = w.user_id
      AND d.status IN ('creditado_saldo', 'confirmado')
  ), 0) - COALESCE((
    SELECT SUM(filled_brl_centavos)/100.0
    FROM orders o
    WHERE o.user_id = w.user_id
  ), 0)                                          AS brl_esperado_teorico,
  w.balance - (
    COALESCE((
      SELECT SUM(valor_centavos)/100.0
      FROM deposits d
      WHERE d.user_id = w.user_id
        AND d.status IN ('creditado_saldo', 'confirmado')
    ), 0) - COALESCE((
      SELECT SUM(filled_brl_centavos)/100.0
      FROM orders o
      WHERE o.user_id = w.user_id
    ), 0)
  )                                              AS delta_wallet_vs_teorico
FROM wallets w
WHERE w.asset = 'BRL';
