# Stellar Testnet — BRLD (Classic Asset) — **Parte 2: Pool de Liquidez (BRLD/USDC)**

Este anexo documenta, de forma **auditável**, a criação da **pool de liquidez** BRLD/USDC na **Stellar Testnet**, partindo do estado da Parte 1 (emissão e distribuição do BRLD).

---

## Resumo do objetivo

* **Par:** `BRLD : USDC` (ambos emitidos pelo mesmo issuer neste MVP)
* **Fee:** `30` (basis points)
* **Rede:** `Test SDF Network ; September 2015` (Testnet)
  **Horizon (RPC):** `https://horizon-testnet.stellar.org`

**Contas:**

* **Issuer (BRLD & USDC demo):**
  `GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **Treasury (hot wallet / Freighter):**
  `GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`

**Ativos Classic usados:**

* **BRLD:** `BRLD:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **USDC (demo):** `USDC:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`

> **Unidades:** Classic assets têm 7 casas decimais. Em várias APIs, valores vêm em **unidades mínimas** (inteiro): `1 BRLD = 10_000_000`.

---

## Passos executados & comprovantes (hashes)

> Todas as transações ocorreram na **Testnet**.

### 1) Trustline **USDC** (Treasury)

* **Operação:** `change_trust` → `USDC:GCXW...`
* **Source:** `GAN2EYOY...`
* **Hash:** `a46a1ce3dc1b0b42cca33c08c64780c2e67ba302be655e4d4f3ae3ea5404fbec`
* **Ledger:** `431230` — **Status:** ✅

### 2) **Funding USDC** (Issuer → Treasury)

* **Operação:** `payment` → `1000.0 USDC`
* **From:** `GCXW...` → **To:** `GAN2EYOY...`
* **Hash:** `0d73120e5a4b46da869f22e7a12ef8bb6d806db71dd4325010c5f059e28d3c8e`
* **Ledger:** `431368` — **Status:** ✅

### 3) Trustline **Liquidity Pool Shares** (Treasury)

* **Operação:** `change_trust` → *liquidity\_pool\_shares* do par **BRLD/USDC**, `fee=30`
* **Source:** `GAN2EYOY...`
* **Hash:** `d918b5bb5592feaaea8a911d39d412a8a74aa0728d5a530f5b5d5a7a439fbb84`
* **Ledger:** `431565` — **Status:** ✅

### 4) **Liquidity Pool Deposit** (Treasury)

* **Operação:** `liquidity_pool_deposit`
* **Pool (StrKey):** `LAEYJQCFPZP4CBURPLXWNQ6EPPW4IGZHGLSNFZZYWJ7PN2AK76V3QKBF`
* **Pool (Hex / Horizon ID):** `0984c0457e5fc106917aef66c3c47bedc41b2732e4d2e738b27ef6e80affabb8`
* **max\_amount\_a (BRLD):** `5,000.0000000`
* **max\_amount\_b (USDC):** `1,000.0000000`
* **Faixa de preço alvo:** `min_price = 49/10 = 4.9` e `max_price = 51/10 = 5.1` (BRLD/USDC)
* **Source:** `GAN2EYOY...`
* **Hash:** `8c292878a148e5ac1e9c47386a192ec1bf5dd2e12773a8ca7e99cab2b21ea700`
* **Ledger:** `431732` — **Status:** ✅

> **Observação (IDs da pool):**
>
> * A *trustline* de LP usa o **Pool ID em StrKey** (começa com `L...`).
> * O endpoint do Horizon `/liquidity_pools/{id}` espera o **ID em hexadecimal** (32 bytes hex). Ex.: `0984c0...ffabb8`.

### 5) **Top-ups de BRLD** (Issuer → Treasury) — pós-depósito

* **0.0001 BRLD** — Hash `10f824d2c713ad5d7df5f83ae7b31d99a89f7747a22d3525e3676f093d1d0b6c`, Ledger `433003` ✅
* **0.0001 BRLD** — Hash `f842ab40385f04dcca1353f61a0dba4a4d02bfd2fc5861e20bb34e88156584a8`, Ledger `433065` ✅
* **1,000.0 BRLD** — Hash `54987e96b34f49e95a8a1ded19f8c3f7653a88cf053c33ad6752c4753c158705`, Ledger `433129` ✅
* **5,000.0 BRLD** — Hash `65fe04c316a9f169ab69ad54aebc80227475cbdf0f56da671b575eeb3e49e013`, Ledger `433158` ✅

**Saldo BRLD (Treasury) após top-ups:** `6000.0007000 BRLD` (Horizon).

---

## Evidências pós-depósito

### LP shares na Treasury

```bash
curl -s "https://horizon-testnet.stellar.org/accounts/GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4" \
| jq '.balances[] | select(.asset_type=="liquidity_pool_shares")'
```

**Retorno (amostra):**

