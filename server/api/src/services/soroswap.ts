// api/src/services/soroswap.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { Keypair, Networks, Transaction } from "@stellar/stellar-sdk";
import { getServer } from "../lib/stellarCompat.js";
import { signWithCLI, submitSignedXDR } from "../lib/stellarSigner.js";
import { fromUnits, DEC } from "../money.js";
import fs from "node:fs";



// ---------- Helpers/Config ----------
const HOST = process.env.SOROSWAP_HOST!;
const NETWORK = process.env.SOROSWAP_NETWORK || "testnet";
const API_KEY =
  process.env.SOROSWAP_API_KEY ??
  (process.env.SOROSWAP_API_KEY_FILE
    ? fs.readFileSync(process.env.SOROSWAP_API_KEY_FILE, 'utf8').trim()
    : undefined);
    const HORIZON_URL =
    process.env.HORIZON_URL ||
    process.env.STELLAR_RPC_URL || // seu .env já tem esta
    'https://horizon-testnet.stellar.org'; // fallback seguro
const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === "public" ? Networks.PUBLIC : Networks.TESTNET;
const TREASURY_PUB = process.env.STELLAR_TREASURY_PUBLIC!;
const server = getServer(HORIZON_URL);

// Horizon HTTP para consultas REST (Classic AMM)
const horizon = axios.create({
  baseURL: HORIZON_URL,
  timeout: 15_000,
});

// Decimais on-chain (testnet soroban / padrão usado na app)
const ONCHAIN_DEC = Number(process.env.SOROSWAP_ONCHAIN_DEC || 7);

// helpers
const isClassic = (a: string) => a.includes(":") && !a.startsWith("C");


if (!API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("[soroswap] rodando sem API key (endpoints públicos)");
}


let http: AxiosInstance;
function getHttp() {
  if (!http) {
    const headers: Record<string, string> = {};
    if (API_KEY && API_KEY.length > 0) {
      if (API_KEY && API_KEY.length > 0) {
        // ✅ Formato correto para Soroswap
        headers.Authorization = `Bearer ${API_KEY}`;
      }
    }
    http = axios.create({
      baseURL: HOST,
      headers,
      timeout: 15_000,
    });
  }
  return http;
}

class QuoteError extends Error { constructor(msg: string, public data?: any){ super(msg); this.name = "QUOTE_ERROR"; } }
class BuildError extends Error { constructor(msg: string, public data?: any){ super(msg); this.name = "BUILD_ERROR"; } }
class SubmitError extends Error { constructor(msg: string, public data?: any){ super(msg); this.name = "SUBMIT_ERROR"; } }

// Pequeno backoff p/ 429/5xx (evita “Too Many Requests” estourar chunk)
async function withRetry<T>(fn: () => Promise<T>, tag: string, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      const status = (e as AxiosError)?.response?.status;
      if (status && status < 500 && status !== 429) break;     // 4xx (exceto 429) não re-tenta
      await new Promise(r => setTimeout(r, 250 * (2 ** i)));   // 250ms, 500ms, 1s
    }
  }
  throw lastErr ?? new Error(`${tag}: failed`);
}

// ---------- Tipos (alinhados ao QuoteDto do spec) ----------
type QuoteRequest = {
  assetIn: string;
  assetOut: string;
  amount: string;                 // unidades mínimas do token de entrada
  tradeType: "EXACT_IN" | "EXACT_OUT";
  protocols: string[];            // ["soroswap","phoenix","aqua","sdex"]
  parts?: number;
  slippageBps?: number;
  maxHops?: number;
  assetList?: string[];
  feeBps?: number;
  gaslessTrustline?: "create";
};

type QuoteResponse = {
  assetIn: string;
  assetOut: string;
  amountIn?: string;
  amountOut?: string;
  otherAmountThreshold?: string;  // == minOut para EXACT_IN
  tradeType: "EXACT_IN" | "EXACT_OUT";
  platform?: "router" | "aggregator" | "sdex";
  priceImpactPct?: string;
  rawTrade?: any;
  routePlan?: any[];
  gaslessTrustline?: "create";
  platformFee?: { feeBps: number; feeAmount: number };
};

