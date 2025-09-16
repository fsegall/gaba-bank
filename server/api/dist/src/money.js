// src/money.ts
import { toMinor, fromMinor, priceRatioDecimals, convertUnitsByDecimals } from 'precise-money';
import { DEC } from 'precise-money';
export function getDecimalsOrThrow(symbol) {
    const d = DEC.get(symbol);
    if (typeof d !== 'number')
        throw new Error(`Missing decimals for symbol: ${symbol}`);
    return d;
}
/** Mantém a ergonomia antiga: toUnits('USDC', '12.34') */
export function toUnits(symbol, human, opts) {
    return toMinor(human, getDecimalsOrThrow(symbol), opts);
}
/** Mantém a ergonomia antiga: fromUnits('USDC', amountMinor) */
export function fromUnits(symbol, minor) {
    const dec = getDecimalsOrThrow(symbol);
    const b = typeof minor === 'bigint' ? minor : BigInt(String(minor));
    return fromMinor(b, dec);
}
/** Preço QUOTE por 1 BASE, usando decimais do QUOTE via DEC. */
export function buildPriceRatio(quoteSymbol, baseSymbol, priceStr) {
    const qDec = getDecimalsOrThrow(quoteSymbol);
    return priceRatioDecimals(qDec, priceStr); // {num, den}
}
/** Converte units entre símbolos com ratio QUOTE/BASE; arredondamento explícito. */
export function convertUnits(amountFromMinor, fromSymbol, toSymbol, price, opts) {
    const fromDec = getDecimalsOrThrow(fromSymbol);
    const toDec = getDecimalsOrThrow(toSymbol);
    return convertUnitsByDecimals(amountFromMinor, fromDec, toDec, price, opts?.mode);
}
// Re-exporta outras funções do precise-money para conveniência
export { applySlippage, scaleUnits, DEC } from 'precise-money';
