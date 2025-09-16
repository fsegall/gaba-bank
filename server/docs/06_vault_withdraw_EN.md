# Stellar Testnet — Vault USDC (Soroban) — **Part 4: Withdraw**

> Continuation of Part 3 (deposit). Here we record the **total withdraw** of rebalancer shares and post-withdraw verifications on **Testnet**.

---

## Context

* **Network:** Test SDF Network ; September 2015 (Testnet)
* **Horizon:** [https://horizon-testnet.stellar.org](https://horizon-testnet.stellar.org)
* **Soroban RPC:** [https://soroban-testnet.stellar.org](https://soroban-testnet.stellar.org)
* **Vault (contract):** `VAULT_C = CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4`
* **USDC (SAC):** `USDC_C = CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5`
* **Issuer/Admin of SAC:** `ADMIN_G = GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **Treasury (Rebalancer):** `REBAL_G = GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`
* **Vault Fee:** `fee_bps = 100` (1%)

**Starting state (after Part 3):**

* `total_assets ≈ 9_900_000`
* `total_shares ≈ 9_900_000`
* Treasury owns `9_900_000` shares.

---

## A) Prepare rebalancer identity

> Withdraw requires **signature** from the shares owner. Register the `rebal` alias pointing to the seed (S…) of `REBAL_G`.

```bash
# (optional) remove old alias
stellar keys rm rebal

# create/recreate alias and PASTE the S… of GAN2… when CLI asks
stellar keys add rebal --secret-key

# check: must print exactly GAN2…
stellar keys public-key rebal
# => GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4
```

---

## B) Execute withdraw (shares → SAC back)

> Required parameters: `owner` (shares owner) and `to` (base asset recipient). In our case, both are the **treasury**.

```bash
stellar contract invoke \
  --id "$VAULT_C" \
  --source rebal \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- withdraw --owner "$REBAL_G" --to "$REBAL_G" --shares 9900000
```

**Expected events (sample):**

```
transfer … {"i128":"9900000"}
withdraw_event … { amount: 9900000, shares: 9900000 }
```

---

## C) Post-withdraw verifications

```bash
# USDC_SAC balance in Vault contract → 0
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$VAULT_C"

# USDC_SAC balance of treasury → 10_000_000 (1 USDC)
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$REBAL_G"

# vault metrics → 0
stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- total_assets
stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- total_shares
```

**Expected:**

* `balance(USDC_C, VAULT_C) = "0"`
* `balance(USDC_C, REBAL_G) = "10000000"`
* `total_assets = "0"` and `total_shares = "0"`

---

## D) Troubleshooting (errors seen)

* **Missing signing key / Account not found**

  * Cause: `rebal` alias pointing to wrong key (ex.: index 0 of mnemonic) or unfunded account.
  * Fix: recreate `rebal` with **GAN2… secret** (treasury) and check `stellar keys public-key rebal`.

* **Invalid parameters**

  * Use `stellar contract invoke --id "$VAULT_C" -- … -- withdraw --help` to see exact arg names (in this contract: `owner`, `to`, `shares`).

---

## E) (Optional) TS withdraw script

Save in `api/scripts/vault/stellar-sdk/vault_withdraw.ts` and run with `npx tsx ...` (signs with `REBAL_S`).

```ts
#!/usr/bin/env ts-node
import "dotenv/config";
import { Keypair, SorobanRpc, xdr, Address, Contract } from "@stellar/stellar-sdk";

function req(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

(async () => {
  const RPC = new SorobanRpc.Server(req("SOROBAN_RPC_URL"));
  const NET = req("STELLAR_NETWORK_PASSPHRASE");
  const VAULT_C = req("VAULT_C");
  const REBAL_S = req("REBAL_S");
  const OWNER_G = process.env.OWNER_G || req("REBAL_G");
  const TO_G = process.env.TO_G || req("REBAL_G");
  const SHARES = BigInt(process.argv.find(a => a.startsWith("--shares="))?.split("=")[1] || "0");
  if (SHARES <= 0n) throw new Error("pass --shares=<i128>");

  const kp = Keypair.fromSecret(REBAL_S);
  const owner = Address.fromString(OWNER_G);
  const to = Address.fromString(TO_G);
  const contract = new Contract(VAULT_C);

  let tx = await contract.call("withdraw", owner.toScVal(), to.toScVal(), xdr.ScVal.scvI128(xdr.Int128Parts.new(xdr.Uint64.fromString((SHARES >> 64n).toString()), xdr.Uint64.fromString((SHARES & ((1n<<64n)-1n)).toString())))).toTransaction({
    fee: "10000",
    networkPassphrase: NET,
    source: kp.publicKey(),
  });

  tx = await RPC.prepareTransaction(tx);
  const signed = tx.sign(kp);
  const res = await RPC.sendTransaction(signed);
  if (res.status !== "SUCCESS") throw new Error(JSON.stringify(res, null, 2));
  console.log("OK:", res.hash);
})();
```

**Execution:**

```bash
# required envs
export SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
export VAULT_C="CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4"
export REBAL_G="GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4"
export REBAL_S=...   # treasury seed

# withdraw 9_900_000 shares
npx tsx scripts/vault/stellar-sdk/vault_withdraw.ts --shares=9900000
```

> Note: the script above doesn't depend on local helpers and uses only `@stellar/stellar-sdk` + Soroban RPC.
