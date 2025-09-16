#!/usr/bin/env bash
set -euo pipefail

# --------------------------
# Config
# --------------------------
API="${API:-http://localhost:8080}"   # -> use 8080 (o seu que está OK)
TOKEN="${TOKEN:-devtoken}"
USER_ID="${USER_ID:-00000000-0000-0000-0000-000000000001}"
SYMBOL="${SYMBOL:-BTC}"
SELL_AMOUNT="${SELL_AMOUNT:-0.002}"   # humano (string)
CHUNKS="${CHUNKS:-2}"
USE_SELL="${USE_SELL:-1}"             # 1 => usa /sell ; 0 => usa /orders side=sell

CURL="curl --fail-with-body --show-error --connect-timeout 3 -m 20 -sS"

hdr_auth=(-H "Authorization: Bearer $TOKEN")
hdr_json=(-H "Content-Type: application/json")
hdr_user=(-H "x-user-id: $USER_ID")

echo "API: $API"
echo "USER_ID: $USER_ID"
echo

echo "1) Health"
$CURL "$API/health" | jq .

echo
echo "2) Products"
$CURL "${hdr_auth[@]}" "$API/products" | jq '.[].id'

echo
echo "3) Portfolio (antes)"
$CURL "${hdr_auth[@]}" "${hdr_user[@]}" "$API/portfolio" | jq .

# Criar deposito R$ 100 e simular pix.pago
echo
echo "3b) Criar deposito R$ 100 e simular pix.pago"
DEP=$($CURL -X POST "${hdr_auth[@]}" "${hdr_user[@]}" "${hdr_json[@]}" \
  -d '{"valor_centavos":10000}' "$API/depositos")
echo "$DEP" | jq .
TXID=$(jq -r .txid <<< "$DEP")
$CURL -X POST "${hdr_json[@]}" \
  -H "x-provider-signature: test" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"abc\",\"txid\":\"$TXID\",\"valor_centavos\":10000}" \
  "$API/webhooks/psp" | jq .



echo
echo "4) SELL ${SELL_AMOUNT} ${SYMBOL}"
if [[ "$USE_SELL" == "1" ]]; then
  # Rota nova proposta: /sell
  # Body: { symbol, amount, client_ref, chunks }
  echo
  echo "4) SELL ${SELL_AMOUNT:-0.002} ${SYMBOL:-BTC}"
  $CURL -X POST "${hdr_auth[@]}" "${hdr_user[@]}" "${hdr_json[@]}" \
  -d "{\"symbol\":\"${SYMBOL:-BTC}\",\"amount\":\"${SELL_AMOUNT:-0.002}\",\"client_ref\":\"smoke-sell-$(date +%s)\",\"chunks\":${CHUNKS:-2}}" \
  "$API/sell" | tee /tmp/defy_sell_resp.json | jq '.id, .status, .received_brl_centavos, (.trades | length)'

else
  # Fallback para rota antiga: /orders com side=sell (se esse for o caminho atual)
  # Body: { side:"sell", symbol, qty, slippage_bps }
  $CURL -X POST "${hdr_auth[@]}" "${hdr_user[@]}" "${hdr_json[@]}" \
    -d "{\"side\":\"sell\",\"symbol\":\"$SYMBOL\",\"qty\":$SELL_AMOUNT,\"slippage_bps\":50}" \
    "$API/orders" | jq .
fi

echo
echo "5) Portfolio (depois)"
$CURL "${hdr_auth[@]}" "${hdr_user[@]}" "$API/portfolio" | jq .

echo
echo "OK."
