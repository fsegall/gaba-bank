# Stellar Testnet — Vault USDC (Soroban) — **Parte 3: Depósito inicial**

> Continuação do histórico já auditável (BRLD/USDC classic + pool). Aqui registramos os passos e comandos para **provisionar USDC\_SAC** e **depositar no Vault** na **Testnet**.

---

## Resumo / Contexto

* **Rede:** Testnet (`Test SDF Network ; September 2015`)
* **Horizon:** `https://horizon-testnet.stellar.org`
* **Soroban RPC:** `https://soroban-testnet.stellar.org`
* **Vault (contrato):** `VAULT_C = CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4`
* **USDC (SAC):** `USDC_C = CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5`
* **Issuer/Admin do SAC:** `ADMIN_G = GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **Tesouraria (Rebalancer):** `REBAL_G = GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`
* **Fee do Vault:** `fee_bps = 100` (1%)

> ⚠️ **Observação importante:** o SAC de USDC atual **não expõe** `deposit/withdraw` para "wrap" de Classic → SAC. Para o MVP na testnet, o caminho é **mintar** USDC\_SAC para a tesouraria e, em seguida, **depositar no Vault**.

---

## A) Preparar ambiente

```bash
# Testnet
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
export SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"

# IDs on-chain
export VAULT_C="CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4"
export USDC_C="CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5"

# Contas (públicas)
export ADMIN_G="GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV"  # Issuer/Admin do SAC
export REBAL_G="GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4"  # Tesouraria

# Seeds (NÃO comitar em .env; preferir arquivos em ops/secrets)
export REBAL_S="$(tr -d '\n' < ../ops/secrets/stellar_treasury_secret)"  # seed da tesouraria
export ISSUER_S="$(tr -d '\n' < ../ops/secrets/stellar_issuer_secret)"   # seed do issuer GCX...

# (Opcional) Configurar aliases no CLI (recomendado):
# stellar keys add issuer --secret-key   # cole a seed de GCX...
# stellar keys add rebal  --secret-key   # cole a seed de GAN2...
# stellar keys use rebal                  # para usar como source padrão quando necessário
```

> Dica: Se já existir um alias `admin` apontando para **GAN2…**, crie um alias **separado** `issuer` para a seed de **GCX…** (evita confusão).

---

## B) **Mint** de USDC\_SAC para a tesouraria (desbloqueio em testnet)

> `1 USDC` com `decimals=7` ⇢ `10_000_000` unidades.

```bash
# 1) Conferir decimals (esperado: 7)
stellar contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- decimals

# 2) Mint 1 USDC_SAC para a tesouraria (GAN2…)
stellar contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- mint --to "$REBAL_G" --amount 10000000

# 3) (Recomendado) Autorizar contas no SAC (se o token exigir autorização)
stellar contract invoke \
  --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- set_authorized --id "$REBAL_G" --authorize true

stellar contract invoke \
  --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- set_authorized --id "$VAULT_C" --authorize true

# 4) Conferir saldo SAC da tesouraria (esperado: "10000000")
steller contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$REBAL_G"
```

> Após `stellar keys add issuer`, sempre que possível prefira `--source issuer` (alias) em vez de passar a seed diretamente.

---

## C) Depósito no Vault (via Node/TS script)

Os scripts vivem em `api/scripts/vault/stellar-sdk`. O depósito assina como **Rebalancer**.

```bash
# 1 USDC_SAC → Vault (de/para tesouraria)
REBAL_S="$REBAL_S" npx tsx scripts/vault/stellar-sdk/vault_deposit.ts \
  --units 10000000 \
  --fromG "$REBAL_G" \
  --toG   "$REBAL_G"
```

**O que esperar:**

* O Vault cobra `1%` → evento `transfer ... 9900000` do rebalancer para o Vault.
* Após o 1º depósito:

  * `total_assets ≈ 9_900_000`
  * `total_shares ≈ 9_900_000`
  * `price_per_share_scaled = 1_000_000` (PPS = 1.0, escala 1e6)

---

## D) Verificações do estado do Vault

```bash
stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- base_asset

stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- fee_bps

stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- total_assets

stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- total_shares

stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- price_per_share_scaled
```

**Esperado (após 1 USDC in):**

* `base_asset` = `USDC_C`
* `fee_bps` = `100`
* `total_assets` \~ `"9900000"`
* `total_shares` \~ `"9900000"`
* `price_per_share_scaled` = `"1000000"`

---

## Troubleshooting (erros vistos e correções)

* **`Error(Value, InvalidInput) ... symbol not found ... deposit`**

  * Causa: tentativa de usar `deposit` no **SAC** (não suportado nesta build).
  * Solução: usar `mint` (seu ambiente é testnet) e seguir para o depósito no Vault.

* **`resulting balance is not within the allowed range` com `-9900000`**

  * Causa: Vault tentou `transfer` da tesouraria sem saldo SAC suficiente.
  * Solução: garantir `mint` prévio (passo B) e saldo `>= amount - fee` antes do `vault_deposit`.

* **`.env` quebrando no `source`**

  * Causa: linha com `DEFINDEX_VAULT_ADDRESS=<preencher após criar>` (caracteres `< >`).
  * Solução: comentar ou deixar vazio: `# DEFINDEX_VAULT_ADDRESS=`.

* **Seeds em `.env`**

  * Evitar. Prefira `../ops/secrets/...` e export no shell (`tr -d '\n' < arquivo`).

---

## Apêndice — Comandos úteis

```bash
# Help do SAC (USDC_C)
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- --help

# Saldo SAC de qualquer Address
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- balance --id "$REBAL_G"

# Explorers (atalhos)
# - Token: https://stellar.expert/explorer/testnet/contract/CC7GPRB...
# - Vault: https://stellar.expert/explorer/testnet/contract/CACSDEDE...
```

---

## Checklist de sucesso

* [X] `balance` do SAC da tesouraria `>= 10_000_000` antes do depósito.
* [X] `vault_deposit.ts` executa sem erro.
* [X] `total_assets` e `total_shares` do Vault sobem \~`9_900_000`.
* [X] `fee_bps=100` e `base_asset=USDC_C` conferem.

> Pronto: Vault provisionado. Próxima etapa: **withdraw + tabela de eventos** (para o front) e integração com **Anchor Platform** conforme cronograma do MVP.
