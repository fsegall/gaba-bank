// src/routes/sell.ts
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { toUnits, DEC } from "../money.js";
import { getExecProvider } from "../services/execProvider/index.js";
import { tracer } from '../observability/otel.js';
import { ordersCreatedTotal, ordersFilledTotal, chunkSellExecutedTotal, chunkSellDurationSeconds, } from '../observability/metrics.js';
export const router = Router();
// por compatibilidade com o schema atual (wallets.balance):
// se quiser migrar para unidades atômicas depois, set WALLET_BALANCE_COL=balance_units
const WALLET_COL = process.env.WALLET_BALANCE_COL === "balance_units" ? "balance_units" : "balance";
const USE_UNITS = WALLET_COL === "balance_units";
// DTO
const SellSchema = z.object({
    symbol: z.string().min(2),
    amount: z.string().regex(/^\d+(\.\d+)?$/), // "0.001", "10"
    client_ref: z.string().optional(),
    chunks: z.number().int().positive().max(20).default(1),
});
// helper
function chunkUnits(total, n) {
    const base = total / BigInt(n);
    const rem = total % BigInt(n);
    const arr = Array(n).fill(base);
    for (let i = 0; i < Number(rem); i++)
        arr[i] = arr[i] + 1n;
    return arr;
}
// helper para manter consistência de toString()
function totalFilledBrlUnitsStr(v) {
    return v.toString();
}
/**
 * POST /sell
 * Headers: x-user-id (+ Authorization pelo middleware global)
 * Body: { symbol, amount, client_ref?, chunks? }
 */
