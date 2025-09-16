# Stellar Testnet — Vault USDC (Soroban) — \*\*Parte 4: Saque (Withdraw)

> Continuação da Parte 3 (depósito). Aqui registramos o **withdraw total** das shares do rebalancer e as verificações pós-saque na **Testnet**.

---

## Contexto

* **Rede:** Test SDF Network ; September 2015 (Testnet)
* **Horizon:** [https://horizon-testnet.stellar.org](https://horizon-testnet.stellar.org)
* **Soroban RPC:** [https://soroban-testnet.stellar.org](https://soroban-testnet.stellar.org)
* **Vault (contrato):** `VAULT_C = CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4`
* **USDC (SAC):** `USDC_C = CC7GPRBMMWTIQDSX6TQIEMEEWMFPSJK3DVCEDY2AX2U3MJSUBY2HJ4F5`
* **Issuer/Admin do SAC:** `ADMIN_G = GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`
* **Tesouraria (Rebalancer):** `REBAL_G = GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`
* **Fee do Vault:** `fee_bps = 100` (1%)

**Estado de partida (após Parte 3):**

* `total_assets ≈ 9_900_000`
* `total_shares ≈ 9_900_000`
* Tesouraria possui `9_900_000` shares.

---

## A) Preparar identidade do rebalancer

> O saque exige **assinatura** do dono das shares. Cadastre o alias `rebal` apontando para a seed (S…) do `REBAL_G`.

```bash
# (opcional) remover alias antigo
stellar keys rm rebal

# criar/recriar o alias e COLAR a S… do GAN2… quando o CLI pedir
stellar keys add rebal --secret-key

# conferir: precisa imprimir exatamente o GAN2…
stellar keys public-key rebal
# => GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4
```

---

## B) Executar o withdraw (shares → SAC de volta)

> Parâmetros obrigatórios: `owner` (dono das shares) e `to` (destinatário do ativo base). No nosso caso, ambos são a **tesouraria**.

```bash
stellar contract invoke \
  --id "$VAULT_C" \
  --source rebal \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  --send yes \
  -- withdraw --owner "$REBAL_G" --to "$REBAL_G" --shares 9900000
```

**Eventos esperados (amostra):**

```
transfer … {"i128":"9900000"}
withdraw_event … { amount: 9900000, shares: 9900000 }
```

---

## C) Verificações pós-saque

```bash
# saldo do USDC_SAC no contrato do Vault → 0
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$VAULT_C"

# saldo do USDC_SAC da tesouraria → 10_000_000 (1 USDC)
stellar contract invoke --id "$USDC_C" --source issuer \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$REBAL_G"

# métricas do cofre → 0
stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- total_assets
stellar contract invoke --id "$VAULT_C" --source admin \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- total_shares
```

**Esperado:**

* `balance(USDC_C, VAULT_C) = "0"`
* `balance(USDC_C, REBAL_G) = "10000000"`
* `total_assets = "0"` e `total_shares = "0"`

---

## D) Troubleshooting (erros vistos)

* **Missing signing key / Account not found**

  * Causa: alias `rebal` apontando para chave errada (ex.: índice 0 do mnemonic) ou conta não fundeada.
  * Correção: recriar `rebal` com a **secret do GAN2…** (tesouraria) e conferir `stellar keys public-key rebal`.

* **Parâmetros inválidos**

  * Use `stellar contract invoke --id "$VAULT_C" -- … -- withdraw --help` para ver os nomes exatos dos args (neste contrato: `owner`, `to`, `shares`).

---

## E) (Opcional) Script TS de saque

Salvar em `api/scripts/vault/stellar-sdk/vault_withdraw.ts` e executar com `npx tsx ...` (assina com `REBAL_S`).

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

**Execução:**

```bash
# envs necessários
export SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
export VAULT_C="CACSDEDE7JWKISY5HRIWTZUPSEZVSMCZUV3SZCY6O63GWIOV6EMPBQN4"
export REBAL_G="GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4"
export REBAL_S=...   # seed da tesouraria

# sacar 9_900_000 shares
npx tsx scripts/vault/stellar-sdk/vault_withdraw.ts --shares=9900000
```

> Observação: o script acima não depende dos helpers locais e usa apenas `@stellar/stellar-sdk` + RPC do Soroban.
