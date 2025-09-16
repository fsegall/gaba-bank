// src/services/oracle.ts
import {
  rpc,
  Contract,
  TransactionBuilder,
  xdr,
  scValToNative,
} from '@stellar/stellar-sdk';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

/* ===== Env & defaults (somente em test) ===== */

// Endpoint Soroban (usa default apenas em teste)
const RPC_URL =
  process.env.SOROBAN_RPC_URL ??
  (isTest ? 'http://localhost:8000/soroban/rpc' : undefined);

// ID do contrato (usa o FX público em teste)
const REFLECTOR_ID =
  process.env.REFLECTOR_CONTRACT_ID ??
  (isTest ? 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC' : undefined);

// Passphrase default de testnet, só em teste
const PASSPHRASE =
  process.env.SOROBAN_NETWORK_PASSPHRASE ??
  (isTest ? 'Test SDF Network ; September 2015' : undefined);

// Conta G... usada como fonte para simular transações de leitura (obrigatória)
const VIEW_SOURCE =
  process.env.SOROBAN_VIEW_SOURCE ??
  (isTest ? 'GDKMJY2VWJXQAF6Y2WJ5QXFU7YQ4ZMQAWO4S3J5EZ2ZXEGQXNAVKJZ6E' : undefined);

if (!RPC_URL || !REFLECTOR_ID || !PASSPHRASE || !VIEW_SOURCE) {
  throw new Error(
    `[oracle] missing envs. Set SOROBAN_RPC_URL, REFLECTOR_CONTRACT_ID, ` +
      `SOROBAN_NETWORK_PASSPHRASE, SOROBAN_VIEW_SOURCE (ou rode com NODE_ENV=test p/ defaults).`
  );
}

/* ===== Instâncias base (não validam strkey no import) ===== */
const server = new rpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith('http://') });
const contract = new Contract(REFLECTOR_ID);

/* ==================== Helpers SEP-40 ==================== */

async function view<T>(method: string, ...args: xdr.ScVal[]): Promise<T> {
  // precisa ser uma conta G... válida (checksum ok), mas só é usada quando chamado
  const source = await server.getAccount(VIEW_SOURCE!);
  const tx = new TransactionBuilder(source, { fee: '100000', networkPassphrase: PASSPHRASE! })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
    throw new Error(`simulate failed: ${method}`);
  }
  // retval vem em XDR -> parse antes de converter pra nativo
  const scv = xdr.ScVal.fromXDR(sim.result.retval as unknown as Buffer);
  return scValToNative(scv) as T;
}

function assetOther(symbol: string): xdr.ScVal {
  // SEP-40: Asset::Other(Symbol)
  return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Other'), xdr.ScVal.scvSymbol(symbol)]);
}

function toFloat(raw: bigint, decimals: number): number {
  const s = raw.toString();
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const pad = body.padStart(decimals + 1, '0');
  return Number(`${neg ? '-' : ''}${pad.slice(0, -decimals)}.${pad.slice(-decimals)}`);
}

/* ==================== API pública ==================== */

/** Lê USDC/BRL do feed FX (base USD/USDC) */
export async function getUSDCperBRL_fromReflector(): Promise<{
  pair: 'USDC/BRL';
  price: number;
  ts: number;
  source: 'reflector';
}> {
  const base = await view<{ Stellar?: any; Other?: string }>('base'); // SEP-40 base()
  const decimals = Number(await view<number>('decimals'));
  const pd = await view<{ price: string | number; ts: string | number }>('lastprice', assetOther('BRL'));
  const brlInBase = toFloat(BigInt(String(pd.price)), decimals); // base por 1 BRL

  // Se base é USD ou USDC, então USDC/BRL = 1 / (base/BRL)
  const isUsdBase = (base as any).Other === 'USD';
  const isUsdcBase = !!(base as any).Stellar || (base as any).Other === 'USDC';
  if (!(isUsdBase || isUsdcBase)) {
    throw new Error(`Este oracle tem base diferente de USD/USDC; base=${JSON.stringify(base)}`);
  }
  return { pair: 'USDC/BRL', price: 1 / brlInBase, ts: Number(pd.ts), source: 'reflector' };
}

export async function getBRLperUSDC_fromReflector() {
  const { price, ts } = await getUSDCperBRL_fromReflector();
  return { pair: 'BRL/USDC', price: 1 / price, ts };
}

/** BRLD por paridade 1:1 com BRL (testnet): USDC/BRLD = USDC/BRL */
export async function getUSDCperBRLD_parity(): Promise<{
  pair: 'USDC/BRLD';
  price: number;
  ts: number;
  source: 'reflector+parity';
}> {
  const fx = await getUSDCperBRL_fromReflector();
  return { pair: 'USDC/BRLD', price: fx.price, ts: fx.ts, source: 'reflector+parity' };
}

/* ===== Injeção de dependências (para testes/mocks) ===== */
export const __deps = {
  getUSDCperBRLD_parity,
  getUSDCperBRL_fromReflector,
};
export function __setOracleDepsForTests(d: Partial<typeof __deps>) {
  Object.assign(__deps, d);
}

/** Circuit breaker comparando BRLD→USDC com oracle (paridade BRL) */
export async function sanityCheckBRLDUSDC(routePrice: number) {
  if (process.env.ORACLE_SANITY_ENABLED !== 'true') return { ok: true as const, reason: 'disabled' as const };
  const { price: oraclePrice } = await __deps.getUSDCperBRLD_parity(); // dependência injetável
  const spreadBps = Math.abs((routePrice - oraclePrice) / oraclePrice) * 10_000;
  if (spreadBps > Number(process.env.ORACLE_MAX_SPREAD_BPS ?? 75)) {
    throw new Error(`Oracle circuit-breaker (BRLD): spread_bps=${spreadBps.toFixed(1)} > limit`);
  }
  return { ok: true as const, spreadBps };
}

/** Circuit breaker para BRL→USDC usando o feed FX direto */
export async function sanityCheckBRLUSDC(routePrice: number) {
  if (process.env.ORACLE_SANITY_ENABLED !== 'true') return { ok: true as const, reason: 'disabled' as const };
  const { price: oraclePrice } = await __deps.getUSDCperBRL_fromReflector(); // dependência injetável
  const spreadBps = Math.abs((routePrice - oraclePrice) / oraclePrice) * 10_000;
  if (spreadBps > Number(process.env.ORACLE_MAX_SPREAD_BPS ?? 75)) {
    throw new Error(`Oracle circuit-breaker: spread_bps=${spreadBps.toFixed(1)} > limit`);
  }
  return { ok: true as const, spreadBps };
}
