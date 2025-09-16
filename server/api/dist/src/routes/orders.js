import { Router } from 'express';
import { z } from 'zod';
import { soroswap } from '../services/soroswap.js';
import { pool, tx } from '../db.js';
export const router = Router();
/**
 * POST /orders
 * Cria uma ordem BUY (BRL -> SYMBOL) ou SELL (SYMBOL -> BRL).
 * MOCK de execução agora; quando plugar on-chain, reaproveita a mesma lógica.
 *
 * BUY body:
 * { side:"buy", symbol:"BTC"|"...", amount_brl_centavos:number, slippage_bps?:number }
 *
 * SELL body:
 * { side:"sell", symbol:"BTC"|"...", qty:number, slippage_bps?:number }
 *   - qty em UNIDADES do ativo (ex.: 0.05 BTC). No stub, 1 unidade = 100 "centavos" do ativo.
 */
router.post('/orders', async (req, res) => {
    const Body = z.discriminatedUnion('side', [
        z.object({
            side: z.literal('buy'),
            symbol: z.string().min(2).max(16),
            amount_brl_centavos: z.number().int().positive(),
            slippage_bps: z.number().int().min(1).max(10_000).default(50)
        }),
        z.object({
            side: z.literal('sell'), symbol: z.string().min(2).max(16),
            qty: z.number().positive(), // unidades do ativo
            slippage_bps: z.number().int().min(1).max(10_000).default(50)
        })
    ]);
    const body = Body.parse(req.body);
    const userId = req.header('x-user-id') || '00000000-0000-0000-0000-000000000001';
    try {
        if (body.side === 'buy') {
            // BRL -> SYMBOL
            const pair = `BRL-${body.symbol}`;
            const amountIn = String(body.amount_brl_centavos); // stub: "centavos BRL"
            const q = await soroswap.quote({ pair, amountIn });
            const minOut = BigInt(Math.floor(Number(q.amountOut) * (1 - body.slippage_bps / 1e4))).toString();
            const exec = await soroswap.swap({ route: q.route, amountIn: q.amountIn, minOut });
            const qtyOut = Number(q.amountOut) / 100.0; // stub: 100 "centavos" do ativo = 1 unidade
            const price = Number(q.poolMid); // BRL por unidade (stub 1:1)
            const r = await tx(async (c) => {
                // cria ordem
                const ord = await c.query(`insert into orders (user_id, product_id, side, symbol, amount_brl_centavos, slippage_bps, status)
           values ($1,$2,'buy',$3,$4,$5,'open') returning id`, [userId, null, body.symbol, body.amount_brl_centavos, body.slippage_bps]);
                const orderId = ord.rows[0].id;
                // trade
                await c.query(`insert into trades (order_id, symbol, qty, price_brl, pool_price_brl, oracle_price_brl,
                               exec_provider, provider_ref, route_json, exec_fee_native)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [orderId, body.symbol, qtyOut, price, price, null,
                    exec.exec_provider, exec.tx_hash, exec.route, exec.fee_native]);
                // wallets: -BRL, +ASSET
                await c.query(`insert into wallets(user_id, asset, balance) values ($1,'BRL',0)
             on conflict (user_id, asset) do nothing`, [userId]);
                await c.query(`update wallets set balance = balance - ($1/100.0), updated_at=now()
             where (user_id, asset) = ($2,'BRL')`, [body.amount_brl_centavos, userId]);
                await c.query(`insert into wallets(user_id, asset, balance) values ($1,$2,0)
             on conflict (user_id, asset) do nothing`, [userId, body.symbol]);
                await c.query(`update wallets set balance = balance + $1, updated_at=now()
             where (user_id, asset) = ($2,$3)`, [qtyOut, userId, body.symbol]);
                // agrega na ordem
                await c.query(`update orders
             set filled_brl_centavos = filled_brl_centavos + $1,
                 filled_qty = filled_qty + $2,
                 avg_price_brl = case
                    when (filled_qty + $2) = 0 then null
                    else ((coalesce(avg_price_brl,0) * filled_qty) + ($3 * $2)) / (filled_qty + $2)
                 end,
                 last_filled_at = now(),
                 exec_provider = coalesce(exec_provider, $4),
                 exec_order_ref = coalesce(exec_order_ref, $5),
                 route_json = coalesce(route_json, $6),
                 exec_fee_native = coalesce(exec_fee_native, 0) + $7,
                 status = 'filled'
           where id = $8`, [body.amount_brl_centavos, qtyOut, price,
                    exec.exec_provider, exec.tx_hash, exec.route, exec.fee_native, orderId]);
                return { orderId, txHash: exec.tx_hash, quote: q };
            });
            return res.json(r);
        }
        else {
            // SELL: SYMBOL -> BRL
            const current = await pool.query(`select balance from wallets where (user_id, asset) = ($1,$2)`, [userId, body.symbol]);
            const bal = current.rowCount ? Number(current.rows[0].balance) : 0;
            if (bal + 1e-12 < body.qty) {
                return res.status(422).json({ error: 'insufficient_balance', have: bal, want: body.qty });
            }
            const pair = `${body.symbol}-BRL`;
            const amountInUnits = body.qty;
            const amountIn = String(Math.floor(amountInUnits * 100)); // stub: 100 "centavos" do ativo = 1 unidade
            const q = await soroswap.quote({ pair, amountIn });
            const minOut = BigInt(Math.floor(Number(q.amountOut) * (1 - body.slippage_bps / 1e4))).toString();
            const exec = await soroswap.swap({ route: q.route, amountIn: q.amountIn, minOut });
            const qtySold = amountInUnits;
            const brlCentavos = Number(q.amountOut); // saída em centavos BRL
            const price = Number(q.poolMid); // BRL por unidade (stub 1:1)
            const r = await tx(async (c) => {
                // cria ordem SELL
                const ord = await c.query(`insert into orders (user_id, product_id, side, symbol, amount_brl_centavos, slippage_bps, status)
           values ($1,$2,'sell',$3,$4,$5,'open') returning id`, [userId, null, body.symbol, brlCentavos, body.slippage_bps]);
                const orderId = ord.rows[0].id;
                // trade
                await c.query(`insert into trades (order_id, symbol, qty, price_brl, pool_price_brl, oracle_price_brl,
                               exec_provider, provider_ref, route_json, exec_fee_native)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [orderId, body.symbol, -qtySold, price, price, null,
                    exec.exec_provider, exec.tx_hash, exec.route, exec.fee_native]);
                // wallets: -ASSET, +BRL
                await c.query(`update wallets set balance = balance - $1, updated_at=now()
             where (user_id, asset) = ($2,$3)`, [qtySold, userId, body.symbol]);
                await c.query(`insert into wallets(user_id, asset, balance) values ($1,'BRL',0)
             on conflict (user_id, asset) do nothing`, [userId]);
                await c.query(`update wallets set balance = balance + ($1/100.0), updated_at=now()
             where (user_id, asset) = ($2,'BRL')`, [brlCentavos, userId]);
                // agrega na ordem
                await c.query(`update orders
             set filled_brl_centavos = filled_brl_centavos + $1,
                 filled_qty = filled_qty + $2,
                 avg_price_brl = case
                    when (filled_qty + $2) = 0 then null
                    else ((coalesce(avg_price_brl,0) * filled_qty) + ($3 * $2)) / (filled_qty + $2)
                 end,
                 last_filled_at = now(),
                 exec_provider = coalesce(exec_provider, $4),
                 exec_order_ref = coalesce(exec_order_ref, $5),
                 route_json = coalesce(route_json, $6),
                 exec_fee_native = coalesce(exec_fee_native, 0) + $7,
                 status = 'filled'
           where id = $8`, [brlCentavos, -qtySold, price,
                    exec.exec_provider, exec.tx_hash, exec.route, exec.fee_native, orderId]);
                return { orderId, txHash: exec.tx_hash, quote: q };
            });
            return res.json(r);
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message });
    }
});
// listar ordens (por deposit_id OU user_id)
// listar ordens (por deposit_id OU user_id)
router.get('/orders', async (req, res) => {
    const Q = z.object({
        deposit_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    });
    const { deposit_id, user_id, limit } = Q.parse(req.query);
    let where = '';
    const params = [];
    if (deposit_id) {
        where = 'where o.deposit_id = $1';
        params.push(deposit_id);
    }
    else if (user_id) {
        where = 'where o.user_id = $1';
        params.push(user_id);
    }
    // o índice do LIMIT depende de quantos params já temos
    const limitIdx = params.length + 1;
    const sql = `
    select
      o.*,
      coalesce(
        json_agg(
          json_build_object(
            'id', t.id,
            'symbol', t.symbol,
            'qty', t.qty,
            'price_brl', t.price_brl,
            'pool_price_brl', t.pool_price_brl,
            'oracle_price_brl', t.oracle_price_brl,
            'exec_provider', t.exec_provider,
            'provider_ref', t.provider_ref,
            'route_json', t.route_json,
            'exec_fee_native', t.exec_fee_native,
            'created_at', t.created_at
          )
          order by t.created_at asc
        ) filter (where t.id is not null),
        '[]'
      ) as trades
    from orders o
    left join trades t on t.order_id = o.id
    ${where}
    group by o.id
    order by o.created_at desc
    limit $${limitIdx};
  `;
    const r = await pool.query(sql, [...params, limit]);
    res.json(r.rows);
});
// obter ordem por id (com trades)
router.get('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const o = await pool.query(`select o.*,
       coalesce(json_agg(t.* order by t.created_at asc) filter (where t.id is not null), '[]') as trades
      from orders o left join trades t on t.order_id = o.id
      where o.id = $1 group by o.id`, [id]);
    if (!o.rowCount)
        return res.status(404).json({ error: 'not found' });
    res.json(o.rows[0]);
});
// cancelar ordem (apenas open/partially_filled e sem reservas de saldo no MVP)
router.post('/orders/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const r = await pool.query(`update orders set status='cancelled' where id=$1 and status in ('open','partially_filled') returning id,status`, [id]);
    if (!r.rowCount)
        return res.status(422).json({ error: 'cannot_cancel' });
    res.json(r.rows[0]);
});
