// src/lib/decimals.ts
// Convenção de casas decimais por asset na CAMADA DE NEGÓCIO.
// Nota: em Stellar "classic" os amounts têm 7 casas no ledger;
// aqui mantemos USDC:6 na aplicação e convertemos na borda on-chain quando necessário.
export const ASSET_DECIMALS = {
    BRL: 2,
    USDC: 6,
    BTC: 8,
    ETH: 18,
};
function getDecimals(symbol) {
    const d = ASSET_DECIMALS[symbol];
    if (d === undefined)
        throw new Error(`Unknown decimals for ${symbol}`);
    return d;
}
// ----- normalização segura -----
// Aceita: "1.234,56", "1_234.56", "  -12.3  ", etc. → "-1234.56"
function normalizeAmountInput(x) {
    let s = typeof x === 'number' ? String(x) : x;
    s = s.trim();
    if (s === '')
        throw new Error('empty amount');
    // Remove separadores de milhar comuns e converte vírgula decimal para ponto
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
    const int = iRaw.replace(/^0+(?=\d)/, '') || '0'; // tira zeros à esquerda
    const frac = fRaw;
    return { sign, int, frac };
}
// ----- conversões principais -----
// "12.3456" -> bigint em unidades (10^decimals), com arredondamento configurável
export function toUnits(symbol, amount, mode = 'half_up') {
    const decimals = getDecimals(symbol);
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
export function fromUnits(symbol, units) {
    const decimals = getDecimals(symbol);
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
// Exibição com agrupamento; cai para fallback seguro p/ inteiros enormes
export function formatUnits(symbol, units, locale = 'pt-BR', minFrac, maxFrac) {
    const raw = fromUnits(symbol, units);
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
// ----- helpers de cálculo com bigint -----
// a*b / c com arredondamento (default half_up)
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
// ----- preço/cotação como razão sem float -----
// Representa um preço como fração N/D (ambos inteiros escalados por casas do asset alvo/origem)
// Ex.: priceRatio('BRL','USDC','5.4321') → BRL/USDC
export function priceRatio(quoteSymbol, baseSymbol, priceStr) {
    // preço = quote per base (ex.: BRL por 1 USDC)
    const qDec = getDecimals(quoteSymbol);
    const [sign, int, frac] = (() => {
        const n = normalizeAmountInput(priceStr);
        if (n.sign < 0n)
            throw new Error('negative price not allowed');
        return [n.sign, n.int, n.frac];
    })();
    const scaled = BigInt(int + (frac + '0'.repeat(qDec)).slice(0, qDec)); // scale para quote.decimals
    // num/den tal que: baseUnits * num / den = quoteUnits
    // para 1 base → priceStr * 10^qDec quoteUnits
    return { num: scaled, den: 10n ** BigInt(qDec) };
}
// Converte unidades via razão (ex.: BRL->USDC dado BRL/USDC)
export function convertUnits(amountUnits, fromSymbol, toSymbol, price, // quote per base
mode = 'half_up') {
    // Se price é QUOTE/BASE (ex.: BRL/USDC), então:
    //   baseUnits * num/den = quoteUnits
    // Precisamos mapear decimais: from→to com ajuste de casas
    const fromDec = getDecimals(fromSymbol);
    const toDec = getDecimals(toSymbol);
    // Queremos: amount_from_units * (num/den) * 10^(toDec-fromDec)
    const scale = 10n ** BigInt(toDec - fromDec);
    return mulDiv(mulDiv(amountUnits, price.num, price.den, mode), scale, 1n, mode);
}
