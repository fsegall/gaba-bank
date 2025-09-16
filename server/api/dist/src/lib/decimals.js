// src/lib/decimals.ts
// ----------------------------------------------
// CAMADA DE NEGÓCIO (defaults da aplicação)
// Nota: em Stellar "classic" os amounts têm 7 casas no ledger;
// aqui mantemos, por convenção de UX/negócio, algumas diferenças
// (ex.: USDC:6) e convertemos na borda on-chain quando necessário.
// ----------------------------------------------
export const ASSET_DECIMALS = {
    BRL: 2,
    USDC: 6,
    BTC: 8,
    ETH: 18,
};
const REGISTRY = {};
// Normaliza chave: "USDC" ou "USDC:GA...ISSUER"
export function assetKey(codeOrKey, issuer) {
    return (issuer ? `${codeOrKey}:${issuer}` : codeOrKey).toUpperCase();
}
// Lê ENV para um code simples (sem issuer)
function envDecimals(codeUpper) {
    const envKey = `STELLAR_DECIMALS_${codeUpper}`;
    const v = process.env[envKey];
    if (v !== undefined) {
        const n = Number(v);
        if (Number.isFinite(n))
            return n;
    }
    return undefined;
}
export const DEC = {
    set(symbolOrKey, decimals) {
        const key = assetKey(symbolOrKey);
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
            throw new Error(`invalid decimals for ${key}: ${decimals}`);
        }
        REGISTRY[key] = decimals;
    },
    get(symbolOrKey) {
        const key = assetKey(symbolOrKey);
        // 1) registry explícito
        if (typeof REGISTRY[key] === 'number')
            return REGISTRY[key];
        // 2) ENV (somente para o code sem issuer)
        const [code] = key.split(':');
        const env = envDecimals(code);
        if (env !== undefined) {
            REGISTRY[key] = env;
            return env;
        }
        // 3) defaults de negócio
        const business = ASSET_DECIMALS[code];
        if (typeof business === 'number') {
            REGISTRY[key] = business;
            return business;
        }
        // 4) fallback
        REGISTRY[key] = 7;
        return 7;
    },
};
// Backward-compat: função interna para obter decimais
function getDecimals(symbolOrKey) {
    return DEC.get(symbolOrKey);
}
// ----------------------------------------------
// Normalização segura de entrada humana
// Aceita: "1.234,56", "1_234.56", "  -12.3  ", etc. → "-1234.56"
// ----------------------------------------------
function normalizeAmountInput(x) {
    let s = typeof x === 'number' ? String(x) : x;
    s = s.trim();
    if (s === '')
        throw new Error('empty amount');
    s = s
        .replace(/_/g, '')
        .replace(/\s+/g, '')
        .replace(/(\d)[.,](?=\d{3}(\D|$))/g, '$1') // remove milhar: 1.234/1,234
        .replace(/,/g, '.'); // vírgula decimal → ponto
    let sign = 1n;
    if (s.startsWith('+'))
        s = s.slice(1);
    else if (s.startsWith('-')) {
        sign = -1n;
        s = s.slice(1);
    }
    if (!/^\d+(\.\d+)?$/.test(s))
        throw new Error(`invalid amount: ${x}`);
    const [iRaw, fRaw = ''] = s.split('.');
    const int = iRaw.replace(/^0+(?=\d)/, '') || '0';
    const frac = fRaw;
    return { sign, int, frac };
}
// ----------------------------------------------
// Conversões principais
// ----------------------------------------------
// "12.3456" -> bigint em unidades (10^decimals), com arredondamento
export function toUnits(symbolOrKey, amount, mode = 'half_up') {
    const decimals = getDecimals(symbolOrKey);
    const { sign, int, frac } = normalizeAmountInput(amount);
    const wanted = (frac + '0'.repeat(decimals)).slice(0, decimals);
    const extra = frac.slice(decimals); // dígitos além do limite
    let units = BigInt(int + (decimals ? wanted : ''));
    if (extra.length > 0) {
        const anyExtra = /[1-9]/.test(extra);
        const firstExtra = Number(extra[0] ?? '0');
        if (mode === 'half_up' && firstExtra >= 5)
            units += 1n;
        else if (mode === 'ceil' && sign > 0n && anyExtra)
            units += 1n;
        else if (mode === 'floor' && sign < 0n && anyExtra)
            units += 1n;
        // trunc: não arredonda
    }
    return sign * units;
}
// bigint unidades -> string humana precisa (sem agrupamento)
export function fromUnits(symbolOrKey, units) {
    const decimals = getDecimals(symbolOrKey);
    const sign = units < 0n ? '-' : '';
    const abs = units < 0n ? -units : units;
    const s = abs.toString();
    if (decimals === 0)
        return sign + s;
    const pad = s.padStart(decimals + 1, '0');
    const i = pad.slice(0, -decimals);
    const f = pad.slice(-decimals).replace(/0+$/, '');
    return sign + (f ? `${i}.${f}` : i);
}
// Exibição com agrupamento
export function formatUnits(symbolOrKey, units, locale = 'pt-BR', minFrac, maxFrac) {
    const raw = fromUnits(symbolOrKey, units);
    const [i, f = ''] = raw.replace('-', '').split('.');
    if (i.length <= 15) {
        const n = Number(raw);
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: minFrac ?? 0,
            maximumFractionDigits: maxFrac ?? f.length,
        }).format(n);
    }
    const [sign, body] = raw.startsWith('-') ? ['-', raw.slice(1)] : ['', raw];
    const [intPart, fracPart] = body.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return sign + (fracPart ? `${grouped},${fracPart}` : grouped);
}
// ----------------------------------------------
// Helpers de cálculo com bigint
// ----------------------------------------------
export function mulDiv(a, b, c, mode = 'half_up') {
    const bb = typeof b === 'number' ? BigInt(b) : b;
    const cc = typeof c === 'number' ? BigInt(c) : c;
    if (cc === 0n)
        throw new Error('division by zero');
    const neg = (a < 0n) !== (bb < 0n);
    const A = a < 0n ? -a : a;
    const B = bb < 0n ? -bb : bb;
    const C = cc < 0n ? -cc : cc;
    const q = (A * B) / C;
    const r = (A * B) % C;
    if (r === 0n)
        return neg ? -q : q;
    if (mode === 'trunc')
        return neg ? -q : q;
    if (mode === 'floor')
        return neg ? -(q + 1n) : q;
    if (mode === 'ceil')
        return neg ? -q : (q + 1n);
    // half_up:
    const half = (C - 1n) / 2n;
    const rounded = q + (r > half ? 1n : 0n);
    return neg ? -rounded : rounded;
}
// aplica porcentagem em bps (25 bps = 0,25%)
export const applyBps = (units, bps, mode = 'half_up') => mulDiv(units, bps, 10000n, mode);
// ----------------------------------------------
// Preço/cotação como razão (sem float)
// priceRatio(quote/base, "5.4321") → {num, den} com escala do quote
// ----------------------------------------------
export function priceRatio(quoteSymbolOrKey, baseSymbolOrKey, priceStr) {
    // preço = QUOTE por 1 BASE (ex.: BRL por 1 USDC)
    const qDec = getDecimals(quoteSymbolOrKey);
    const n = normalizeAmountInput(priceStr);
    if (n.sign < 0n)
        throw new Error('negative price not allowed');
    const scaled = BigInt(n.int + (n.frac + '0'.repeat(qDec)).slice(0, qDec)); // escala = 10^qDec
    return { num: scaled, den: 10n ** BigInt(qDec) };
}
// Converte unidades via razão (ex.: BRL->USDC dado preço BRL/USDC)
export function convertUnits(amountUnits, fromSymbolOrKey, toSymbolOrKey, price, // QUOTE/BASE
mode = 'half_up') {
    const fromDec = getDecimals(fromSymbolOrKey);
    const toDec = getDecimals(toSymbolOrKey);
    // Ajuste de escala entre decimais (sem expoente negativo)
    const diff = toDec - fromDec;
    const scaleNum = diff >= 0 ? 10n ** BigInt(diff) : 1n;
    const scaleDen = diff < 0 ? 10n ** BigInt(-diff) : 1n;
    // amount_from * (num/den) * (scaleNum/scaleDen)
    return mulDiv(mulDiv(amountUnits, price.num, price.den, mode), scaleNum, scaleDen, mode);
}
// ----------------------------------------------
// Aliases convenientes (compatibilidade com código existente)
// ----------------------------------------------
export function toMinor(human, symbolOrKey, mode = 'half_up') {
    return toUnits(symbolOrKey, human, mode).toString();
}
export function fromMinor(minor, symbolOrKey) {
    const d = getDecimals(symbolOrKey);
    const b = typeof minor === 'bigint' ? minor : BigInt(String(minor));
    return Number(b) / 10 ** d;
}
// --- Slippage helpers (unidades mínimas, BigInt) ---
export const clampBps = (bps) => Math.max(0, Math.min(10_000, Math.trunc(bps)));
export function slippageDown(amountMinor, bps) {
    const b = BigInt(clampBps(bps));
    // EXACT_IN → proteger para baixo (minOut)
    return (amountMinor * (10000n - b)) / 10000n;
}
export function slippageUp(amountMinor, bps) {
    const b = BigInt(clampBps(bps));
    // EXACT_OUT → proteger para cima (maxIn)
    return (amountMinor * (10000n + b) + 9999n) / 10000n; // arredonda pra cima
}
// Mantém sua API:
export const applySlippage = (minorAmount, slippageBps) => slippageDown(typeof minorAmount === 'bigint' ? minorAmount : BigInt(String(minorAmount)), slippageBps);
// --- Units scaling (BigInt) ---
export const scaleUnits = (u, fromDec, toDec) => fromDec === toDec ? u :
    fromDec < toDec ? u * 10n ** BigInt(toDec - fromDec)
        : u / 10n ** BigInt(fromDec - toDec);
