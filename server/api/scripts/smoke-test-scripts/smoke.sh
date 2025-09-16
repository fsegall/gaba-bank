#!/usr/bin/env bash
set -euo pipefail
TOKEN=${TOKEN:-devtoken}
USER=${USER:-00000000-0000-0000-0000-000000000001}

echo "1) Health:"
curl -s http://localhost:8080/health; echo

echo "2) Products:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/products | jq . | head -n 30

echo "3) Criar depósito R$ 100:"
DEP=$(curl -s -X POST http://localhost:8080/depositos \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-user-id: $USER" \
  -H "content-type: application/json" \
  -d '{"valor_centavos":10000}')
echo "$DEP"
TXID=$(jq -r .txid <<< "$DEP")
echo "TXID=$TXID"

echo "4) Webhook pago (dispara autobuy):"
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H "x-provider-signature: test" \
  -H "content-type: application/json" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"abc-demo\",\"txid\":\"$TXID\",\"valor_centavos\":10000}" | jq .

echo "5) Portfolio:"
curl -s -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" \
  http://localhost:8080/portfolio | jq .

echo "6) Idempotência (reenviar o mesmo webhook):"
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H "x-provider-signature: test" \
  -H "content-type: application/json" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"abc-demo\",\"txid\":\"$TXID\",\"valor_centavos\":10000}" | jq .
