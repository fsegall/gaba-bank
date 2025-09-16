# TODO.md — Defy Invest (MVP Integrations)

**Prazo alvo:** 15/09/2025 · **Foco:** integrações P0 para demo E2E

> Legenda: **P0** (crítico), **P1** (importante), **P2** (pós‑demo). Marque os checkboxes conforme entrega.

---

## ✅ Critérios gerais de pronto (DoD)

* [ ] Idempotência em webhooks e execução on‑chain (chaves únicas, locks).
* [ ] Logs estruturados com `deposit_id`, `route_id`, `xdr_hash`, `vault_tx`.
* [ ] Métricas Prometheus (taxas de sucesso/erro, latências, retries).
* [ ] Tracing OTEL com spans por etapa (quote → build → send → deposit).
* [ ] .env.example atualizado e **secrets** fora do repo.

---

## P0 — Integrações centrais

### 1) PSP Pix / Webhook (crédito BRL)

* [ ] Validação de assinatura (HMAC/headers) e **replay protection** (nonce/timestamp).
* [ ] Idempotência por `pix_txid` (UNIQUE) e `provider_events.external_id`.
* [ ] Máquina de estados: `iniciado → aguardando_pagamento → confirmado → creditado_saldo`.
* [ ] Métricas: `pixWebhookTotal{status}`, `pixLatencySeconds`.
* [ ] Teste: simular `pix.pago` e verificar crédito em `deposits`.

### 2) Soroswap Aggregator (quote → XDR → send)

* [ ] Client `quoteRoute` com `slippage_bps`, `parts`, `maxHops` configuráveis.
* [ ] `build` (XDR) + `submit` (assinado pela tesouraria).
* [ ] Conversão de decimais (negócio 2 → on‑chain 7) via `precise-money`.
* [ ] Eventos: `QUOTE_OK`, `BUILD_OK`, `SEND_OK|ERR` em `provider_events`.
* [ ] Teste: BRL→USDC (amountOut>0) e registro em `trades`.

### 3) Defindex (Vaults, custodial)

* [ ] SDK instalado e configurado (API key, network testnet).
* [ ] `deposit` (USDC) e `withdraw` (por shares) assinados pela tesouraria.
* [ ] `vault_events` (DEPOSIT|WITHDRAW) + `vault_positions` (shares/principal).
* [ ] Reconciliação periódica (cron) consultando saldo de shares da tesouraria.
* [ ] Teste: `autoInvestVault` (BRL→USDC→deposit) com confirmação de shares.

### 4) Reflector (sanity check opcional)

* [ ] Cliente `getPrice(feed)` + **feature flag** `ORACLE_SANITY_ENABLED`.
* [ ] Cálculo `spread_bps` e *circuit breaker* (abortar swap/reduzir chunk).
* [ ] Métricas: `oracleSpreadBps`, `oracleBlockTotal`.
* [ ] Teste: mock de feed e ver bloqueio quando `spread_bps` > limite.

### 5) Anchors (SEP‑10/24/38)

* [ ] SEP‑10 (webauth) server‑to‑server (JWT curto, cacheado).
* [ ] SEP‑38 (quotes firm/indicative) — armazenar `quote_id` e expiração.
* [ ] SEP‑24 (deposit/withdraw) — status polling e mapeamento de estados.
* [ ] Teste: depósito fiat→on‑chain mockado até status `completed`.

### 6) Liquidez pública BRL↔USDC (testnet)

* [ ] Criar **token BRL** (7 casas) e **mint** para a treasury (`G...`).
* [ ] Obter USDC (swap XLM→USDC) para seed.
* [ ] **Create Pool** BRL↔USDC e **Add Liquidity** (\~5 BRL:1 USDC; ex.: 5k/1k).
* [ ] Verificar quote BRL→USDC no dApp e via API.
* [ ] Script opcional de LP: `/liquidity/add` → XDR → `/send`.

### 7) Autobuy Orchestrator

* [ ] Acionamento no webhook: roteia por `product.type` (SPOT|VAULT).
* [ ] Chunking mínimo (ex.: R\$ 10,00) e retries exponenciais.
* [ ] Persistência atômica: `deposits → trades/vault_events → wallets/positions`.
* [ ] Reprocesso manual: `POST /invest/autobuy/:deposit_id` (idempotente).

---

## P1 — API, Portfolio e Operação

### 8) Portfolio/Relatórios

* [ ] `GET /portfolio?user_id=...` (wallets + vault\_positions normalizado por símbolo).
* [ ] `GET /vaults/:id/position?user_id=...` (shares/principal; última reconciliação).
* [ ] Export CSV simples de `trades` e `vault_events`.

### 9) Observabilidade

* [ ] Dash Prometheus: taxa de sucesso por etapa (webhook, quote, build, send, deposit).
* [ ] Traces obrigatórios: `autobuy.chunk`, `soroswap.quote|build|send`, `defindex.deposit`.
* [ ] Alertas: erro contínuo > N min, `oracleBlockTotal` anômalo, latência p95.

### 10) Segurança & Compliance

* [ ] Rate limit nos webhooks e rotas públicas.
* [ ] Assinatura de payload (`X‑Signature`) e janela `maxSkewMs`.
* [ ] Rotina de rotação de chaves/segredos (volumes `/run/secrets`).
* [ ] LGPD: revisão de campos pessoais e retenção de logs.

---

## P2 — Pós‑demo / Roadmap curto

* [ ] UI Web (QR Pix, histórico, posição Vault, toggles de destino comunitário).
* [ ] Crowdfunding Soroban v0 (deploy + CLI README de interação).
* [ ] Oráculo adicional (Band/alternativo) e agregação de feeds.
* [ ] Estratégias/vaults adicionais (multi‑asset, rebalanço automático).

---

## Migrations & Seeds

* [ ] Tabelas: `vault_events`, `vault_positions` (+ índices por `user_id`, `vault_address`).
* [ ] `provider_events(provider, kind, external_id UNIQUE, payload, created_at)`.
* [ ] Seeds: `products` (SPOT e VAULT) e `product_allocations`.

---

## Smokes / Scripts

* [ ] `scripts/smoke_pix_webhook.sh` — dispara mock de Pix e valida crédito.
* [ ] `scripts/smoke_swap_brl_usdc.ts` — quote/build/send e salva `trade_id`.
* [ ] `scripts/smoke_vault_deposit.ts` — BRL→USDC→deposit + leitura de shares.
* [ ] `scripts/smoke_anchor_flow.ts` — SEP‑10/38/24 (mock) até `completed`.

---

## Runbook de Produção (resumo)

1. Checar `.env` e secrets montados.
2. Pool BRL↔USDC com liquidez mínima (rota estável testada).
3. `docker compose up -d` + migrator + seeds.
4. Rodar smokes (Pix → swap → vault) e validar métricas/dashboards.
5. Habilitar `AUTOBUY_ENABLED=true`.
