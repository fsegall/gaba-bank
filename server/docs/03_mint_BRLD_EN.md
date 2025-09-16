# Stellar Testnet — BRLD (Classic Asset) — Setup & Proof

This document records, in an auditable way, the actions performed on **Stellar Testnet** to enable the **BRLD** token and prepare the creation of **liquidity pool** for our MVP.

---

## Network and endpoints

* **Network:** `Test SDF Network ; September 2015` (Testnet)
* **Horizon (RPC):** `https://horizon-testnet.stellar.org`

---

## Accounts involved

* **Issuer (BRLD issuer)**
  `GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`

* **Treasury (hot wallet / Freighter) — receives BRLD and will provide liquidity**
  `GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`

* **(Legacy) Treasury master (not used in successful tx)**
  `GBIACMKWYREO2GFNFFTRRY5MRYJS5HON7IJA4UZ5L3CWSVMSG2MSWJFS`

---

## Confirmed transactions (hashes & details)

### 1) Change Trust (Treasury → adds trustline for BRLD)

* **Operation:** `change_trust` for asset `BRLD:GCXWBWKZ...`
* **Source:** `GAN2EYOY5JPIG24HUH...`
* **Hash:** `8d702312ab154dc84a4ee2676aa42e0de069b257c7e6ac8a2312d35700a65bba`
* **Ledger:** `430298`
* **Status:** success ✅

### 2) Seed (Issuer → Treasury) — 0.0005 BRLD

* **Operation:** `payment` `0.0005 BRLD`
* **From:** `GCXWBWKZ...` → **To:** `GAN2EYOY5...`
* **Hash:** `d1a04346089e1a76e2c7327a0eaa0d33103d0bd67f4b22dcaf687851c71f5bf4`
* **Ledger:** `430377`
* **Status:** success ✅

### 3) Mint & Transfer (Issuer → Treasury) — 5,000.0 BRLD

* **Operation:** `payment` `5000 BRLD`
* **From:** `GCXWBWKZ...` → **To:** `GAN2EYOY5...`
* **Hash:** `c4ec5c72c48d0812e343229620e82d74eacd416217358265e7a661719eca125b`
* **Ledger:** `430501`
* **Status:** success ✅

---

## Balance evidence (Horizon)

* **Treasury (GAN2EYOY…):** Horizon return after tx:
  `balance BRLD = 5000.0005000`

* **Issuer (GCXWBWKZ…):** maintains native XLM for fees; BRLD balance varies according to issuance.

**Useful commands (verification):**

```bash
# Treasury (shows BRLD balance)
curl -s "https://horizon-testnet.stellar.org/accounts/GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4" \
  | jq '.balances[] | select(.asset_code=="BRLD") | {asset_code, asset_issuer, balance}'

# Issuer (shows balances/assets)
curl -s "https://horizon-testnet.stellar.org/accounts/GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  | jq '.balances[] | {asset_type, asset_code, balance}'
```

---

## Failed attempts (for audit)

> Kept for completeness — shows the path and validations we made.

* **Change Trust signed by wrong account (tx\_bad\_auth)**
  **Hash:** `b7959d23c727f3b1e0ea711c6d77ba2b955a830bbd49abfafdf91021ce4dfce0`
  **Status:** failed (auth) ❌

---

## Commands used (examples)

> Signatures were made via **Freighter** or **Laboratory**, and submission via **Horizon**.

```bash
# Environment variables (testnet)
export STELLAR_RPC_URL="https://horizon-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# (1) BRLD Trustline in Treasury
stellar tx new change-trust \
  --source-account GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --line "BRLD:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --sign-with-lab

# (2) Seed 0.0005 BRLD (Issuer → Treasury)
stellar tx new payment \
  --source-account GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV \
  --destination GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --asset "BRLD:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --amount 5000  # human unit (5e3 BRLD)
  --sign-with-lab
```

---

## Next steps (Part 2 — pool creation)

1. **SAC (Stellar Asset Contract) of BRLD:** deploy/get the **Contract ID** equivalent to `BRLD:GCXWBWKZ...` for use in Soroswap (router operates via contracts).
2. **Update `.env`** with `STELLAR_ASSET_BRL=<ContractID>` and rebuild.
3. **Create pool on Soroswap (testnet)** — initial recommendation: **BRLD ↔ USDC** (or XLM) and add liquidity.
4. **Smoke E2E:** PIX webhook → credit → orders → swaps → wallets; check metrics and events.

---

**Contact/observation:** this doc exists to prove, with hashes and ledgers, the use of the **Stellar** ecosystem in the MVP. Keep the hashes above for audit/demos.
