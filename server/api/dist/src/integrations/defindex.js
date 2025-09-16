// src/integrations/defindex.ts (trecho utilitário)
const MAX = Number(process.env.DEFINDEX_RETRY_MAX ?? 3);
const BASE = Number(process.env.DEFINDEX_RETRY_BACKOFF_MS ?? 500);
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function with429Retry(fn) {
    let attempt = 0;
    for (;;) {
        try {
            return await fn();
        }
        catch (e) {
            const status = e?.response?.status ?? e?.statusCode;
            if (status !== 429 || attempt >= MAX)
                throw e;
            const ra = Number(e?.response?.headers?.['retry-after']) * 1000;
            const backoff = ra && !Number.isNaN(ra)
                ? ra
                : BASE * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
            attempt++;
            await sleep(backoff);
        }
    }
}
export {};
