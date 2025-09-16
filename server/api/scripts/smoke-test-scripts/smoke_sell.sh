#!/usr/bin/env bash
set -euo pipefail

TOKEN=${TOKEN:-devtoken}
USER=${USER:-00000000-0000-0000-0000-000000000001}

echo "1) Health:"
curl -s http://localhost:8080/health | jq .

echo "2) Products:"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/products | jq '.[].id'

echo "3) Criar depósito R$ 100 (para ter BTC/ETH via autobuy defy-balanced):"
DEP=$(curl -s -X POST http://localhost:8080/depositos \
  -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" \
  -H "content-type: application/json" -d '{"valor_centavos":10000}')
echo "$DEP"
TXID=$(jq -r .txid <<< "$DEP")
echo "TXID=$TXID"

echo "4) Webhook pago:"
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H "x-provider-signature: test" -H "content-type: application/json" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"abc-sell\",\"txid\":\"$TXID\",\"valor_centavos\":10000}" | jq .

echo "5) Portfolio (antes do SELL):"
curl -s -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" http://localhost:8080/portfolio | jq .

echo "6) SELL 0.05 BTC:"
curl -s -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" \
  -H "content-type: application/json" \
  -d '{"side":"sell","symbol":"BTC","qty":0.05,"slippage_bps":50}' | jq .

echo "7) Portfolio (após SELL):"
curl -s -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" http://localhost:8080/portfolio | jq .

echo "OK."
