# Defy Invest — MVP (Stellar Hackathon)

> **One‑liner**: Deposite via **Pix** e compre/venda cripto **em tempo real** com KYC básico, auditoria, **execução on‑chain componível** (Soroswap/Phoenix/Aqua/SDEX) e, na próxima etapa, **crédito comunitário** (crowdfunding) via **Soroban** para projetos de impacto em comunidades quilombolas.

**Status**: MVP em desenvolvimento · **Entrega alvo**: 15/09/2025 · Fuso: `America/Sao_Paulo`

---

## 0) Posição no Hackathon

**Faixa recomendada**: **Componibilidade** (até US\$ 30k em XLM)

* Integra **PSP → API → DEX/AMM** via **Soroswap Aggregator** (fallback Phoenix/Aqua/SDEX), com Horizon/Jaeger/Grafana/Prometheus e Postgres.
* **Liquidez pública e modular**: criação/consumo de pools na testnet, incluindo **token BRL (7d)** próprio e **pool BRL↔USDC (LP)** para garantir rota estável e demonstrar interoperabilidade no ecossistema Stellar.
* **Defindex (Vaults, modelo custodial)**: BRL → USDC (Soroswap) → **depósito/saque em Vault** via SDK; **shares** custodiadas pela tesouraria no MVP; encaixa com a tese de **componibilidade** (Aggregator + Vaults) e simplifica a entrega de **estratégias/yield**.
* **Oráculo Reflector** no loop de execução (opcional): *sanity check* de rota/preço vs pool com **guard rails** (slippage/spread).
* **Anchors (SEP-10/24/38)** no fluxo Pix → on-chain allocation (cotações firmes/indicativas, quando necessário), com **custódia de tesouraria** no MVP.
* Passo 2 (impacto social): **módulo de crédito/crowdfunding Soroban**, fechando o ciclo “depósito → investimento → financiamento comunitário”.

---

## 1) Visão

**Defy Invest** transforma depósitos **Pix** em poder de compra **on‑chain**. Ao confirmar o Pix, a API credita BRL e dispara **autobuy** com **guard rails** (idempotência, reconciliação, *slippage guard* e *sanity check* de preço via **Reflector**). A execução é **componível** com **Soroswap** (aggregator + builder), métricas (Prometheus) e *tracing* (OpenTelemetry → Jaeger).

No escopo ampliado, parte dos rendimentos e/ou aportes podem ser destinados a **fundos de crédito comunitário**, onde projetos quilombolas são **propostos, financiados e acompanhados** em um **contrato Soroban** (crowdfunding/empresta‑dores P2P).

---

## 2) Arquitetura (alto nível)

```
[App Web] ──HTTP──> [API Defy]
                    │
                    ├─▶ [PSP Pix Adapter] ──(webhook)──▶ [API Defy]
                    │                              └─ reconciliação + crédito BRL
                    │
                    ├─▶ [Anchors SEP-10/24/38]
                    │
                    ├─▶ [Executor on‑chain] ─▶ Soroswap Aggregator → AMMs/DEXes
                    │                            (Phoenix, Aqua, SDEX, ...)
                    │
                    ├─▶ [Defindex SDK] (Vaults: deposit/withdraw)
                    │
                    └─▶ [Oráculo] Reflector (sanity opcional)

[DB Postgres]: users, kyc, wallets, deposits, products, product_allocations,
               orders, trades, provider_events, provider_transactions,
               vault_events, vault_positions

Observabilidade: Prometheus (/metrics) + Jaeger (traces) + logs pino
```

### 2.1) Diagrama (Mermaid)

```mermaid
flowchart TB
  Client[Cliente (Web/App)] -->|REST| API[API Defy Invest]
  API -->|/depositos| PSP[PSP Pix]
  PSP -->|webhook pix| API

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

## 3) Módulos de Produto

### 3.1 Depósito Pix → Crédito

* `POST /depositos` cria cobrança (QR dinâmico).
* Webhook `POST /webhooks/psp` valida, **idempotente**, e credita BRL.
* Estados: `iniciado | aguardando_pagamento | confirmado | creditado_saldo | valor_divergente | ...`.

### 3.2 Autobuy (duplo modo)

**A) Spot (Soroswap)**
Converte BRL para **mix de assets** (USDC/XLM/BTC…) com o **Aggregator** (rota ótima), grava `orders/trades` e atualiza `wallets`.

**B) Vault (Defindex, custodial)**
BRL → **USDC** (Soroswap) → **deposit** no **Vault** (via SDK) pela tesouraria.
As *shares* ficam na tesouraria (custódia) e são espelhadas em `vault_positions`.

> Política configurável em `products`: `type: "SPOT"` ou `type: "VAULT"`.

### 3.3 Sanidade de Preço (Reflector, opcional)

Antes de assinar/enviar o XDR do swap:

```
preco_pool = (BRL_in / out_token)      // do quote/rota
preco_oraculo = feed(token/BRL)        // Reflector
spread_bps = |preco_pool/preco_oraculo − 1| * 10_000
if spread_bps > ORACLE_SANITY_MAX_SPREAD_BPS:
  abortar ou reduzir tamanho/ajustar slippage
