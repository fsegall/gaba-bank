const MAX_SPREAD = Number(process.env.REFLECTOR_MAX_SPREAD_BPS || 75);
export async function getPriceReflector(pair) {
    // Ex: "USDC-BRL" ou "BRL-USD" conforme seu feed; ajuste a URL do seu provider
    // Placeholder local: devolve 0.2 USDC/BRL como preço de referência
    // Troque pela chamada real quando o feed estiver definido
    return { pair, price: 0.2, ts: Date.now() };
}
export function checkSpreadBps(oraclePrice, execPrice) {
    const spread = Math.abs(oraclePrice - execPrice) / oraclePrice;
    const bps = Math.round(spread * 10_000);
    return { bps, ok: bps <= MAX_SPREAD };
}
