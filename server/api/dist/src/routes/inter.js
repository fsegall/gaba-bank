// src/routes/inter.ts (somente para testes, não usar em produção ou expor externamente)
import { Router, json } from 'express';
import { upsertProviderTx } from '../repos/providerTxRepo.js';
import { createPixCharge, payPix } from '../providers/inter/client.js';
import { makeTxid } from '../util/txid.js';
export const router = Router();
const fmtAmount = (v) => {
    const n = typeof v === 'string' ? Number(v) : v;
    if (!Number.isFinite(n))
        throw new Error('amount must be a number');
    return n.toFixed(2); // "100.00"
};
// Cash-in: cria cobrança PIX (INSERT inicial -> exige user_id)
router.post('/inter/deposits', async (req, res, next) => {
    try {
        const { user_id, amount, payer } = req.body;
        if (!user_id)
            return res.status(400).json({ error: 'user_id required' });
        if (amount == null)
            return res.status(400).json({ error: 'amount required' });
        const txid = makeTxid(`dep_${user_id}_${Date.now()}`);
        const cob = await createPixCharge({ txid, amount: fmtAmount(amount), payer });
        await upsertProviderTx({
            provider: 'inter',
            kind: 'deposit',
            external_id: txid,
            status: 'started',
            user_id,
            amount_in_units: Math.round(Number(amount) * 100), // centavos
            asset_code: 'BRL',
            metadata: cob,
        });
        res.json({ txid, cob });
    }
    catch (e) {
        next(e);
    }
});
// Webhook Inter: depósito liquidado (UPDATE subsequente -> user_id pode ser null)
router.post('/webhooks/inter', json(), async (req, res, next) => {
    try {
        const evt = req.body;
        const pix = evt?.pix?.[0] ?? evt; // alguns webhooks vêm com array em "pix"
        const txid = pix?.txid;
        // alguns payloads trazem valor direto; outros, objeto valor{original:"..."}
        const valor = pix?.valor?.original ?? pix?.valor;
        if (!txid)
            return res.sendStatus(400);
        await upsertProviderTx({
            provider: 'inter',
            kind: 'deposit',
            external_id: txid,
            status: 'completed',
            user_id: null,
            amount_in_units: valor ? Math.round(Number(valor) * 100) : null,
            asset_code: 'BRL',
            metadata: evt,
        });
        // TODO: mapear txid -> to_pubkey e creditar on-chain (USDC)
        res.sendStatus(200);
    }
    catch (e) {
        next(e);
    }
});
// Cash-out: enviar PIX (INSERT/started; depois marcar completed ao confirmar)
router.post('/inter/payouts', async (req, res, next) => {
    try {
        const { user_id, chave, amount, descricao } = req.body;
        if (!user_id || !chave || amount == null) {
            return res.status(400).json({ error: 'user_id, chave, amount required' });
        }
        // idempotência do Banking v2 (não é o txid da COB!)
        const idempotency = `out_${user_id}_${Date.now()}`;
        const resp = await payPix({
            idempotency,
            chave,
            amount: fmtAmount(amount),
            descricao,
        });
        await upsertProviderTx({
            provider: 'inter',
            kind: 'withdraw',
            external_id: idempotency,
            status: 'started',
            user_id,
            amount_out_units: Math.round(Number(amount) * 100),
            asset_code: 'BRL',
            metadata: resp,
        });
        res.json({ idempotency, result: resp });
    }
    catch (e) {
        next(e);
    }
});