```json
{
  "balance": "2236.0679774",
  "liquidity_pool_id": "0984c0457e5fc106917aef66c3c47bedc41b2732e4d2e738b27ef6e80affabb8",
  "limit": "922337203685.4775807",
  "last_modified_ledger": 431732,
  "is_authorized": false,
  "is_authorized_to_maintain_liabilities": false,
  "asset_type": "liquidity_pool_shares"
}
```

### Estado da pool (via **ID hex**)

```bash
POOL_HEX="0984c0457e5fc106917aef66c3c47bedc41b2732e4d2e738b27ef6e80affabb8"
curl -s "https://horizon-testnet.stellar.org/liquidity_pools/$POOL_HEX" \
| jq '{id, fee_bp, total_trustlines, total_shares, reserves: [.reserves[] | {asset, amount}]}'
```

**Amostra:**

```json
{
  "id": "0984c0457e5fc106917aef66c3c47bedc41b2732e4d2e738b27ef6e80affabb8",
  "fee_bp": 30,
  "total_trustlines": "1",
  "total_shares": "2236.0679774",
  "reserves": [
    { "asset": "BRLD:GCXW...", "amount": "5000.0000000" },
    { "asset": "USDC:GCXW...", "amount": "1000.0000000" }
  ]
}
```

### Trustlines dos ativos (Treasury)

```bash
curl -s "https://horizon-testnet.stellar.org/accounts/GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4" \
| jq '.balances[] | select((.asset_code=="BRLD" or .asset_code=="USDC") and .asset_issuer=="GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV")'
```

(Amostras mostram `is_authorized: true` e saldos consistentes.)

---

## Quotes (Soroswap / SDEX) — Provas

**Par:** `BRLSTABLE-USDC` *(mapeado para BRLD ↔ USDC classic)*

1. **1 BRLD in** (`10_000_000` unidades mín.):
   `amountOut = 1_993_602` (≈ **1.993602 USDC**), `minOut = 1_983_633`
   `platform: "sdex"`, `poolId: 0984c0...ffabb8`
   Reserves reportadas: `5000 BRLD` / `1000 USDC`.

2. **100 BRLD in** (`1_000_000_000` unidades mín.):
   `amountOut = 195_501_696` (≈ **195.501696 USDC**), `minOut = 194_524_187`
   `platform: "sdex"`, `poolId: 0984c0...ffabb8`.

> **Sanidade:** valores batem com AMM (constante produto `k=x*y`) + taxa `0,30%` e price impact crescente.

---

## Comandos usados (referência)

```bash
# (A) Trustline USDC (Treasury)
stellar tx new change-trust \
  --source-account GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --line "USDC:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --sign-with-lab

# (B) Payment 1000 USDC (Issuer -> Treasury)
stellar tx new payment \
  --source-account GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV \
  --destination GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --asset "USDC:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --amount 1000 \
  --sign-with-lab

# (C) Trustline de LP shares (BRLD/USDC, fee 30)
# Laboratory → Operation: Change Trust → Liquidity pool shares

# (D) Liquidity Pool Deposit
# Laboratory → Operation: Liquidity pool deposit
#   PoolID (StrKey): LAEYJQCF...KBF
#   max_amount_a (BRLD): 5000.0000000
#   max_amount_b (USDC): 1000.0000000
#   min_price=49/10, max_price=51/10
```

---

## Pitfalls registrados

* **Pool ID no Horizon:** `/liquidity_pools/{id}` requer **ID hex**; o `L...` (StrKey) é para *trustline*.
* **`tx_bad_seq`:** garantir que **source** e **sequence** coincidam entre build e assinatura.
* **`tx_bad_auth`:** quem assina precisa ser a **source\_account** da transação.
* **Unidades `--amount`:** no `stellar tx new payment`, o valor é humano (ex.: `--amount 1000` = `1000.0000000`). Já em APIs do agregador, normalmente são **unidades mínimas** (inteiros).

---

## Próximos passos sugeridos

1. Habilitar execução real de `sell` na API do MVP:

   * `DEFY_ENABLE_SELL=real`
   * `LOG_LEVEL=debug`
     `docker compose up -d --build`
2. Verificar mapeamentos dentro do container:

   * `STELLAR_ASSET_BRLSTABLE=BRLD:GCXW...`
   * `STELLAR_ASSET_USDSTABLE=USDC:GCXW...`
   * `STELLAR_TREASURY_SECRET_FILE` montado com a seed da Treasury.
3. Disparar depósito (webhook) para smoke E2E e observar **orders/trades/logs**.
4. (Opcional) Criar pools adicionais (ex.: BRLD↔XLM / BRLD↔BTC) para habilitar outras pernas do produto.

---

**Conclusão:** A pool **BRLD↔USDC** foi criada e provisionada (`5k BRLD` / `1k USDC`). A Treasury possui `~2236.0679774` LP shares e **quotes** via agregador retornam rota `sdex` consistente com a pool. Pronto para smoke **E2E** no MVP.
