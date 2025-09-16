# Defy Invest — MVP (Stellar Hackathon)

> **One‑liner**: Deposit via **Pix** and buy/sell crypto **in real time** with basic KYC, auditing, **composable on‑chain execution** (Soroswap/Phoenix/Aqua/SDEX) and, in the next stage, **community credit** (crowdfunding) via **Soroban** for impact projects in quilombola communities.

**Status**: MVP in development · **Target delivery**: 15/09/2025 · Timezone: `America/Sao_Paulo`

---

## 0) Hackathon Position

**Recommended track**: **Composability** (up to US$ 30k in XLM)

* Integrates **PSP → API → DEX/AMM** via **Soroswap Aggregator** (fallback Phoenix/Aqua/SDEX), with Horizon/Jaeger/Grafana/Prometheus and Postgres.
* **Public and modular liquidity**: creation/consumption of pools on testnet, including our own **BRL token (7d)** and **BRL↔USDC (LP)** pool to ensure stable route and demonstrate interoperability in the Stellar ecosystem.
* **Defindex (Vaults, custodial model)**: BRL → USDC (Soroswap) → **deposit/withdraw in Vault** via SDK; **shares** custodied by treasury in MVP; fits with **composability** thesis (Aggregator + Vaults) and simplifies **strategies/yield** delivery.
* **Reflector Oracle** in execution loop (optional): *sanity check* of route/price vs pool with **guard rails** (slippage/spread).
* **Anchors (SEP-10/24/38)** in Pix → on-chain allocation flow (firm/indicative quotes, when needed), with **treasury custody** in MVP.
* Step 2 (social impact): **Soroban credit/crowdfunding module**, closing the cycle "deposit → investment → community financing".

---

## 1) Vision

**Defy Invest** transforms **Pix** deposits into **on‑chain** purchasing power. When Pix is confirmed, the API credits BRL and triggers **autobuy** with **guard rails** (idempotency, reconciliation, *slippage guard* and *sanity check* of price via **Reflector**). Execution is **composable** with **Soroswap** (aggregator + builder), metrics (Prometheus) and *tracing* (OpenTelemetry → Jaeger).

In the expanded scope, part of the returns and/or contributions can be directed to **community credit funds**, where quilombola projects are **proposed, financed and monitored** in a **Soroban contract** (P2P crowdfunding/lending).

---

## 2) Architecture (high level)

```
[Web App] ──HTTP──> [Defy API]
                    │
                    ├─▶ [PSP Pix Adapter] ──(webhook)──▶ [Defy API]
                    │                              └─ reconciliation + BRL credit
                    │
                    ├─▶ [Anchors SEP-10/24/38]
                    │
                    ├─▶ [On‑chain Executor] ─▶ Soroswap Aggregator → AMMs/DEXes
                    │                            (Phoenix, Aqua, SDEX, ...)
                    │
                    ├─▶ [Defindex SDK] (Vaults: deposit/withdraw)
                    │
                    └─▶ [Oracle] Reflector (optional sanity)

[Postgres DB]: users, kyc, wallets, deposits, products, product_allocations,
               orders, trades, provider_events, provider_transactions,
               vault_events, vault_positions

Observability: Prometheus (/metrics) + Jaeger (traces) + pino logs
```

### 2.1) Diagram (Mermaid)

```mermaid
flowchart TB
  Client[Client (Web/App)] -->|REST| API[Defy Invest API]
  API -->|/deposits| PSP[PSP Pix]
  PSP -->|pix webhook| API

  API -->|SEP10/24/38| Anchor[Anchors]
  API -->|quote/swap| Exec[Soroswap Aggregator]
  Exec -->|Horizon| Stellar[(Stellar Testnet)]

  API -->|deposit/withdraw| Vault[Defindex Vaults]
  API -->|sanity| Oracle[Reflector]
  API --> DB[(Postgres)]
  API --> Metrics[(Prometheus/Grafana)]
  API --> Tracing[(OpenTelemetry/Jaeger)]
```

---

## 3) Product Modules

### 3.1 Pix Deposit → Credit

* `POST /deposits` creates charge (dynamic QR).
* Webhook `POST /webhooks/psp` validates, **idempotent**, and credits BRL.
* States: `iniciado | aguardando_pagamento | confirmado | creditado_saldo | valor_divergente | ...`.

