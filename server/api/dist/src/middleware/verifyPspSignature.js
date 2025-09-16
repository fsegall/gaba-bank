import crypto from 'crypto';
import { pspWebhookBadSignatureTotal, pspWebhookHandledTotal, } from '../observability/metrics.js';
const timingSafeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);
export function verifyPspSignature(req, res, next) {
    const secret = process.env.PSP_WEBHOOK_SECRET || '';
    const tolerance = Number(process.env.PSP_WEBHOOK_TOLERANCE_MS || 300000);
    const sig = req.header('X-Signature') || req.header('X-PSP-Signature');
    const tsHeader = req.header('X-Timestamp') || req.header('X-PSP-Timestamp');
    if (!sig || !tsHeader) {
        pspWebhookBadSignatureTotal.inc();
        pspWebhookHandledTotal.inc({ outcome: 'bad_signature' });
        return res.status(400).json({ error: 'missing_signature' });
    }
    const ts = Number(tsHeader);
    if (!Number.isFinite(ts)) {
        pspWebhookBadSignatureTotal.inc();
        pspWebhookHandledTotal.inc({ outcome: 'bad_signature' });
        return res.status(400).json({ error: 'bad_timestamp' });
    }
    const now = Date.now();
    if (Math.abs(now - ts) > tolerance) {
        pspWebhookHandledTotal.inc({ outcome: 'replay_window' });
        return res.status(401).json({ error: 'replay_window' });
    }
    const expected = crypto.createHmac('sha256', secret).update(`${ts}.`).update(req.rawBody || '').digest('hex');
    const got = sig.replace(/^v1=/, '');
    const ok = timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(got, 'hex'));
    if (!ok) {
        pspWebhookBadSignatureTotal.inc();
        pspWebhookHandledTotal.inc({ outcome: 'bad_signature' });
        return res.status(401).json({ error: 'invalid_signature' });
    }
    return next();
}
