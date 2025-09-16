# Issues — Defy Invest (MVP P0–P1)

> Backlog de issues pronto para abrir no GitHub/Jira. Cada item inclui descrição, tarefas, critérios de aceite (DoD) e labels sugeridas.

---

## P0 — Integrações centrais

### P0: PSP Pix / Webhook — crédito BRL

**Labels:** `P0`, `backend`, `psp`, `security`, `observability`

**Descrição**
Implementar webhook do PSP (Pix) com validação de assinatura, idempotência por `pix_txid` e máquina de estados de depósito. Expor métricas e tracing.

**Tarefas**

* [ ] Validar assinatura (HMAC/headers) + janela anti‑replay.
* [ ] Idempotência: UNIQUE `pix_txid` + `provider_events.external_id`.
* [ ] Estados: `iniciado → aguardando_pagamento → confirmado → creditado_saldo` (+ divergência).
* [ ] Métricas (`pixWebhookTotal{status}`, `pixLatencySeconds`) e logs estruturados.
* [ ] Testes de contrato (payload real/mock) e casos de duplicidade.

**Aceite (DoD)**

* [ ] Dois eventos repetidos não geram saldo duplicado.
* [ ] Dash Prometheus mostra taxas/latências por status.
* [ ] Trace OTEL inclui `deposit_id`, `pix_txid`.

---

### P0: Soroswap Aggregator — quote → build (XDR) → send

**Labels:** `P0`, `onchain`, `soroswap`, `backend`

**Descrição**
Cliente server‑side do Aggregator para cotar rota BRL→USDC, construir XDR, assinar com tesouraria e submeter. Conversões 2→7 casas com `precise-money`.

**Tarefas**

* [ ] `quoteRoute(sellAsset, buyAsset, sellAmount, slippageBps, parts, maxHops)`.
* [ ] `build` XDR para a rota + `submit` assinado.
* [ ] Guard rails: `slippage_bps`, `minOut`.
* [ ] Eventos em `provider_events` (`QUOTE_OK`, `BUILD_OK`, `SEND_OK|ERR`).
* [ ] Teste: BRL→USDC retorna `amountOut>0` e registra `trades`.

**Aceite (DoD)**

* [ ] Swap end‑to‑end confirmando no Horizon.
* [ ] Rejeita rota quando `minOut` < tolerado.

---

### P0: Defindex (Vaults, custodial) — deposit/withdraw

**Labels:** `P0`, `onchain`, `defindex`, `backend`

**Descrição**
Depositar USDC no Vault (SDK) pela tesouraria e espelhar shares/principal por usuário. Suportar withdraw por shares.

**Tarefas**

* [ ] Adapter SDK (`deposit`, `withdraw`) com network testnet.
* [ ] `vault_events` (DEPOSIT|WITHDRAW) e `vault_positions`.
* [ ] Reconciliação (cron) consultando saldo de shares da tesouraria.
* [ ] Teste: `autoInvestVault` (BRL→USDC→deposit) + leitura de shares.

**Aceite (DoD)**

* [ ] Depósito confirmado retorna tx hash e shares > 0.
* [ ] `vault_positions` atualiza `shares` e `principal` corretamente.

---

### P0: Reflector (oráculo) — sanity check (feature‑flag)

**Labels:** `P0`, `oracle`, `risk`, `backend`

**Descrição**
Sanity opcional: comparar `price_pool_brl` vs feed do Reflector e bloquear rota fora de `ORACLE_SANITY_MAX_SPREAD_BPS`.

**Tarefas**

* [ ] Cliente `getPrice(feedId)` com API key.
* [ ] Cálculo `spread_bps` e *circuit breaker*.
* [ ] Métricas: `oracleSpreadBps`, `oracleBlockTotal`.
* [ ] Flag `ORACLE_SANITY_ENABLED` e `ORACLE_SANITY_MAX_SPREAD_BPS`.

**Aceite (DoD)**

* [ ] Rota divergente é bloqueada e evento é registrado.
* [ ] Desligar flag permite rota passar (para fallback/demos).

---

### P0: Anchors — SEP‑10/24/38 (Pix → on‑chain allocation)

**Labels:** `P0`, `anchor`, `backend`, `fiat-onramp`

**Descrição**
Integração com Anchor parceiro: SEP‑10 (JWT cacheado), SEP‑38 (quote firm/indicative) e SEP‑24 (deposit/withdraw). Mapear estados até `completed`.

**Tarefas**

* [ ] SEP‑10 server‑to‑server + cache do JWT.
* [ ] SEP‑38 `POST /quote` (armazenar `quote_id`, expiração).
* [ ] SEP‑24 depósito: iniciar e *polling* de status.
* [ ] Webhook/worker para transição `onchain_pending → received/done`.

**Aceite (DoD)**

* [ ] Depósito fiat→on‑chain conclui até `completed` (mock ou sandbox).
* [ ] Logs têm `quote_id`, `sep24_txid`, `stellar_tx`.

---

