# Stellar Testnet — BRLD (Classic Asset) — Setup & Proof

Este documento registra, de forma auditável, as ações realizadas na **Stellar Testnet** para viabilizar o token **BRLD** e preparar a criação de **pool de liquidez** para o nosso MVP.

---

## Rede e endpoints

* **Network:** `Test SDF Network ; September 2015` (Testnet)
* **Horizon (RPC):** `https://horizon-testnet.stellar.org`

---

## Contas envolvidas

* **Issuer (emissor do BRLD)**
  `GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV`

* **Treasury (hot wallet / Freighter) — recebe BRLD e proverá liquidez**
  `GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4`

* **(Legacy) Treasury master (não usada nas tx bem-sucedidas)**
  `GBIACMKWYREO2GFNFFTRRY5MRYJS5HON7IJA4UZ5L3CWSVMSG2MSWJFS`

---

## Transações confirmadas (hashes & detalhes)

### 1) Change Trust (Treasury → adiciona trustline para BRLD)

* **Operação:** `change_trust` para o asset `BRLD:GCXWBWKZ...`
* **Source:** `GAN2EYOY5JPIG24HUH...`
* **Hash:** `8d702312ab154dc84a4ee2676aa42e0de069b257c7e6ac8a2312d35700a65bba`
* **Ledger:** `430298`
* **Status:** sucesso ✅

### 2) Seed (Issuer → Treasury) — 0.0005 BRLD

* **Operação:** `payment` `0.0005 BRLD`
* **From:** `GCXWBWKZ...` → **To:** `GAN2EYOY5...`
* **Hash:** `d1a04346089e1a76e2c7327a0eaa0d33103d0bd67f4b22dcaf687851c71f5bf4`
* **Ledger:** `430377`
* **Status:** sucesso ✅

### 3) Mint & Transfer (Issuer → Treasury) — 5,000.0 BRLD

* **Operação:** `payment` `5000 BRLD`
* **From:** `GCXWBWKZ...` → **To:** `GAN2EYOY5...`
* **Hash:** `c4ec5c72c48d0812e343229620e82d74eacd416217358265e7a661719eca125b`
* **Ledger:** `430501`
* **Status:** sucesso ✅

---

## Evidências de saldo (Horizon)

* **Treasury (GAN2EYOY…):** retorno do Horizon após as tx:
  `balance BRLD = 5000.0005000`

* **Issuer (GCXWBWKZ…):** mantém XLM nativo para fees; saldo BRLD do emissor varia conforme emissão.

**Comandos úteis (verificação):**

```bash
# Treasury (mostra saldo BRLD)
curl -s "https://horizon-testnet.stellar.org/accounts/GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4" \
  | jq '.balances[] | select(.asset_code=="BRLD") | {asset_code, asset_issuer, balance}'

# Issuer (mostra saldos/ativos)
curl -s "https://horizon-testnet.stellar.org/accounts/GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  | jq '.balances[] | {asset_type, asset_code, balance}'
```

---

## Tentativas que falharam (para auditoria)

> Mantidas por completude — mostram o caminho e validações que fizemos.

* **Change Trust assinada pela conta incorreta (tx\_bad\_auth)**
  **Hash:** `b7959d23c727f3b1e0ea711c6d77ba2b955a830bbd49abfafdf91021ce4dfce0`
  **Status:** falha (auth) ❌

---

## Comandos utilizados (exemplos)

> As assinaturas foram feitas via **Freighter** ou **Laboratory**, e o envio via **Horizon**.

```bash
# Variáveis de ambiente (testnet)
export STELLAR_RPC_URL="https://horizon-testnet.stellar.org"
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# (1) Trustline BRLD na Treasury
stellar tx new change-trust \
  --source-account GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --line "BRLD:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --sign-with-lab

# (2) Seed 0.0005 BRLD (Issuer → Treasury)
stellar tx new payment \
  --source-account GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV \
  --destination GAN2EYOY5JPIG24HUH3FEQQSFDGNPRZAIN272GPZX6MXEMY7FI7GPUH4 \
  --asset "BRLD:GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV" \
  --amount 5000  # unidade humana (5e3 BRLD)
  --sign-with-lab
```

---

## Próximos passos (Parte 2 — criação de pool)

1. **SAC (Stellar Asset Contract) do BRLD:** implantar/obter o **Contract ID** equivalente ao `BRLD:GCXWBWKZ...` para uso no Soroswap (roteador opera via contratos).
2. **Atualizar `.env`** com `STELLAR_ASSET_BRL=<ContractID>` e rebuild.
3. **Criar pool no Soroswap (testnet)** — recomendação inicial: **BRLD ↔ USDC** (ou XLM) e adicionar liquidez.
4. **Smoke E2E:** webhook PIX → crédito → ordens → swaps → wallets; checar métricas e eventos.

---

**Contato/observação:** este doc existe para comprovar, com hashes e ledgers, o uso do ecossistema **Stellar** no MVP. Guarde os hashes acima para auditoria/demos.
