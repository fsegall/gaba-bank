-- 1) Evita duplicidade de fills vindos do mesmo provedor/execução
--    (idempotência de trade por tx/hash do provider)
create unique index if not exists uq_trades_provider_ref
  on trades(exec_provider, provider_ref)
  where provider_ref is not null;

-- 2) View: resumo de ordens + agregados de trades (fills)
--    - trades_count, sum_qty, sum_brl, avg_realizada, janelas temporal
create or replace view vw_orders_with_trades as
with t as (
  select
    order_id,
    count(*)                            as trades_count,
    sum(qty)                            as sum_qty,
    sum(price_brl * qty)                as sum_brl,
    min(created_at)                     as first_trade_at,
    max(created_at)                     as last_trade_at,
    array_agg(distinct exec_provider)   as providers
  from trades
  group by order_id
)
select
  o.*,
  coalesce(t.trades_count, 0)                 as trades_count,
  t.sum_qty,
  t.sum_brl,
  case
    when coalesce(t.sum_qty, 0) > 0 then t.sum_brl / t.sum_qty
    else null
  end                                         as avg_price_realized_brl,
  t.first_trade_at,
  t.last_trade_at,
  t.providers
from orders o
left join t on t.order_id = o.id;

-- 3) View: conciliação de BRL
--    - quanto foi creditado (deposits), quanto foi consumido (fills),
--      esperado = creditado - consumido, delta = wallet_brl - esperado
create or replace view vw_wallet_brl_check as
select
  w.user_id,
  w.balance                                      as wallet_brl,
  coalesce((
    select sum(valor_centavos)/100.0
    from deposits d
    where d.user_id = w.user_id
      and d.status in ('creditado_saldo', 'confirmado')  -- ajuste se desejar só 'creditado_saldo'
  ), 0)                                           as brl_creditado,
  coalesce((
    select sum(filled_brl_centavos)/100.0
    from orders o
    where o.user_id = w.user_id
  ), 0)                                           as brl_consumido_por_ordens,
  coalesce((
    select sum(valor_centavos)/100.0
    from deposits d
    where d.user_id = w.user_id
      and d.status in ('creditado_saldo', 'confirmado')
  ), 0) - coalesce((
    select sum(filled_brl_centavos)/100.0
    from orders o
    where o.user_id = w.user_id
  ), 0)                                           as brl_esperado_teorico,
  w.balance - (
    coalesce((
      select sum(valor_centavos)/100.0
      from deposits d
      where d.user_id = w.user_id
        and d.status in ('creditado_saldo', 'confirmado')
    ), 0) - coalesce((
      select sum(filled_brl_centavos)/100.0
      from orders o
      where o.user_id = w.user_id
    ), 0)
  )                                               as delta_wallet_vs_teorico
from wallets w
where w.asset = 'BRL';