### P0: Liquidez pública — token BRL (7d) + pool BRL↔USDC

**Labels:** `P0`, `liquidity`, `soroswap`, `onchain`

**Descrição**
Criar token BRL (7 casas), fazer mint para tesouraria, criar pool BRL↔USDC e adicionar liquidez para garantir rota estável para o aggregator.

**Tarefas**

* [ ] Deploy do token BRL (decimals=7) e salvar `C...` no `.env`.
* [ ] Mint para `STELLAR_TREASURY_PUBLIC`.
* [ ] Obter USDC (swap XLM→USDC).
* [ ] Criar pool + Add Liquidity (proporção \~5:1).
* [ ] Validar quote BRL→USDC (dApp + API).

**Aceite (DoD)**

* [ ] `amountOut > 0` e `slippage` dentro do alvo para ticket mínimo (ex.: R\$ 50).

---

### P0: Autobuy Orchestrator — SPOT|VAULT + retries

**Labels:** `P0`, `backend`, `orchestrator`

**Descrição**
Orquestrar pós‑crédito: decidir por produto (SPOT|VAULT), chunking mínimo, retries exponenciais e persistência atômica.

**Tarefas**

* [ ] Roteamento por `product.type`.
* [ ] Chunk mínimo (ex.: R\$ 10) + fila de retries com *backoff*.
* [ ] Persistência: `deposits → trades/vault_events → wallets/positions`.
* [ ] Endpoint `POST /invest/autobuy/:deposit_id` (reprocesso idempotente).

**Aceite (DoD)**

* [ ] Falhas transitórias reexecutam e convergem para `done`.
* [ ] Reprocesso manual funciona sem duplicar efeitos.

---

### P0: DB — migrations & seeds

**Labels:** `P0`, `db`, `infra`

**Descrição**
Criar migrations para tabelas de Vault e provider events; seeds de `products` (SPOT/VAULT) e alocações.

**Tarefas**

* [ ] `vault_events`, `vault_positions` (+ índices)
* [ ] `provider_events` (`provider`, `kind`, `external_id` UNIQUE, `payload`)
* [ ] Seeds `products` e `product_allocations`

**Aceite (DoD)**

* [ ] `docker compose run migrator` aplica sem erros.
* [ ] Endpoints leem/escrevem nessas tabelas.

---

## P1 — API, Portfolio, Observabilidade & Segurança

### P1: Portfolio endpoints & CSV

**Labels:** `P1`, `backend`, `api`

**Descrição**
Consolidar `wallets` + `vault_positions` e expor APIs de consulta e export.

**Tarefas**

* [ ] `GET /portfolio?user_id=...` (normalizado por símbolo).
* [ ] `GET /vaults/:id/position?user_id=...`.
* [ ] Export CSV de `trades` e `vault_events`.

**Aceite (DoD)**

* [ ] Respostas estáveis (contratos de API) + smoke de export.

---

### P1: Dashboards & Alertas

**Labels:** `P1`, `observability`, `ops`

**Descrição**
Painéis Prometheus/Grafana com taxas de sucesso/erro por etapa, p95 de latência, e alertas básicos.

**Tarefas**

* [ ] Dashboard por etapa (webhook, quote, build, send, deposit).
* [ ] Alertas: erro contínuo > N min, `oracleBlockTotal` anômalo.

**Aceite (DoD)**

* [ ] Painéis versionados em `ops/` e funcionando no ambiente dev.

---

### P1: Security/Compliance hardening

**Labels:** `P1`, `security`, `compliance`

**Descrição**
Rate limit, assinatura de payload, rotação de segredos e revisão LGPD.

**Tarefas**

* [ ] Rate limit webhooks e rotas públicas.
* [ ] `X‑Signature` + `maxSkewMs` em webhooks.
* [ ] Rotação de segredos (`/run/secrets`) e revisão de PII/logs.

**Aceite (DoD)**

* [ ] Checklist LGPD/segurança aprovado; testes de rate limit.

---

## Smokes & Scripts (referências cruzadas)

* `scripts/smoke_pix_webhook.sh` — Pix→crédito.
* `scripts/smoke_swap_brl_usdc.ts` — Soroswap (quote/build/send).
* `scripts/smoke_vault_deposit.ts` — BRL→USDC→deposit (Defindex).
* `scripts/smoke_anchor_flow.ts` — SEP‑10/38/24 (mock) até `completed`.

---

## Anexos úteis

* README (Canvas) — seções: Execução On‑chain, LP BRL↔USDC, Vaults (Defindex), Anchors e Oracle.

---

## (Opcional) Criar issues via GitHub CLI

> Edite labels/assignees antes de rodar.

```bash
# Exemplo para uma issue
TITLE="P0: PSP Pix / Webhook — crédito BRL"
LABELS="P0,backend,psp,security,observability"
BODY_FILE=issue_psp_webhook.md

# Crie arquivos BODY_* copiando os blocos acima de cada issue
# e execute:
# gh issue create -t "$TITLE" -F "$BODY_FILE" -l "$LABELS"
```