### 3.2 Autobuy (dual mode)

**A) Spot (Soroswap)**
Converts BRL to **asset mix** (USDC/XLM/BTC…) with the **Aggregator** (optimal route), records `orders/trades` and updates `wallets`.

**B) Vault (Defindex, custodial)**
BRL → **USDC** (Soroswap) → **deposit** in **Vault** (via SDK) by treasury.
Shares remain in treasury (custody) and are mirrored in `vault_positions`.

> Configurable policy in `products`: `type: "SPOT"` or `type: "VAULT"`.

### 3.3 Price Sanity (Reflector, optional)

Before signing/sending the XDR of the swap:

```
preco_pool = (BRL_in / out_token)      // from quote/route
preco_oraculo = feed(token/BRL)        // Reflector
spread_bps = |preco_pool/preco_oraculo − 1| * 10_000
if spread_bps > ORACLE_SANITY_MAX_SPREAD_BPS:
  abort or reduce size/adjust slippage
```

### 3.4 Public liquidity (LP) — BRL↔USDC

To ensure stable route: create **BRL token (7 places)**, **BRL↔USDC pool** and **Add Liquidity** (e.g., 5:1).
Can be via UI (Freighter) or by API (`/liquidity/add` → XDR → `/send`).

### 3.5 Redemption (Vault → BRL → Pix)

