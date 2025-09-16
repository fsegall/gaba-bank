# Defy — PSP Abstraction & Anchor/Inter Quickstart (MVP)

> **Scope:** Fiat on/off-ramp via **Banco Inter** (PIX) *or* **Anchor Platform** (SEPs 10/12/24). Switchable with a single env var. DeFi side uses the Vault contracts already provisioned on Testnet.

---

## PSP Abstraction & Switch (`PSP_PROVIDER`)

We expose a thin provider layer so the app can run with **mock**, **Inter**, or **Anchor** without changing the frontend.

**Env toggle**

```bash
# .env
PSP_PROVIDER=inter   # inter | anchor | mock
```

**Backend surface (stable regardless of provider)**

* **Inter**: `POST /pix/cob` (create charge), unified `POST /webhooks/psp` (HMAC), reconcile job.
* **Anchor**: `GET /anchors/toml`, `POST /anchors/sep10` (returns JWT), `POST /anchors/sep38/quote`, `POST /anchors/sep24/deposit`.
* Provider events are normalized into `provider_events` / `provider_transactions` and reconciled with `deposits`.

**Switching**

1. Set `PSP_PROVIDER` in `.env`.
2. Restart the API.
3. Run provider‑specific smoke tests (below) and verify metrics & logs.

---

## Banco Inter (homolog) — Auth, COB, Webhook & Reconciliation

**Prereqs (.env)**

```bash
PSP_PROVIDER=inter
INTER_ENV=homolog
INTER_BASE_URL=https://cdpj-sandbox.partners.uatinter.co
INTER_TOKEN_URL=https://cdpj-sandbox.partners.uatinter.co/oauth/v2/token
INTER_OAUTH_SCOPE_COB="cob.read cob.write"
INTER_OAUTH_SCOPE_PIX="pix.read"
INTER_OAUTH_SCOPE_PAGAR="pagamento-pix.write"
INTER_PIX_KEY=<your-pix-key>
# Secrets via Docker:
INTER_CLIENT_ID_FILE=/run/secrets/inter_client_id
INTER_CLIENT_SECRET_FILE=/run/secrets/inter_client_secret
INTER_PFX_PATH=/run/secrets/inter_client.pfx
INTER_PFX_PASSPHRASE_FILE=/run/secrets/inter_pfx_pass
```

**Happy path**

1. **COB**: `POST /pix/cob` → create charge (`txid` persisted in `deposits`).
2. **Payment**: user pays via PIX app.
3. **Webhook**: Inter calls `POST /webhooks/psp` (HMAC verified) → upsert `provider_transactions` & `provider_events`.
4. **Reconciliation**: background job updates `deposits.status` idempotently by `txid`.
5. **Credit**: when status is `paid` and **PSP\_PROVIDER=inter**, we perform the on-chain credit according to the MVP rules (or queue swap).

**Smoke (repo scripts)**

```bash
npx tsx scripts/smoke-test-scripts/inter/smoke_inter_cob.ts
npx tsx scripts/smoke-test-scripts/inter/smoke_inter_token.ts
```

**Webhook contract**

* HMAC header checked under `/webhooks/psp` using `PSP_WEBHOOK_SECRET`.
* Retries idempotent (unique key on `(provider,id)` already enforced by migrations).

**Observability**

* Counters for COB creation, webhook deliveries, reconciliations.
* Labels: `provider="inter"`, `status`, `http_status`.

---

## Anchor Mode — SEP‑10 / SEP‑12 / SEP‑24 (Interactive)

**MVP Decision:** we use **Anchor Platform** for testnet. The API already exposes thin endpoints backed by the Anchor TOML.

**Prereqs (.env)**

```bash
PSP_PROVIDER=anchor
ANCHOR_TOML_URL=http://localhost:8081/.well-known/stellar.toml   # if running Anchor Platform locally
ANCHOR_JWT_AUDIENCE=anchor
ANCHOR_TIMEOUT_MS=15000
ANCHOR_WEBHOOK_SECRET=<shared-secret>
# Stellar
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
STELLAR_TREASURY_PUBLIC=GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4
# sign SEP-10 challenges using the treasury seed (prefer file mount)
STELLAR_TREASURY_SECRET_FILE=/run/secrets/stellar_treasury_secret
# or, for local-only dev: STELLAR_TREASURY_SECRET=SB...
```

**DB (migrations)**

> `023_anchor_sep.sql` applied: tables `anchors`, `anchor_auth_sessions`, `anchor_kyc`, `anchor_transactions`.

**Current backend endpoints** (`api/src/routes/anchors.ts`)