async function quoteClassic({
  assetIn,
  assetOut,
  amountIn,           // on-chain units (10^ONCHAIN_DEC)
  slippageBps = 50,   // default 0.50%
}: {
  assetIn: string;
  assetOut: string;
  amountIn: string;
  slippageBps?: number;
}) {
  // 1) Descobrir a pool (fee = 30 bp)
  const params = {
    reserves: `${assetIn},${assetOut}`,
    fee_bp: 30,
  };
  const resp: AxiosResponse<any> = await horizon.get("/liquidity_pools", { params });
  const pool = resp.data?._embedded?.records?.[0];
  if (!pool) throw new QuoteError("NO_POOL", { params, resp: resp.data });

  // 2) Mapear reservas na mesma ordem dos assets solicitados
  const rIn  = pool.reserves.find((r: any) => r.asset === assetIn);
  const rOut = pool.reserves.find((r: any) => r.asset === assetOut);
  if (!rIn || !rOut) throw new QuoteError("POOL_RESERVES_MISMATCH", { pool });

  const X = Number(rIn.amount);   // reserva do token de entrada
  const Y = Number(rOut.amount);  // reserva do token de saída
  if (!(X > 0 && Y > 0)) throw new QuoteError("EMPTY_RESERVES", { X, Y });

  // 3) amountIn: on-chain -> “human”
  const dx = Number(amountIn) / Math.pow(10, ONCHAIN_DEC);

  // 4) Produto constante com fee = 0.003 (30 bp)
  const FEE = 0.003;
  const dxEff = dx * (1 - FEE);
  // out = Y - (X*Y) / (X + dxEff)
  const outHuman = Y - (X * Y) / (X + dxEff);
  const outUnits = Math.max(0, Math.floor(outHuman * Math.pow(10, ONCHAIN_DEC)));

  // 5) minOut (slippage local)
  const minOutUnits = Math.floor(outUnits * (1 - slippageBps / 10_000));

  // preço efetivo (assetOut por assetIn) em “human” — útil p/ debug
  const price = dxEff > 0 ? outHuman / dxEff : 0;

  // Monta um objeto “estilo aggregator” para manter compatibilidade do endpoint
  const qLike = {
    assetIn,
    assetOut,
    amountIn: amountIn,
    amountOut: String(outUnits),
    otherAmountThreshold: String(minOutUnits),
    tradeType: "EXACT_IN" as const,
    platform: "sdex" as const,         // sinaliza que veio da Classic AMM
    routePlan: [{
      platform: "sdex",
      poolId: pool.id,
      fee_bp: 30,
      reserves: pool.reserves,
    }],
  };

  return { qLike, meta: { poolId: pool.id, price, reserves: { X, Y } } };
}


// ---------- Core API calls ----------
export async function getQuote(req: QuoteRequest): Promise<QuoteResponse> {
  return withRetry(async () => {
    const { data, status } = await getHttp().post(`/quote`, req, { params: { network: NETWORK } });
    if (status >= 400) throw new QuoteError("Erro ao obter quote", data);

    // normaliza números vindos como number -> string
    if (typeof (data as any)?.amountOut === "number") (data as any).amountOut = String((data as any).amountOut);
    if (typeof (data as any)?.amountIn  === "number") (data as any).amountIn  = String((data as any).amountIn);
    if (typeof (data as any)?.otherAmountThreshold === "number") (data as any).otherAmountThreshold = String((data as any).otherAmountThreshold);
    return data as QuoteResponse;
  }, "SOROSWAP_QUOTE");
}

export async function buildSwapTx(quote: QuoteResponse, from: string = TREASURY_PUB, to: string = TREASURY_PUB) {
  return withRetry(async () => {
    const { data, status } = await getHttp().post(`/quote/build`, { quote, from, to }, { params: { network: NETWORK } });
    if (status >= 400) throw new BuildError("Erro ao buildar swap", data);
    return data as { xdr?: string; transaction_xdr?: string };
  }, "SOROSWAP_BUILD");
}

export async function signAndSubmit(xdrB64: string) {
  const secret =
    process.env.STELLAR_TREASURY_SECRET?.trim() ||
    (process.env.STELLAR_TREASURY_SECRET_FILE
      ? fs.readFileSync(process.env.STELLAR_TREASURY_SECRET_FILE, "utf8").trim()
      : "");

  if (secret) {
    // caminho DEV: assina via SDK
    const kp = Keypair.fromSecret(secret);
    const tx = new Transaction(xdrB64, NETWORK_PASSPHRASE);
    tx.sign(kp);
    return server.submitTransaction(tx);
  } else {
    // caminho SEGURO: assina via CLI (secure store no host, se você optar por rodar fora do container)
    const signed = await signWithCLI(xdrB64, "defy-treasury");
    return submitSignedXDR(signed);
  }
}

