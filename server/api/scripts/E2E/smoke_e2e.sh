#!/usr/bin/env bash
set -euo pipefail

# ===== Config por ENV =====
BASE_URL="${BASE_URL:-http://localhost:8080}"
API_TOKEN="${DEFY_API_TOKEN:-devtoken}"
PSP_SECRET="${PSP_WEBHOOK_SECRET:-whsec_xxx}"
USER_ID="${USER_ID:-user-e2e-01}"
AMOUNT_CENTS="${AMOUNT_CENTS:-5000}"   # R$ 50,00
TARGET="${TARGET:-defindex}"           # defindex | self | lp

# vaults alvo para checagem
SELF_VAULT_ID="${VAULT_DEFAULT_ID:-defy-vault-01}"
DEFINDEX_VAULT_ADDR="${DEFINDEX_VAULT_ADDRESS:-C...}"  # C... ou vazio (ok para self/lp)

AUTH_HDR="Authorization: Bearer ${API_TOKEN}"

echo "=== E2E start: TARGET=${TARGET} USER_ID=${USER_ID} AMOUNT_CENTS=${AMOUNT_CENTS}"

# 1) Dispara WEBHOOK Pix (pago)
TXID="E2E-$(date +%s)-$RANDOM"
TS=$(date +%s%3N)

# payload básico — inclua campos que sua ingestão usa (userId/metadata ajudam a roteamento)
read -r -d '' BODY <<JSON
{
  "type": "pix.pago",
  "data": {
    "pix_txid": "${TXID}",
    "amount_cents": ${AMOUNT_CENTS},
    "currency": "BRL",
    "payer": { "tax_id": "00000000000" },
    "metadata": {
      "user_id": "${USER_ID}",
      "product": "AUTOBUY",
      "target": "${TARGET}"         // ajuda no roteamento/observabilidade
    }
  }
}
JSON

SIG=$(printf "%s.%s" "$TS" "$BODY" | openssl dgst -sha256 -hmac "$PSP_SECRET" -hex | awk '{print $2}')
set +e
RESP=$(curl -sS -X POST "${BASE_URL}/webhooks/psp" \
  -H "$AUTH_HDR" \
  -H "X-Timestamp: ${TS}" \
  -H "X-Signature: v1=${SIG}" \
  -H "Content-Type: application/json" \
  -d "$BODY")
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "[ERR] webhook request failed"; exit 1
fi
echo "[OK] webhook accepted: $RESP"

# 2) Polling do resultado via /portfolio
echo "=== polling portfolio…"
DEADLINE=$(( $(date +%s) + 120 )) # 2 minutos
FOUND=0

while [ $(date +%s) -lt $DEADLINE ]; do
  PORT=$(curl -sS "${BASE_URL}/portfolio?user_id=${USER_ID}" -H "$AUTH_HDR")
  echo "$PORT" | jq . >/dev/null 2>&1 || { echo "[WARN] portfolio not JSON ainda"; sleep 2; continue; }

  case "$TARGET" in
    defindex)
      # procura shares > 0 no vault Defindex (id = endereço C… ou slug que você esteja usando)
      SHARES=$(echo "$PORT" | jq -r --arg vid "${DEFINDEX_VAULT_ADDR}" '
        (.vaults // []) | map(select(.id==$vid)) | .[0].shares // 0
      ')
      if [ "${SHARES}" != "0" ] && [ "${SHARES}" != "null" ]; then FOUND=1; break; fi
      ;;
    self)
      SHARES=$(echo "$PORT" | jq -r --arg vid "${SELF_VAULT_ID}" '
        (.vaults // []) | map(select(.id==$vid)) | .[0].shares // 0
      ')
      if [ "${SHARES}" != "0" ] && [ "${SHARES}" != "null" ]; then FOUND=1; break; fi
      ;;
    lp)
      # Fallback: verificar se carteira USDC aumentou (dá pra sofisticar lendo trades/Liquidity)
      USDC=$(echo "$PORT" | jq -r '.wallets | to_entries[]? | select(.key=="USDC") | .value.units // 0')
      if [ -n "$USDC" ] && [ "$USDC" != "0" ]; then FOUND=1; break; fi
      ;;
    *)
      echo "[ERR] TARGET inválido: $TARGET"; exit 1;;
  esac
  sleep 2
done

if [ $FOUND -ne 1 ]; then
  echo "[FAIL] não observei efeito no portfolio a tempo (TARGET=${TARGET}). Último snapshot:"
  echo "$PORT" | jq .
  exit 2
fi

echo "✅ E2E OK (TARGET=${TARGET})"
echo "$PORT" | jq .