* `GET  /anchors/toml` → loads & caches `WEB_AUTH_ENDPOINT`, `SEP38_QUOTE_SERVER`, `TRANSFER_SERVER_SEP0024` from TOML.
* `POST /anchors/sep10` → fetches challenge (`sep10_start`), signs with treasury, exchanges for **JWT** (`sep10_token`). Returns `{ token, issued_at, expires_at }`.
* `POST /anchors/sep38/quote` → body `{ jwt, sell_asset, buy_asset, sell_amount?|buy_amount?, account }` → returns quote `{ id, price, total_price, expires_at }`.
* `POST /anchors/sep24/deposit` → body `{ jwt, asset_code }` → returns Anchor interactive response (URL + id).

**Service functions** (`api/src/services/anchors.ts`)

* `loadAnchorToml()` → resolves/caches endpoints from TOML.
* `sep10_start(account = TREASURY_PUB)` → GET `${WEB_AUTH_ENDPOINT}?account=...`.
* `sep10_token(challenge)` → signs `transaction` XDR with **treasury secret**, POSTs back to `WEB_AUTH_ENDPOINT`, returns JWT.
* `sep38_quote(jwt, req)` → POST `${SEP38_QUOTE_SERVER}/quote` with `Authorization: Bearer <jwt>`.
* `sep24_deposit(jwt, asset_code, account=TRESURY_PUB)` → GET `${TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive` with `account` & `asset_code`.

**Anchor Platform (container)**

```yaml
anchor:
  image: stellar/anchor-platform:latest
  environment:
    NETWORK_PASSPHRASE: "Test SDF Network ; September 2015"
    STELLAR_NETWORK: "TESTNET"
    SIGNING_SEED: "${ANCHOR_SIGNING_SEED}"
    HOST_URL: "http://localhost:8081"
    CALLBACK_BASE_URL: "http://localhost:8080"  # our API for webhooks
  ports: ["8081:8081"]
```

**cURL smoke (local)**

```bash
# 1) Discover endpoints
curl -s http://localhost:8080/anchors/toml | jq

# 2) Get a JWT (uses treasury key to sign challenge)
curl -sX POST http://localhost:8080/anchors/sep10 | jq
# -> { "token": "...", "issued_at": "...", "expires_at": "..." }

# 3) Quote example (SEP-38)
curl -sX POST http://localhost:8080/anchors/sep38/quote \
  -H 'content-type: application/json' \
  -d '{
    "jwt": "<token>",
    "sell_asset": "BRL:anchor",
    "buy_asset":  "BRLSTABLE:<ISSUER_G>",
    "sell_amount": "100.00",
    "account": "'"$STELLAR_TREASURY_PUBLIC"'"
  }' | jq

# 4) Start interactive deposit (SEP-24)
curl -sX POST http://localhost:8080/anchors/sep24/deposit \
  -H 'content-type: application/json' \
  -d '{ "jwt": "<token>", "asset_code": "BRLSTABLE" }' | jq
```

**Webhooks**

* Endpoint: `POST /webhooks/sep24` (HMAC via `ANCHOR_WEBHOOK_SECRET`).
* Upsert by `external_id` and persist `metadata` for audits.

## Frontend Hooks (no UI changes)

* **Wallet Connect**: Freighter or seedless (passkey) as per flags.
* **Deposit (fiat)**

  * If `PSP_PROVIDER=inter`: open our **COB** screen (QR/copy‑paste) and poll webhook status.
  * If `PSP_PROVIDER=anchor`: open **interactive\_url** in new tab (SEP‑24) and reflect statuses (mock OK in dev).
* **DeFi Vault**: unaffected by provider; after fiat settles → credit/mint token → allow **Deposit to Vault** CTA with prefilled amount.

---

## Ops Cheatsheet

**Run with Inter (homolog)**

```bash
PSP_PROVIDER=inter LOG_LEVEL=debug docker compose up -d --build
```

**Run with Anchor (testnet + Anchor Platform)**

```bash
PSP_PROVIDER=anchor LOG_LEVEL=debug docker compose up -d --build
# sanity
curl -s http://localhost:8081/.well-known/stellar.toml | head
curl -s http://localhost:8080/anchors/toml | jq
```

**Migrations (container)**

```bash
npm run migrate:docker
```

**Health**

* `/metrics` Prometheus
* Traces to Jaeger at `OTEL_EXPORTER_OTLP_ENDPOINT`
* Anchor Platform UI/health on :8081

## Security Notes

* Webhooks signed (timing‑safe compare + replay window).
* JWTs from SEP‑10 kept with short TTL; refresh automatically when needed.
* PII from SEP‑12 stored minimally and encrypted at rest when applicable.
* Never ship seeds in `.env`; prefer Docker secrets.

---

## Done / Next

* ✅ Provider switch wired.
* ✅ Inter COB + webhook + migrations operational.
* ✅ Anchor tables live; wire TOML loader + initial anchor insert.
* ⏭️ Frontend polish for SEP‑24 flow and Inter COB screen.
* ⏭️ E2E: deposit → mint/credit → swap (if required) → vault deposit.
