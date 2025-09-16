# Stellar Testnet — Vault USDC (Soroban) — **Part 3: Initial Deposit**

> Continuation of the already auditable history (BRLD/USDC classic + pool). Here we record the steps and commands to **provision USDC\_SAC** and **deposit in Vault** on **Testnet**.

---

## Summary / Context

* **Network:** Testnet (`Test SDF Network ; September 2015`)
* **Horizon:** `https://horizon-testnet.stellar.org`
* **Soroban RPC:** `https://soroban-testnet.stellar.org`
* **Vault (contract):** `VAULT_C = CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4`
* **USDC (SAC):** `USDC_C = CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5`
* **Issuer/Admin of SAC:** `ADMIN_G = GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **Treasury (Rebalancer):** `REBAL_G = GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`
* **Vault Fee:** `fee_bps = 100` (1%)

> ⚠️ **Important note:** the current USDC SAC **does not expose** `deposit/withdraw` for Classic → SAC "wrapping". For the MVP on testnet, the path is **minting** USDC\_SAC to treasury and then **depositing in Vault**.

---

## A) Prepare environment

```bash
# Testnet
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
export SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"

# On-chain IDs
export VAULT_C="CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4"
export USDC_C="CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5"

# Accounts (public)
export ADMIN_G="GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV"  # Issuer/Admin of SAC
export REBAL_G="GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4"  # Treasury

# Seeds (DO NOT commit in .env; prefer files in ops/secrets)
export REBAL_S="$(tr -d '\n' < ../ops/secrets/stellar_treasury_secret)"  # treasury seed
export ISSUER_S="$(tr -d '\n' < ../ops/secrets/stellar_issuer_secret)"   # issuer seed GCX...

# (Optional) Configure aliases in CLI (recommended):
# stellar keys add issuer --secret-key   # paste the GCX... seed
# stellar keys add rebal  --secret-key   # paste the GAN2... seed
# stellar keys use rebal                  # to use as default source when needed
```

> Tip: If there's already an `admin` alias pointing to **GAN2…**, create a **separate** `issuer` alias for the **GCX…** seed (avoids confusion).

---

## B) **Mint** USDC\_SAC to treasury (testnet unlock)

> `1 USDC` with `decimals=7` ⇢ `10_000_000` units.

```bash
# 1) Check decimals (expected: 7)
stellar contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- decimals

# 2) Mint 1 USDC_SAC to treasury (GAN2…)
stellar contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- mint --to "$REBAL_G" --amount 10000000

# 3) (Recommended) Authorize accounts in SAC (if token requires authorization)
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

# 4) Check SAC balance of treasury (expected: "10000000")
stellar contract invoke \
  --id "$USDC_C" \
  --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$REBAL_G"
```

> After `stellar keys add issuer`, whenever possible prefer `--source issuer` (alias) instead of passing the seed directly.

---

## C) Vault deposit (via Node/TS script)

Scripts live in `api/scripts/vault/stellar-sdk`. The deposit signs as **Rebalancer**.

```bash
# 1 USDC_SAC → Vault (from/to treasury)
REBAL_S="$REBAL_S" npx tsx scripts/vault/stellar-sdk/vault_deposit.ts \
  --units 10000000 \
  --fromG "$REBAL_G" \
  --toG   "$REBAL_G"
```

**What to expect:**

* Vault charges `1%` → event `transfer ... 9900000` from rebalancer to Vault.
* After 1st deposit:

  * `total_assets ≈ 9_900_000`
  * `total_shares ≈ 9_900_000`
  * `price_per_share_scaled = 1_000_000` (PPS = 1.0, scale 1e6)

---

## D) Vault state verifications

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

**Expected (after 1 USDC in):**

* `base_asset` = `USDC_C`
* `fee_bps` = `100`
* `total_assets` \~ `"9900000"`
* `total_shares` \~ `"9900000"`
* `price_per_share_scaled` = `"1000000"`

---

## Troubleshooting (errors seen and fixes)

* **`Error(Value, InvalidInput) ... symbol not found ... deposit`**

  * Cause: attempt to use `deposit` on **SAC** (not supported in this build).
  * Solution: use `mint` (your environment is testnet) and proceed to Vault deposit.

* **`resulting balance is not within the allowed range` with `-9900000`**

  * Cause: Vault tried `transfer` from treasury without sufficient SAC balance.
  * Solution: ensure prior `mint` (step B) and balance `>= amount - fee` before `vault_deposit`.

* **`.env` breaking on `source`**

  * Cause: line with `DEFINDEX_VAULT_ADDRESS=<fill after creating>` (characters `< >`).
  * Solution: comment or leave empty: `# DEFINDEX_VAULT_ADDRESS=`.

* **Seeds in `.env`**

  * Avoid. Prefer `../ops/secrets/...` and export in shell (`tr -d '\n' < file`).

---

## Appendix — Useful commands

```bash
# SAC help (USDC_C)
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- --help

# SAC balance of any Address
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- balance --id "$REBAL_G"

# Explorers (shortcuts)
# - Token: https://stellar.expert/explorer/testnet/contract/CC7GPRB...
# - Vault: https://stellar.expert/explorer/testnet/contract/CACSDEDE...
```

---

## Success checklist

* [X] SAC `balance` of treasury `>= 10_000_000` before deposit.
* [X] `vault_deposit.ts` executes without error.
* [X] Vault `total_assets` and `total_shares` rise \~`9_900_000`.
* [X] `fee_bps=100` and `base_asset=USDC_C` check out.

> Ready: Vault provisioned. Next step: **withdraw + events table** (for frontend) and integration with **Anchor Platform** according to MVP schedule.
