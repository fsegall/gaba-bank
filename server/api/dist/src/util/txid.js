// helpers/txid.ts
import { createHash } from 'crypto';
export function makeTxid(seed) {
    const base = seed.replace(/[^A-Za-z0-9]/g, '');
    const min = 26, max = 35;
    if (base.length >= min && base.length <= max)
        return base;
    const tail = createHash('sha256').update(base).digest('hex').toUpperCase();
    const need = Math.max(min - base.length, 0);
    const padded = (base + tail).slice(0, Math.max(min, Math.min(max, base.length + need)));
    return padded;
}
