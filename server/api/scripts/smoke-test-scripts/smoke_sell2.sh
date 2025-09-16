# scripts/smoke_sell.sh
set -euo pipefail
API="http://localhost:8080"
USER_ID="00000000-0000-0000-0000-000000000001" # ajuste para o seed

echo "== Carteira antes =="
curl -s -H "x-user-id: $USER_ID" -H "Authorization: Bearer $TOKEN" "$API/portfolio" | jq '.wallets | map({symbol, balance_units})' -s

echo "== SELL BTC 0.002 em 2 chunks =="
curl -s -X POST "$API/sell" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{"symbol":"BTC","amount":"0.002","client_ref":"smoke-sell-1","chunks":2}' | jq '.id, .status, .received_brl_centavos, .trades | length'

echo "== Carteira depois =="
curl -s -H "x-user-id: $USER_ID" "$API/portfolio" | jq '.wallets | map({symbol, balance_units})'
