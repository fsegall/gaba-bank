// src/defi/math.ts
import { convertUnitsByDecimals } from 'precise-money';
import { DEC } from 'precise-money';
import { slippageDown, slippageUp } from 'precise-money';
// Inverte razão (num/den)
export const invert = (p) => ({ num: p.den, den: p.num });
function dec(sym) {
    const d = DEC.get(sym);
    if (typeof d !== 'number')
        throw new Error(`Missing decimals for ${sym}`);
    return d;
}
// EXACT_IN: usuário define amountIn (IN→OUT)
export function quoteExactIn(params) {
    const { amountInMinor, inSymbol, outSymbol, priceQuotePerBase, mode = 'round', slippageBps = 0 } = params;
    if (amountInMinor <= 0n)
        throw new Error('amountIn must be > 0');
    const expOut = convertUnitsByDecimals(amountInMinor, dec(inSymbol), dec(outSymbol), priceQuotePerBase, mode);
    const minOut = slippageDown(expOut, slippageBps);
    return { expectedOutMinor: expOut, minOutMinor: minOut };
}
// EXACT_OUT: usuário define amountOut (OUT←IN)
export function quoteExactOut(params) {
    const { amountOutMinor, inSymbol, outSymbol, priceQuotePerBase, mode = 'round', slippageBps = 0 } = params;
    if (amountOutMinor <= 0n)
        throw new Error('amountOut must be > 0');
    const expIn = convertUnitsByDecimals(amountOutMinor, dec(outSymbol), dec(inSymbol), priceQuotePerBase, mode);
    const maxIn = slippageUp(expIn, slippageBps);
    return { expectedInMinor: expIn, maxInMinor: maxIn };
}
