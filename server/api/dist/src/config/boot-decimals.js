// api/src/config/boot-decimals.ts
import { DEC } from 'precise-money';
// Camada de NEGÓCIO (exibição/cálculos internos)
const businessDefaults = {
    BRL: 2,
    USDSTABLE: 6,
    USDC: 6,
    BTC: 8,
    ETH: 18,
    XLM: 7, // XLM costuma ter 7 mesmo na “ótica de negócio”
};
for (const [code, def] of Object.entries(businessDefaults)) {
    // permite override: DEC_BRL=2 etc se quiser
    const env = process.env[`DEC_${code}`];
    DEC.set(code, env ? Number(env) : def);
}
