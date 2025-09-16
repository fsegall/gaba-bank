#!/usr/bin/env bash
set -Eeuo pipefail

TOKEN="${TOKEN:-devtoken}"
USER="${USER:-00000000-0000-0000-0000-000000000001}"
API="${API:-http://localhost:8080}"
AMOUNT="${AMOUNT:-10000}" # 100 reais em centavos

curl_do() {
  # -S mostra erros, --fail-with-body faz o curl sair com erro em 4xx/5xx
  curl -sS --fail-with-body --connect-timeout 3 --max-time 20 "$@"
}

echo "1) Health:"
curl_do "${API}/health" || { echo "ERRO: health falhou"; exit 1; }
echo

echo "2) Products:"
curl_do -H "Authorization: Bearer ${TOKEN}" "${API}/products" | jq . || true
echo

echo "3) Criar depósito R$ $((AMOUNT/100)):"
DEP_JSON=$(curl_do -X POST "${API}/depositos" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-user-id: ${USER}" \
  -H "content-type: application/json" \
  -d "{\"valor_centavos\":${AMOUNT}}") || { echo "ERRO: /depositos falhou"; exit 1; }

echo "$DEP_JSON" | jq .
TXID=$(jq -re '.txid' <<<"$DEP_JSON") || { echo "ERRO: não consegui extrair .txid"; exit 1; }
echo "TXID=$TXID"
echo

echo "4) Webhook pago (dispara autobuy):"
curl_do -X POST "${API}/webhooks/psp" \
  -H "x-provider-signature: test" \
  -H "content-type: application/json" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"smoke-$(date +%s)\",\"txid\":\"${TXID}\",\"valor_centavos\":${AMOUNT}}" | jq .
echo

echo "5) Portfolio:"
curl_do -H "Authorization: Bearer ${TOKEN}" -H "x-user-id: ${USER}" \
  "${API}/portfolio" | jq .
echo "OK."