```

### 3.4 Liquidez pública (LP) — BRL↔USDC

Para garantir rota estável: criar **token BRL (7 casas)**, **pool BRL↔USDC** e **Add Liquidity** (p.ex., 5:1).
Pode ser via UI (Freighter) ou por API (`/liquidity/add` → XDR → `/send`).

### 3.5 Resgate (Vault → BRL → Pix)

* `withdraw(shares)` no Vault (Defindex) para a tesouraria.
* Swap USDC → BRL (Soroswap).
* `SEP-24 withdraw` do Anchor (Pix do usuário).

### 3.6 Crowdfunding (Soroban) — passo 2

Contrato **v0** com: `propose_project`, `fund_project`, `start_disbursement`, `repay`, `claim_yield` e eventos; governança leve (allowlist/multisig).

---

## 4) API (v0)

### Autenticação

* Token estático (`Authorization: Bearer <DEFY_API_TOKEN>`) — simples para o MVP.

### Endpoints principais

* **Depósitos**

  * `POST /depositos { valor_centavos }` → cria cobrança Pix
  * `POST /webhooks/psp` (público) → recebe `pix.pago` (mock/real)

* **Produtos & Execução**

  * `GET /products` → produtos + alocações + *executionPolicy*
  * `GET /portfolio?user_id=...`
  * `GET /orders`, `GET /trades`

* **Dev/Ops**

  * `GET /metrics` (Prometheus), `GET /health`

### Exemplo

```bash
# Webhook (mock)
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H 'Content-Type: application/json' \
  -H 'X-Signature: test' \
  -d '{"type":"pix.pago","psp_ref":"psp-123","txid":"TX-LOCAL-1","valor_centavos":50000,"product_id":"defy-balanced"}'
```

---

## 5) Execução On‑chain (Soroswap)

* **Quote**: `POST /quote?network=testnet` com `Authorization: Bearer <APIKEY>`.
* **Build**: `POST /quote/build` retorna **XDR**; assinamos com **treasury** no servidor e submetemos no Horizon.
* **Decimais**: BRL de negócio (2 casas) → on‑chain testnet (7 casas). Usamos `scaleUnits(2→7)`.
* **Eventos**: registramos `QUOTE_MISSING_AMOUNTOUT`, `BUY_EXECUTED`, etc. em `provider_events`.

### 5.1 Soroswap API — *quote → build (XDR) → send*

1. `POST /quote` → melhor rota (AMMs + SDEX), slippage, split‑routing.
2. `POST /quote/build` → **XDR** não assinado.
3. `POST /send` → envia o XDR **assinado** (ou via Horizon local).

### 5.2 Provisionar Liquidez (UI Soroswap + Freighter)

1. **Criar/usar token BRL** (7 casas) e **mint** para a treasury (`G...`).
2. Trocar **XLM→USDC** para dotar a treasury.
3. Criar **pool** BRL↔USDC e **Add Liquidity** (ex.: 5k BRL + 1k USDC).
4. Verificar `quote` (espera `amountOut` > 0) para BRL→USDC.

---

## 6) Banco de Dados (MVP)

Tabelas centrais: `users`, `deposits`, `wallets(user_id, asset, balance)`, `products`, `product_allocations`, `orders`, `trades`, `provider_events`, `provider_transactions`,
`vault_events(user_id, vault_address, kind, amount, shares, tx_hash, payload)`,
`vault_positions(user_id, vault_address, base_asset, shares, principal)`.

* `orders.status`: `open | partially_filled | filled | cancelled | failed`
* `deposits.status`: `aguardando_pagamento | confirmado | creditado_saldo | valor_divergente | ...`
* `trades`: `qty`, `price_brl`, `pool_price_brl`, `oracle_price_brl` (null por enquanto), `exec_provider`, `chunk_ref`.

---

## 7) Variáveis de Ambiente (principais)

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

# seed de produtos e alocações (exemplo)
docker compose exec -T db psql -U defy -d defy < sql/seeds_products.sql

# teste de saúde
echo "Bearer devtoken" | xargs -I{} curl -sS -H "Authorization: {}" http://localhost:8080/health | jq .
```

### Smoke E2E (VAULT, com Pix mock)

```bash
# 1) Mock Pix
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H 'Content-Type: application/json' -H 'X-Signature: test' \
  -d '{"type":"pix.pago","psp_ref":"psp-xyz","txid":"TX-42","valor_centavos":150000,"product_id":"VAULT_USDC_AUTO"}'

# 2) Conferir eventos/posições
psql "$DATABASE_URL" -c "select kind, amount, shares, tx_hash from vault_events order by created_at desc limit 5;"
psql "$DATABASE_URL" -c "select user_id, vault_address, shares, principal from vault_positions;"
```