* `withdraw(shares)` in Vault (Defindex) to treasury.
* Swap USDC → BRL (Soroswap).
* `SEP-24 withdraw` from Anchor (user's Pix).

### 3.6 Crowdfunding (Soroban) — step 2

**v0** contract with: `propose_project`, `fund_project`, `start_disbursement`, `repay`, `claim_yield` and events; light governance (allowlist/multisig).

---

## 4) API (v0)

### Authentication

* Static token (`Authorization: Bearer <DEFY_API_TOKEN>`) — simple for MVP.

### Main endpoints

* **Deposits**

  * `POST /deposits { valor_centavos }` → creates Pix charge
  * `POST /webhooks/psp` (public) → receives `pix.pago` (mock/real)

* **Products & Execution**

  * `GET /products` → products + allocations + *executionPolicy*
  * `GET /portfolio?user_id=...`
  * `GET /orders`, `GET /trades`

* **Dev/Ops**

  * `GET /metrics` (Prometheus), `GET /health`

### Example

```bash
# Webhook (mock)
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H 'Content-Type: application/json' \
  -H 'X-Signature: test' \
  -d '{"type":"pix.pago","psp_ref":"psp-123","txid":"TX-LOCAL-1","valor_centavos":50000,"product_id":"defy-balanced"}'
```

---

## 5) On‑chain Execution (Soroswap)

* **Quote**: `POST /quote?network=testnet` with `Authorization: Bearer <APIKEY>`.
* **Build**: `POST /quote/build` returns **XDR**; we sign with **treasury** on server and submit to Horizon.
* **Decimals**: BRL business (2 places) → on‑chain testnet (7 places). We use `scaleUnits(2→7)`.
* **Events**: we record `QUOTE_MISSING_AMOUNTOUT`, `BUY_EXECUTED`, etc. in `provider_events`.

### 5.1 Soroswap API — *quote → build (XDR) → send*

1. `POST /quote` → best route (AMMs + SDEX), slippage, split‑routing.
2. `POST /quote/build` → **XDR** unsigned.
3. `POST /send` → sends the **signed** XDR (or via local Horizon).

### 5.2 Provision Liquidity (Soroswap UI + Freighter)

1. **Create/use BRL token** (7 places) and **mint** to treasury (`G...`).
2. Swap **XLM→USDC** to endow treasury.
3. Create **pool** BRL↔USDC and **Add Liquidity** (ex.: 5k BRL + 1k USDC).
4. Verify `quote` (expect `amountOut` > 0) for BRL→USDC.

---

## 6) Database (MVP)

Central tables: `users`, `deposits`, `wallets(user_id, asset, balance)`, `products`, `product_allocations`, `orders`, `trades`, `provider_events`, `provider_transactions`,
`vault_events(user_id, vault_address, kind, amount, shares, tx_hash, payload)`,
`vault_positions(user_id, vault_address, base_asset, shares, principal)`.

* `orders.status`: `open | partially_filled | filled | cancelled | failed`
* `deposits.status`: `aguardando_pagamento | confirmado | creditado_saldo | valor_divergente | ...`
* `trades`: `qty`, `price_brl`, `pool_price_brl`, `oracle_price_brl` (null for now), `exec_provider`, `chunk_ref`.

---

## 7) Environment Variables (main)

```env
# API
DEFY_API_TOKEN=devtoken
DATABASE_URL=postgres://defy:defy@db:5432/defy

# Autobuy
AUTOBUY_ENABLED=true
AUTOBUY_DEFAULT_PRODUCT=defy-balanced

# Stellar/Soroban
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_TREASURY_PUBLIC=G...
STELLAR_TREASURY_SECRET_FILE=/run/secrets/stellar_treasury_secret

# Soroswap
SOROSWAP_HOST=https://api.soroswap.finance
SOROSWAP_NETWORK=testnet
SOROSWAP_API_KEY_FILE=/run/secrets/soroswap_api_key
# on‑chain decimals (testnet)
SOROSWAP_ONCHAIN_DEC=7

# Assets (contracts C...)
STELLAR_ASSET_BRL=C...
STELLAR_ASSET_USDSTABLE=C...
STELLAR_ASSET_USDC=${STELLAR_ASSET_USDSTABLE}
STELLAR_ASSET_XLM=C...
STELLAR_ASSET_BTC=C...

# Defindex (Vaults)
DEFINDEX_API_URL=https://api.defindex.io
DEFINDEX_API_KEY=sk_...
DEFINDEX_VAULT_ADDRESS=CVAULT_...

# Anchors (SEP-10/24/38)
ANCHOR_HOME_DOMAIN=https://...
ANCHOR_SEP10_WEB_AUTH=https://.../.well-known/stellar
ANCHOR_SEP24_TX=https://.../transactions
ANCHOR_SEP38_QUOTE=https://.../quote

# Oracle (Reflector)
REFLECTOR_BASE_URL=https://reflector.testnet.example
REFLECTOR_API_KEY=sk_...
REFLECTOR_FEED_USDC_BRL=FEED_USDC_BRL
REFLECTOR_FEED_XLM_BRL=FEED_XLM_BRL
ORACLE_SANITY_MAX_SPREAD_BPS=100
```

---

## 8) Quickstart (dev)

```bash
docker compose up -d
# migrations
docker compose run --rm migrator

# seed products and allocations (example)
docker compose exec -T db psql -U defy -d defy < sql/seeds_products.sql

# health test
echo "Bearer devtoken" | xargs -I{} curl -sS -H "Authorization: {}" http://localhost:8080/health | jq .
```

### Smoke E2E (VAULT, with mock Pix)

```bash
# 1) Mock Pix
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H 'Content-Type: application/json' -H 'X-Signature: test' \
  -d '{"type":"pix.pago","psp_ref":"psp-xyz","txid":"TX-42","valor_centavos":150000,"product_id":"VAULT_USDC_AUTO"}'

# 2) Check events/positions
psql "$DATABASE_URL" -c "select kind, amount, shares, tx_hash from vault_events order by created_at desc limit 5;"
psql "$DATABASE_URL" -c "select user_id, vault_address, shares, principal from vault_positions;"
```

---

## 9) Observability & Operations

* **Logs**: pino (configurable level).
* **Metrics**: `/metrics` → `autobuyOrdersCreatedTotal`, `chunkBuyExecutedTotal{status}`, `chunkBuyDurationSeconds`.
* **Tracing**: spans `autobuy.chunk` with attrs (`order_id`, `symbol`, `chunk_centavos`, `provider_ref`, ...).

---

## 10) Security & Compliance

* KYC/AML gate before releasing deposit and community credit.
* **Idempotency**: hash of payload in `provider_events`, unique `external_id`; UNIQUE on `pix_txid`.
* **LGPD**: data minimization, segregation by tables, payload hashes.
* **Keys**: secrets outside repo (`/run/secrets`). Never expose `S...` in client.
* **Guard rails**: `slippage_bps`, `max_spread_bps` and (optional) oracle comparison.

---

## 11) Soroban Module (Crowdfunding) — Technical Details v0

**Interface (Rust sketch):**

```rust
pub struct Project { id: BytesN<32>, owner: Address, goal: i128, apr_bps: u32, meta_uri: String, raised: i128, state: u32 }

pub trait CommunityCredit {
  fn propose_project(env: Env, id: BytesN<32>, owner: Address, goal: i128, apr_bps: u32, meta_uri: String);
  fn fund_project(env: Env, id: BytesN<32>, from: Address, amount: i128);
  fn start_disbursement(env: Env, id: BytesN<32>);
  fn repay(env: Env, id: BytesN<32>, from: Address, amount: i128);
  fn claim_yield(env: Env, id: BytesN<32>, to: Address);
}
```

* **Tokens**: accept BRL/USDC according to policy; optionally tokenize shares (`ccSHARE`).
* **Governance**: *allowlist* of signers for `start_disbursement` (multisig/light DAO).
* **API integration**: admin/user endpoints to propose, contribute, query, claim yield.

---

## 12) Demo Roadmap (video)

1. Create BRL↔USDC pool on Soroswap (Freighter) and add liquidity.
2. `POST /webhooks/psp` (mock) → see `orders/trades` fill and balance update.
3. Jaeger: check `autobuy.chunk`; Grafana: `chunkBuyDurationSeconds`.
4. (Optional) Propose project in Soroban contract (CLI), contribute and simulate `repay`.

---

## 13) Short roadmap

* [ ] Finalize price sanity check vs oracle (Reflector).
* [ ] Simple UI (QR + history; toggle % for community fund).
* [ ] Anchors (SEP‑38/24) with firm quotes and Pix withdraw.
* [ ] Soroban **crowdfunding v0** (testnet deploy + interaction README).
* [ ] Programmatic **LP** scripts and **shares** reconciliation (Defindex SDK).

---

## 14) License

MIT (to confirm).

---

## 15) Byproduct: `@defy-labs/precise-money` (cross‑chain monetary precision lib)

**Summary**: TypeScript library focused on monetary operations with **BigInt** and **minor units** for crypto and fiat, standardizing conversions between **2/6/7/9/18** places, *slippage guards* and average price calculation, with decimal registry by **symbol** and by **assetId** (e.g., issuer/chainId).

**Why?** There was a lack of a chain-neutral layer that avoided losses from floating-point and decimal differences between **Stellar/EVM/Solana/Cosmos**.

**Status**: developed in parallel (pre‑release); this API already uses the same modules and will be migrated to the package once published. Candidate for **complementary submission** in Hackathon (composability/devtools).

### Main features

* `scaleUnits(u, fromDec, toDec)` – exact conversion via `bigint`.
* `toMinor / fromMinor` – safe round-trip (UI ↔ back‑end).
* `applySlippage`, `minOutForExactIn` – guard rails in bps.
* `avgPriceBRL` – average price without floats (uses cents and minor units).
* `splitAmount` – order chunking by minimum size.
* `DEC` – decimal registry (by symbol and by assetId), with **override via env** (e.g., `STELLAR_DECIMALS_BRL=7`).

### Example

```ts
import { scaleUnits, applySlippage, fromMinor, DEC } from '@defy-labs/precise-money';

// BRL cents (2) -> on-chain testnet (7)
const chunkCentavos = 10_000n;            // R$ 100.00
const amountIn = scaleUnits(chunkCentavos, 2, 7); // 10_000 * 10^(5)

// slippage of 0.5% on amountOut
const minOut = applySlippage(1_234_567n, 50);

// pool price (BRL per token)
const brl = Number(chunkCentavos) / 100;  // only for display
const outHuman = fromMinor('1234567', 'XLM'); // if DEC['XLM']=7
const price = brl / outHuman;
```

### Installation (when published)

```bash
npm i @defy-labs/precise-money
```

### Integration in this repo

* Used in **autobuy** routes (`/webhooks/psp`), quotes/swaps and **wallets** update.
* The **REGRAS\_DE\_OURO\_DINHEIRO\_E\_PRECISAO.md** document guides rounding and type decisions.