// ---------- Facade usado pelas rotas ----------
export const soroswap = {
  async quote({ pair, amountIn }: { pair: string; amountIn: string }) {
    const [codeIn, codeOut] = pair.split("-");
    const envIn  = `STELLAR_ASSET_${codeIn}`;
    const envOut = `STELLAR_ASSET_${codeOut}`;
    const assetIn  = process.env[envIn]!;
    const assetOut = process.env[envOut]!;
  
    if (!assetIn)  throw new QuoteError(`Asset env não definido: ${envIn}`);
    if (!assetOut) throw new QuoteError(`Asset env não definido: ${envOut}`);
  
    // === Fallback para Classic AMM se ambos forem CODE:ISSUER ===
    if (isClassic(assetIn) && isClassic(assetOut)) {
      const { qLike, meta } = await quoteClassic({
        assetIn, assetOut, amountIn, slippageBps: 50,
      });
  
      // preço de “meio” como no caminho atual (só para compat)
      let poolMid = 0;
      try {
        const brlHuman = fromUnits(codeIn, amountIn);
        const outHuman = fromUnits(codeOut, qLike.amountOut!);
        if (Number(outHuman) > 0) poolMid = Number(brlHuman) / Number(outHuman);
      } catch { /* noop */ }
  
      return {
        amountOut: qLike.amountOut!,
        amountIn:  qLike.amountIn!,
        minOut:    qLike.otherAmountThreshold || "0",
        poolMid,
        route: qLike,                      // mantém shape para a UI/rotas
        poolId: meta.poolId,
        price: meta.price,
        reserves: meta.reserves,
      };
    }
  
    // === Soroswap Aggregator (contratos C...) ===
    const q = await getQuote({
      assetIn, assetOut, amount: amountIn,
      tradeType: "EXACT_IN",
      protocols: ["soroswap","phoenix","aqua","sdex"],
      parts: 10,
      maxHops: 2,
      slippageBps: 50,
      // gaslessTrustline: "create", // se desejar
    });
  
    if (!q.amountOut) throw new QuoteError("amountOut ausente na quote", q);
  
    let poolMid = 0;
    try {
      const brlHuman = fromUnits(codeIn, amountIn);
      const outHuman = fromUnits(codeOut, q.amountOut);
      if (Number(outHuman) > 0) poolMid = Number(brlHuman) / Number(outHuman);
    } catch { /* noop */ }
  
    return {
      amountOut: String(q.amountOut),
      amountIn:  String(q.amountIn ?? amountIn),
      minOut:    String(q.otherAmountThreshold || "0"),
      poolMid,
      route: q,
    };
  },
  // Usa a quote/route retornada acima para buildar e enviar
  async swap({ route, amountIn, minOut }: { route: any; amountIn: string; minOut: string }) {
    try {
      const q: QuoteResponse = route as QuoteResponse;

      // guardas locais (evita enviar algo impossível)
      if (q.otherAmountThreshold && BigInt(minOut) > BigInt(q.otherAmountThreshold)) {
        throw new BuildError("minOut local > threshold do agregador", { minOut, threshold: q.otherAmountThreshold });
      }
      if (q?.amountOut && BigInt(q.amountOut) < BigInt(minOut)) {
        throw new BuildError("amountOut < minOut (slippage guard)", { routeAmountOut: q.amountOut, minOut });
      }

      const built = await buildSwapTx(q, TREASURY_PUB, TREASURY_PUB);
      const xdr = (built as any).xdr || (built as any).transaction_xdr;
      if (!xdr) throw new BuildError("Swap build não retornou XDR", built);

      const res = await signAndSubmit(xdr);
      return {
        exec_provider: "soroswap",
        route: q.routePlan ?? q,
        fee_native: (res as any).fee_charged ?? null,
        tx_hash: (res as any).hash ?? null,
      };
    } catch (e: any) {
      if (e?.name === "BUILD_ERROR" || e?.name === "SUBMIT_ERROR") throw e;
      throw new SubmitError("Falha no swap", e?.response?.data ?? e);
    }
  },
};