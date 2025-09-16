-- 1) Backfill agregados de ORDERS a partir de TRADES (idempotente)
with agg as (
  select
    t.order_id,
    sum((t.price_brl * t.qty) * 100)::bigint      as sum_brl_centavos,
    sum(t.qty)                                    as sum_qty,
    case when sum(t.qty) > 0
         then sum(t.price_brl * t.qty) / sum(t.qty)
         else null end                            as wavg_price_brl,
    max(t.created_at)                              as last_trade_at
  from trades t
  group by t.order_id
)
update orders o
set filled_brl_centavos = coalesce(a.sum_brl_centavos, 0),
    filled_qty          = coalesce(a.sum_qty, 0),
    avg_price_brl       = a.wavg_price_brl,
    last_filled_at      = a.last_trade_at,
    status = case
               when coalesce(a.sum_brl_centavos,0) = 0 then o.status
               when coalesce(a.sum_brl_centavos,0) <  o.amount_brl_centavos then 'partially_filled'
               else 'filled'
             end
from agg a
where a.order_id = o.id;

-- 2) View de ORDERS + agregados vindos de TRADES (fonte única)
create or replace view vw_orders_with_trades as
with t as (
  select
    order_id,
    count(*)                            as trades_count,
    sum(qty)                            as sum_qty,
    sum(price_brl * qty)                as sum_brl,
    case when sum(qty) > 0
         then sum(price_brl * qty) / sum(qty)
         else null end                  as avg_price_realized_brl,
    min(created_at)                     as first_trade_at,
    max(created_at)                     as last_trade_at,
    array_agg(distinct exec_provider)   as providers
  from trades
  group by order_id
)
select
  o.*,
  coalesce(t.trades_count, 0)           as trades_count,
  t.sum_qty,
  t.sum_brl,
  t.avg_price_realized_brl,
  t.first_trade_at,
  t.last_trade_at,
  t.providers
from orders o
left join t on t.order_id = o.id;

-- 3) View de conciliação BRL (crédito real x consumo real por TRADES)
create or replace view vw_wallet_brl_check as
select
  w.user_id,
  w.balance                                                 as wallet_brl,
  /* crédito: somente depósitos efetivamente creditados */
  coalesce((
    select sum(d.valor_centavos)/100.0
    from deposits d
    where d.user_id = w.user_id
      and d.status = 'creditado_saldo'
  ), 0)                                                     as brl_creditado,
  /* consumo: soma de price*qty em TRADES do usuário */
  coalesce((
    select sum(t.price_brl * t.qty)
    from trades t
    join orders o on o.id = t.order_id
    where o.user_id = w.user_id
  ), 0)                                                     as brl_consumido_por_ordens,
  /* esperado = crédito - consumo */
  coalesce((
    select sum(d.valor_centavos)/100.0
    from deposits d
    where d.user_id = w.user_id
      and d.status = 'creditado_saldo'
  ), 0)
  - coalesce((
    select sum(t.price_brl * t.qty)
    from trades t
    join orders o on o.id = t.order_id
    where o.user_id = w.user_id
  ), 0)                                                     as brl_esperado_teorico,
  /* delta = wallet atual - esperado */
  w.balance
  - (
      coalesce((
        select sum(d.valor_centavos)/100.0
        from deposits d
        where d.user_id = w.user_id
          and d.status = 'creditado_saldo'
      ), 0)
      - coalesce((
        select sum(t.price_brl * t.qty)
        from trades t
        join orders o on o.id = t.order_id
        where o.user_id = w.user_id
      ), 0)
    )                                                       as delta_wallet_vs_teorico
from wallets w
where w.asset = 'BRL';