router.post("/sell", async (req, res) => {
    const userId = req.header("x-user-id");
    if (!userId)
        return res.status(401).json({ error: "Missing x-user-id" });
    const parsed = SellSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { symbol, amount, client_ref, chunks } = parsed.data;
    // Guard-rails: validação de entrada
    if (amount.trim() === '' || Number(amount) <= 0) {
        return res.status(400).json({ error: "amount must be > 0" });
    }
    // Guard-rails: verificar decimais no registry
    const dIn = DEC.get('USDC');
    const dOut = DEC.get(symbol);
    if (typeof dIn !== 'number' || typeof dOut !== 'number') {
        return res.status(500).json({ error: 'Decimals registry not seeded' });
    }
    // amount (string humano) -> unidades inteiras do ativo (ex.: BTC->sats)
    const amount_units = toUnits(symbol, amount);
    const decimals = dOut; // usar o valor verificado
    if (amount_units <= 0n)
        return res.status(400).json({ error: "amount must be > 0" });
    const exec = getExecProvider();
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Idempotência simples por client_ref (opcional)
        if (client_ref) {
            const { rows } = await client.query(`SELECT id FROM orders WHERE user_id = $1 AND client_ref = $2 AND side = 'SELL' LIMIT 1`, [userId, client_ref]);
            if (rows[0]) {
                const { rows: ord } = await client.query(`SELECT o.*, COALESCE(json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS trades
           FROM orders o
           LEFT JOIN trades t ON t.order_id = o.id
           WHERE o.id = $1
           GROUP BY o.id`, [rows[0].id]);
                await client.query("COMMIT");
                return res.json(ord[0]);
            }
        }
        // Obter/lock wallets (ativo e BRL) usando a coluna configurável
        const { rows: wAssetRows } = await client.query(`SELECT user_id, asset, ${WALLET_COL} AS bal
       FROM wallets
       WHERE user_id = $1 AND asset = $2
       FOR UPDATE`, [userId, symbol]);
        if (!wAssetRows[0])
            throw new Error(`Wallet for ${symbol} not found`);
        const { rows: wBrlRows } = await client.query(`SELECT user_id, asset, ${WALLET_COL} AS bal
       FROM wallets
       WHERE user_id = $1 AND asset = 'BRL'
       FOR UPDATE`, [userId]);
        if (!wBrlRows[0])
            throw new Error("BRL wallet not found");
        const wAsset = wAssetRows[0];
        const wBrl = wBrlRows[0];
        // Saldo suficiente?
        const currentAssetUnits = USE_UNITS
            ? BigInt(wAsset.bal)
            : BigInt(Math.floor(Number(wAsset.bal) * Math.pow(10, decimals)));
        if (currentAssetUnits < amount_units)
            throw new Error("Insufficient asset balance");
        // Cria ordem
        const { rows: orderRows } = await client.query(`INSERT INTO orders (user_id, symbol, side, requested_units, client_ref, status, amount_brl_centavos, filled_brl_centavos, received_brl_centavos, filled_units, avg_price_brl_x100)
       VALUES ($1, $2, 'SELL', $3, $4, 'NEW', 0, 0, 0, 0, 0)
       RETURNING *`, [userId, symbol, amount_units.toString(), client_ref || null]);
        const order = orderRows[0];
        ordersCreatedTotal.inc({ side: 'SELL', symbol });
        // Quote (opcional no mock; custo/price)
        await exec.quoteSell({ symbol, amount_units });
        // Chunking
        const parts = chunkUnits(amount_units, chunks);
        let totalReceivedBrl = 0n;
        let totalFilledUnits = 0n;
        for (let i = 0; i < parts.length; i++) {
            const partUnits = parts[i];
            if (partUnits === 0n)
                continue;
            // === observabilidade (span + timer) ===
            const span = tracer.startSpan('sell.chunk', {
                attributes: {
                    user_id: userId,
                    symbol,
                    chunk_index: i + 1,
                    part_units: partUnits.toString(),
                },
            });
            const endTimer = chunkSellDurationSeconds.startTimer({ symbol });
            try {
                // Idempotência por chunk determinístico
                const chunkRef = `m-${order.id}-${i + 1}`;
                // Execução (provider mock/real)
                const fill = await exec.sell({ symbol, amount_units: partUnits });
                const providerRef = fill.provider_ref || chunkRef;
                // Inserção idempotente do trade (usa chunk_ref)
                const tradeIns = await client.query(`INSERT INTO trades (
              order_id, symbol, qty, price_brl,
              exec_provider, provider_ref, chunk_ref,
              filled_units, received_brl_centavos, fee_native_units
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT DO NOTHING
           RETURNING id, received_brl_centavos, filled_units`, [
                    order.id,
                    symbol,
                    Number(fill.filled_units) / Math.pow(10, decimals), // qty (humano)
                    Number(fill.received_brl_centavos) / 100.0, // price_brl (stub total; ok p/ mock)
                    process.env.EXEC_PROVIDER || "mock",
                    providerRef,
                    chunkRef,
                    fill.filled_units.toString(),
                    fill.received_brl_centavos.toString(),
                    fill.fee_native_units.toString(),
                ]);
                const isDuplicate = tradeIns.rowCount === 0;
                span.setAttributes({
                    provider_ref: providerRef,
                    chunk_ref: chunkRef,
                    received_brl_centavos: fill.received_brl_centavos.toString(),
                    filled_units: fill.filled_units.toString(),
                    duplicate: isDuplicate,
                });
                // Só aplica efeitos se este chunk ainda não havia sido processado
                if (!isDuplicate) {
                    if (USE_UNITS) {
                        // wallets em unidades atômicas
                        await client.query(`UPDATE wallets SET ${WALLET_COL} = ${WALLET_COL} - $1 WHERE user_id = $2 AND asset = $3`, [partUnits.toString(), wAsset.user_id, wAsset.asset]);
                        await client.query(`UPDATE wallets SET ${WALLET_COL} = ${WALLET_COL} + $1 WHERE user_id = $2 AND asset = 'BRL'`, [tradeIns.rows[0].received_brl_centavos, wBrl.user_id]);
                    }
                    else {
                        // wallets em unidades humanas
                        const partUnitsHuman = Number(partUnits) / Math.pow(10, decimals);
                        const receivedBrlHuman = Number(tradeIns.rows[0].received_brl_centavos) / 100.0;
                        await client.query(`UPDATE wallets SET ${WALLET_COL} = ${WALLET_COL} - $1 WHERE user_id = $2 AND asset = $3`, [partUnitsHuman, wAsset.user_id, wAsset.asset]);
                        await client.query(`UPDATE wallets SET ${WALLET_COL} = ${WALLET_COL} + $1 WHERE user_id = $2 AND asset = 'BRL'`, [receivedBrlHuman, wBrl.user_id]);
                    }
                    // provider_events (auditoria) — idempotente por (external_id/payload_hash)
                    await client.query(`INSERT INTO provider_events (provider, event_type, external_id, payload_hash, payload_json)
             VALUES ($1, $2, $3, md5($4::text), $4::jsonb)
             ON CONFLICT DO NOTHING`, [
                        process.env.EXEC_PROVIDER || "mock",
                        "SELL_EXECUTED",
                        providerRef,
                        JSON.stringify({ trade: { order_id: order.id, provider_ref: providerRef, chunk_ref: chunkRef } }),
                    ]);
                    // agrega totais
                    totalReceivedBrl += BigInt(tradeIns.rows[0].received_brl_centavos);
                    totalFilledUnits += BigInt(tradeIns.rows[0].filled_units);
                }
                // métricas (conta como ok mesmo se duplicado; o span carrega a flag)
                chunkSellExecutedTotal.inc({ symbol, status: 'ok' });
            }
            catch (e) {
                // métrica de erro + enrich do span
                chunkSellExecutedTotal.inc({ symbol, status: 'error' });
                span.recordException(e);
                span.setAttribute('error', true);
                throw e;
            }
            finally {
                endTimer();
                span.end();
            }
        }
        // Atualiza ordem (filled, avg price)
        const avgPriceBrlX100 = totalFilledUnits > 0n ? (totalReceivedBrl * 10000n) / totalFilledUnits : 0n;
        await client.query(`UPDATE orders
       SET status = 'FILLED',
           filled_units = $1,
           received_brl_centavos = $2,
           avg_price_brl_x100 = $3,
           last_filled_at = NOW()
       WHERE id = $4`, [totalFilledBrlUnitsStr(totalFilledUnits), totalReceivedBrl.toString(), avgPriceBrlX100.toString(), order.id]);
        ordersFilledTotal.inc({ side: 'SELL', symbol });
        // Retorno com trades
        const { rows: out } = await client.query(`SELECT o.*, COALESCE(json_agg(t.*) FILTER (WHERE t.id IS NOT NULL), '[]') AS trades
       FROM orders o
       LEFT JOIN trades t ON t.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`, [order.id]);
        await client.query("COMMIT");
        return res.json(out[0]);
    }
    catch (err) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: err.message || "SELL failed" });
    }
    finally {
        client.release();
    }
});