---

## 9) Observabilidade & Operação

* **Logs**: pino (nível configurável).
* **Métricas**: `/metrics` → `autobuyOrdersCreatedTotal`, `chunkBuyExecutedTotal{status}`, `chunkBuyDurationSeconds`.
* **Tracing**: spans `autobuy.chunk` com attrs (`order_id`, `symbol`, `chunk_centavos`, `provider_ref`, ...).

---

## 10) Segurança & Compliance

* KYC/AML gate antes de liberar depósito e crédito comunitário.
* **Idempotência**: hash do payload no `provider_events`, `external_id` único; UNIQUE em `pix_txid`.
* **LGPD**: minimização de dados, segregação por tabelas, hashes dos payloads.
* **Chaves**: secrets fora do repo (`/run/secrets`). Nunca expor `S...` em cliente.
* **Guard rails**: `slippage_bps`, `max_spread_bps` e (opcional) comparação com oráculo.

---

## 11) Módulo Soroban (Crowdfunding) — Detalhes Técnicos v0

**Interface (esboço em Rust):**

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

* **Tokens**: aceitar BRL/USDC conforme política; opcionalmente tokenizar cotas (`ccSHARE`).
* **Governança**: *allowlist* de signers para `start_disbursement` (multisig/DAO leve).
* **Integração API**: endpoints admin/usuário para propor, aportar, consultar, reclamar yield.

---

## 12) Roteiro de Demo (vídeo)

1. Criar pool BRL↔USDC no Soroswap (Freighter) e adicionar liquidez.
2. `POST /webhooks/psp` (mock) → ver `orders/trades` preencher e saldo atualizar.
3. Jaeger: verificar `autobuy.chunk`; Grafana: `chunkBuyDurationSeconds`.
4. (Opcional) Propor projeto no contrato Soroban (CLI), aportar e simular `repay`.

---

## 13) Roadmap curto

* [ ] Finalizar *sanity check* de preço vs oráculo (Reflector).
* [ ] UI simples (QR + histórico; toggle de % para o fundo comunitário).
* [ ] Anchors (SEP‑38/24) com cotações firmes e withdraw Pix.
* [ ] Soroban **crowdfunding v0** (deploy testnet + README de interação).
* [ ] Scripts de **LP** programática e **reconciliação** de shares (Defindex SDK).

---

## 14) Licença

MIT (a confirmar).

---

## 15) Subproduto: `@defy-labs/precise-money` (lib de precisão monetária cross‑chain)

**Resumo**: biblioteca TypeScript focada em operações monetárias com **BigInt** e **unidades mínimas** (minor units) para cripto e fiat, padronizando conversões entre **2/6/7/9/18** casas, *slippage guards* e cálculo de preço médio, com registro de decimais por **símbolo** e por **assetId** (ex.: issuer/chainId).

**Por que?** Faltava uma camada neutra de chain que evitasse perdas por ponto‑flutuante e diferenças de casas decimais entre **Stellar/EVM/Solana/Cosmos**.

**Status**: desenvolvida em paralelo (pré‑release); esta API já usa os mesmos módulos e será migrada para o pacote assim que publicado. Candidata a **submissão complementar** no Hackathon (componibilidade/devtools).

### Principais features

* `scaleUnits(u, fromDec, toDec)` – conversão exata via `bigint`.
* `toMinor / fromMinor` – ida/volta segura (UI ↔ back‑end).
* `applySlippage`, `minOutForExactIn` – guard rails em bps.
* `avgPriceBRL` – preço médio sem floats (usa centavos e minor units).
* `splitAmount` – chunking de ordens pelo tamanho mínimo.
* `DEC` – registry de decimais (por símbolo e por assetId), com **override via env** (ex.: `STELLAR_DECIMALS_BRL=7`).

### Exemplo

```ts
import { scaleUnits, applySlippage, fromMinor, DEC } from '@defy-labs/precise-money';

// BRL centavos (2) -> on-chain testnet (7)
const chunkCentavos = 10_000n;            // R$ 100,00
const amountIn = scaleUnits(chunkCentavos, 2, 7); // 10_000 * 10^(5)

// slippage de 0,5% em amountOut
const minOut = applySlippage(1_234_567n, 50);

// preço de pool (BRL por token)
const brl = Number(chunkCentavos) / 100;  // apenas para exibir
const outHuman = fromMinor('1234567', 'XLM'); // se DEC['XLM']=7
const price = brl / outHuman;
```

### Instalação (quando publicado)

```bash
npm i @defy-labs/precise-money
```

### Integração neste repo

* Usado nas rotas de **autobuy** (`/webhooks/psp`), quotes/swaps e atualização de **wallets**.
* O documento **REGRAS\_DE\_OURO\_DINHEIRO\_E\_PRECISAO.md** guia as decisões de arredondamento e tipos.
