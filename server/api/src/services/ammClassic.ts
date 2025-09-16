// src/services/ammClassic.ts (novo helper)

const HORIZON = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const ONCHAIN_DEC = Number(process.env.SOROSWAP_ONCHAIN_DEC || 7);
const FEE = 0.003; // 30 bp

export async function quoteClassic({
  assetA, // "BRLD:GCX..."
  assetB, // "USDC:GCX..."
  amountIn // string em unidades on-chain (10^7 se ONCHAIN_DEC=7)
}: { assetA: string; assetB: string; amountIn: string }) {
  // 1) Descobre a pool (fee=30): 
  const url = `${HORIZON}/liquidity_pools?reserves=${encodeURIComponent(assetA)},${encodeURIComponent(assetB)}&fee_bp=30`;
  const j: any = await (await fetch(url)).json();
  const pool = (j && j._embedded && j._embedded.records && j._embedded.records[0]) || null;
  if (!pool) return { reason: 'NO_POOL', amountOut: null as any, poolId: null as any };

  // 2) Lê reservas (em “human units”):
  // a ordem das reserves segue a ordem “reserves=assetA,assetB” da query acima
  const X = Number(pool.reserves[0].amount);
  const Y = Number(pool.reserves[1].amount);

  // 3) Converte amountIn (on-chain) p/ “human” (dec=7)
  const dx = Number(amountIn) / Math.pow(10, ONCHAIN_DEC);

  // 4) Aplica fee e calcula out (x*y = k): out = Y - (X*Y)/(X + dx*(1-fee))
  const dxEff = dx * (1 - FEE);
  const outHuman = Y - (X * Y) / (X + dxEff);

  // 5) Volta p/ on-chain units (inteiro):
  const outUnits = Math.max(0, Math.floor(outHuman * Math.pow(10, ONCHAIN_DEC)));

  return {
    amountOut: String(outUnits),
    poolId: pool.id,
    price: outHuman / dxEff,           // preço efetivo (USDC por BRLD)
    reserves: { X, Y },
  };
}
