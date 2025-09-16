// src/routes/webhooks/psp.ts
import { Router } from 'express';
import crypto from 'crypto';
import { tx } from '../../db.js';
import { getProductById } from '../../util/products.js';
import { parseAndVerify } from '../../services/psp.js';
import { soroswap } from '../../services/soroswap.js';
import { tracer } from '../../observability/otel.js';
import { fromUnits, applySlippage, scaleUnits, DEC } from '../../money.js';
import { autobuyOrdersCreatedTotal, chunkBuyExecutedTotal, chunkBuyDurationSeconds, pspWebhookReceivedTotal, pspWebhookBadSignatureTotal, pspWebhookReplayedTotal, brlCreditedTotalCentavos, } from '../../observability/metrics.js';
import { SOROSWAP_ONCHAIN_DEC } from '../../lib/onchain-decimals.js';
import { verifyPspSignature } from '../../middleware/verifyPspSignature.js';
import { getPriceReflector, checkSpreadBps } from '../../services/reflector.js';
// 🔁 Gateway that selects soroban vs defindex via VAULT_PROVIDER
import { depositToVault } from '../../services/vaultGateway.js';
export const router = Router();
const AUTOBUY_ENABLED = (process.env.AUTOBUY_ENABLED ?? 'false').toLowerCase() === 'true';
const AUTOBUY_DEFAULT_PRODUCT = process.env.AUTOBUY_DEFAULT_PRODUCT ?? 'defy-balanced';
const ORACLE_SANITY_ENABLED = (process.env.ORACLE_SANITY_ENABLED ?? 'true').toLowerCase() === 'true';
const TREASURY_PUB = process.env.STELLAR_TREASURY_PUBLIC || '';
const DEFAULT_VAULT_ADDR = process.env.VAULT_C || process.env.DEFINDEX_VAULT_ADDRESS || 'VAULT_DEMO_ADDR';
// handler reused by both routes
async function handlePspWebhook(req, res) {
    try {
        const rawBody = typeof req.body === 'string' ? req.body :
            Buffer.isBuffer(req.body) ? req.body.toString('utf8') :
                req.rawBody || JSON.stringify(req.body || {});
        const sig = req.header('x-provider-signature') || req.header('x-signature') || '';
        const provider = (process.env.PSP_PROVIDER || 'inter');
        let evt;
        try {
            evt = parseAndVerify({ provider, rawBody, signature: sig, headers: req.headers });
        }
        catch (err) {
            if (provider === 'mock') {
                evt = JSON.parse(rawBody);
                if (!evt?.type)
                    evt = { ...evt, type: 'pix.pago' };
            }
            else {
                pspWebhookBadSignatureTotal.inc();
                throw err;
            }
        }
        pspWebhookReceivedTotal.inc({ type: evt?.type ?? 'unknown' });
        if (evt.type !== 'pix.pago')
            return res.json({ ok: true });
        const meta = (evt && typeof evt === 'object' ? (evt.metadata || {}) : {});
        // normalize fields coming from metadata
        evt.user_id = evt.user_id || meta.user_id;
        evt.product_id = evt.product_id || meta.product_id;
        let execPlan = [];
        await tx(async (c) => {
            // event idempotency
            const h = crypto.createHash('sha256').update(JSON.stringify(evt)).digest('hex');
            const evRes = await c.query(`insert into provider_events(provider, event_type, external_id, payload_hash, payload_json)
         values ($1,$2,$3,$4,$5)
         on conflict do nothing`, ['psp', evt.type, evt.psp_ref ?? evt.txid ?? null, h, evt]);
            if (evRes.rowCount === 0)
                pspWebhookReplayedTotal.inc();
            const DEFAULT_DEV_USER = process.env.DEV_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';
            const userForDeposit = evt.user_id || DEFAULT_DEV_USER;
            await c.query(`insert into users (id, kyc_status) values ($1,'approved')
         on conflict (id) do nothing`, [userForDeposit]);
            // use evt.valor_centavos (already expected by your payload)
            const { rows: [deposito] } = await c.query(`
        insert into deposits (txid, psp_ref, valor_centavos, status, paid_at, user_id, product_id)
        values ($1, $2, $3, 'confirmado', now(), $4, $5)
        on conflict (txid) do update set
          psp_ref        = coalesce(deposits.psp_ref, excluded.psp_ref),
          valor_centavos = excluded.valor_centavos,
          status = case
                     when deposits.status = 'creditado_saldo' then 'creditado_saldo'
                     when deposits.status in ('iniciado','aguardando_pagamento') then 'confirmado'
                     else deposits.status
                   end,
          paid_at    = coalesce(deposits.paid_at, now()),
          user_id    = coalesce(deposits.user_id, excluded.user_id),
          product_id = coalesce(deposits.product_id, excluded.product_id)
        returning id, status, user_id, valor_centavos, product_id
        `, [evt.txid, evt.psp_ref ?? null, evt.valor_centavos, userForDeposit, evt.product_id ?? null]);
            if (Number(deposito.valor_centavos) !== Number(evt.valor_centavos)) {
                await c.query(`update deposits set status='valor_divergente' where id=$1`, [deposito.id]);
                return;
            }
            if (deposito.status !== 'creditado_saldo') {
                await c.query(`insert into wallets(user_id, asset, balance)
           values ($1,'BRL',0)
           on conflict (user_id, asset) do nothing`, [deposito.user_id]);
                await c.query(`update wallets
              set balance = balance + $1, updated_at=now()
            where (user_id, asset) = ($2,'BRL')`, [Number(evt.valor_centavos) / 100.0, deposito.user_id]);
                await c.query(`update deposits set status='creditado_saldo' where id=$1`, [deposito.id]);
                brlCreditedTotalCentavos.inc(Number(evt.valor_centavos));
            }
            if (!AUTOBUY_ENABLED)
                return;
            const productId = (typeof evt.product_id === 'string' ? evt.product_id : undefined) ||
                (deposito.product_id ?? undefined) ||
                AUTOBUY_DEFAULT_PRODUCT;
            const product = await getProductById(productId);
            if (!product)
                throw new Error(`product not found: ${productId}`);
            const totalCentavos = Number(deposito.valor_centavos);
            const minCentavos = Number(product.execution?.min_order_centavos ?? 1000);
            const slippage_bps = Number(product.execution?.slippage_bps ?? 50);
            const max_spread_bps = Number(product.execution?.max_spread_bps ?? 100);
            const split = (t, m) => {
                const out = [];
                let rest = t;
                while (rest > 0) {
                    const chunk = Math.min(rest, m);
                    out.push(chunk);
                    rest -= chunk;
                }
                return out;
            };
            for (const alloc of product.allocations) {
                const partCent = Math.floor(totalCentavos * Number(alloc.weight));
                if (partCent <= 0)
                    continue;
                const ins = await c.query(`insert into orders (user_id, product_id, side, symbol, amount_brl_centavos, slippage_bps, status, deposit_id)
           values ($1,$2,'buy',$3,$4,$5,'open',$6)
           on conflict do nothing
           returning id`, [deposito.user_id, productId, alloc.symbol, partCent, slippage_bps, deposito.id]);
                if (ins.rowCount === 1) {
                    const orderId = ins.rows[0].id;
                    execPlan.push({
                        orderId,
                        userId: deposito.user_id,
                        symbol: alloc.symbol,
                        chunks: split(partCent, minCentavos),
                        slippage_bps,
                        max_spread_bps,
                    });
                    autobuyOrdersCreatedTotal.inc({ product_id: productId, symbol: alloc.symbol });
                }
            }
        });
        res.json({ ok: true });
        // Execution outside the DB transaction
        process.nextTick(async () => {
            for (const plan of execPlan) {
                for (let i = 0; i < plan.chunks.length; i++) {
                    const chunk = plan.chunks[i];
                    const chunkRef = `ab-${plan.orderId}-${i + 1}`;
                    const span = tracer.startSpan('autobuy.chunk', {
                        attributes: { order_id: plan.orderId, symbol: plan.symbol, chunk_centavos: String(chunk) }
                    });
                    const endTimer = chunkBuyDurationSeconds.startTimer({ symbol: plan.symbol });
                    try {
                        const pair = plan.symbol === 'USDSTABLE' ? 'BRLSTABLE-USDC' :
                            plan.symbol === 'BRLSTABLE' ? null : null;
                        if (!pair) {
                            continue;
                        }
                        const amountInToken = scaleUnits(BigInt(chunk), DEC.get('BRL') ?? 2, SOROSWAP_ONCHAIN_DEC).toString();
                        const q = await soroswap.quote({ pair, amountIn: amountInToken });
                        if (!q.amountOut) {
                            await tx(async (c) => {
                                await c.query(`insert into provider_events (provider, event_type, external_id, payload_hash, payload_json)
                   values ($1,$2,$3, md5($4::text), $4::jsonb)
                   on conflict do nothing`, ['soroswap', 'QUOTE_MISSING_AMOUNTOUT', chunkRef,
                                    JSON.stringify({ order_id: plan.orderId, pair, amountIn: amountInToken, quote: q })]);
                            });
                            continue;
                        }
                        else {
                            await tx(async (c) => {
                                await c.query(`insert into provider_events (provider, event_type, external_id, payload_hash, payload_json)
                   values ($1,$2,$3, md5($4::text), $4::jsonb)
                   on conflict do nothing`, ['soroswap', 'QUOTE_OK', chunkRef,
                                    JSON.stringify({ order_id: plan.orderId, pair, quote: q })]);
                            });
                        }
                        if (ORACLE_SANITY_ENABLED) {
                            const usdc = Number(q.amountOut) / 1e7;
                            const brl = Number(q.amountIn) / 1e7;
                            const execPrice = usdc / brl;
                            const ref = await getPriceReflector('USDC-BRLD');
                            const { bps } = checkSpreadBps(ref.price, execPrice);
                            if (bps > plan.max_spread_bps) {
                                await tx(async (c) => {
                                    await c.query(`insert into provider_events(provider, event_type, external_id, payload_hash, payload_json)
                     values ($1,$2,$3, md5($4::text), $4::jsonb)
                     on conflict do nothing`, ['oracle', 'BLOCK', chunkRef,
                                        JSON.stringify({ order_id: plan.orderId, pair, execPrice, oracle: ref.price, bps, max: plan.max_spread_bps })]);
                                });
                                throw new Error(`ORACLE_BLOCK: spread ${bps}bps > ${plan.max_spread_bps}bps`);
                            }
                        }
                        const minOut = q.otherAmountThreshold ??
                            applySlippage(BigInt(q.amountOut ?? 0), plan.slippage_bps).toString();
                        const exec = await soroswap.swap({
                            route: q.route,
                            amountIn: q.amountIn || amountInToken,
                            minOut
                        });
                        const qtyOutHuman = fromUnits(plan.symbol, q.amountOut ?? 0);
                        const priceBRL = (Number(chunk) / 100.0) / (Number(qtyOutHuman) || 1);
                        await tx(async (c) => {
                            const tradeIns = await c.query(`insert into trades (order_id, symbol, qty, price_brl, pool_price_brl, oracle_price_brl,
                                     exec_provider, provider_ref, chunk_ref, route_json, exec_fee_native)
                 values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                 on conflict do nothing
                 returning id`, [plan.orderId, plan.symbol, qtyOutHuman, priceBRL, priceBRL, null,
                                exec.exec_provider, chunkRef, chunkRef, exec.route, exec.fee_native]);
                            if (tradeIns.rowCount === 1) {
                                await c.query(`update wallets set balance = balance - $1, updated_at=now()
                   where (user_id, asset) = ($2,'BRL')`, [Number(chunk) / 100.0, plan.userId]);
                                if (plan.symbol !== 'USDSTABLE') {
                                    await c.query(`insert into wallets(user_id, asset, balance)
                     values ($1,$2,0)
                     on conflict (user_id, asset) do nothing`, [plan.userId, plan.symbol]);
                                    await c.query(`update wallets set balance = balance + $1, updated_at=now()
                     where (user_id, asset) = ($2,$3)`, [qtyOutHuman, plan.userId, plan.symbol]);
                                }
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
                         status = case when filled_brl_centavos + $1 >= amount_brl_centavos then 'filled'
                                       else 'partially_filled' end
                   where id = $8`, [chunk, qtyOutHuman, priceBRL, exec.exec_provider, exec.tx_hash ?? null, exec.route, exec.fee_native, plan.orderId]);
                                await c.query(`insert into provider_events (provider, event_type, external_id, payload_hash, payload_json)
                   values ($1,$2,$3, md5($4::text), $4::jsonb)
                   on conflict do nothing`, ['soroswap', 'SEND_OK', chunkRef, JSON.stringify(exec)]);
                                await c.query(`insert into provider_events (provider, event_type, external_id, payload_hash, payload_json)
                   values ($1,$2,$3, md5($4::text), $4::jsonb)
                   on conflict do nothing`, ['soroswap', 'BUY_EXECUTED', chunkRef, JSON.stringify({ order_id: plan.orderId, chunk_ref: chunkRef })]);
                                chunkBuyExecutedTotal.inc({ symbol: plan.symbol, status: 'ok' });
                            }
                            else {
                                chunkBuyExecutedTotal.inc({ symbol: plan.symbol, status: 'duplicate' });
                            }
                        });
                        // ===== Deposit into VAULT (now via gateway) =====
                        if (plan.symbol === 'USDSTABLE') {
                            const usdcOut7 = BigInt(q.amountOut || '0');
                            if (usdcOut7 > 0n) {
                                const usdcOut6 = scaleUnits(usdcOut7, 7, 6); // 1e7 -> 1e6
                                const dep = await depositToVault({
                                    userId: plan.userId,
                                    amountBaseUnits: usdcOut6, // bigint (USDC 6dps)
                                    assetSymbol: 'USDC',
                                    idempotencyKey: chunkRef,
                                });
                                await tx(async (c) => {
                                    const vaultAddr = DEFAULT_VAULT_ADDR;
                                    await c.query(`insert into vault_events (user_id, vault_address, kind, amount, shares, tx_hash, payload)
                     values ($1,$2,'DEPOSIT',$3,$4,$5,$6)`, [
                                        plan.userId,
                                        vaultAddr,
                                        Number(usdcOut6) / 1e6,
                                        String(dep.shares),
                                        dep.externalId ?? null,
                                        dep
                                    ]);
                                    await c.query(`insert into vault_positions (user_id, vault_address, base_asset, shares, principal)
                     values ($1,$2,$3,$4,$5)
                     on conflict (user_id, vault_address) do update
                       set shares = (vault_positions.shares + excluded.shares),
                           principal = (vault_positions.principal + excluded.principal),
                           updated_at = now()`, [plan.userId, vaultAddr, 'USDC', String(dep.shares), Number(usdcOut6) / 1e6]);
                                });
                            }
                        }
                        span.setAttributes({ provider: 'soroswap', provider_ref: chunkRef });
                    }
                    catch (err) {
                        await tx(async (c) => {
                            await c.query(`insert into provider_events(provider, event_type, external_id, payload_hash, payload_json)
                 values ($1,$2,$3, md5($4::text), $4::jsonb)
                 on conflict do nothing`, ['soroswap', 'SEND_ERR', chunkRef, JSON.stringify({ error: String(err?.message || err) })]);
                        });
                        chunkBuyExecutedTotal.inc({ symbol: plan.symbol, status: 'error' });
                        span.recordException(err);
                    }
                    finally {
                        endTimer();
                        span.end();
                    }
                }
            }
        });
    }
    catch (e) {
        console.error('[psp:webhook:error]', e?.stack || e);
        return res.status(500).json({ error: e.message });
    }
}
router.post('/webhooks/psp', handlePspWebhook);
router.post('/webhooks/psp/hmac', verifyPspSignature, handlePspWebhook);
export default router;
