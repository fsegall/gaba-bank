#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
API="${API:-devtoken}"
USER="${USER:-user-e2e-soroban-01}"
AMT_CENTS="${AMT_CENTS:-5000}"          # R$ 50,00
TXID="E2ESORO-$(date +%s)-$RANDOM"

echo "=== E2E SOROBAN start"
echo "BASE=$BASE USER=$USER AMT_CENTS=$AMT_CENTS TXID=$TXID"

echo "1) /health"
curl -fsS "$BASE/health" | jq .

echo "2) Disparando webhook pix.pago (rota permissiva /webhooks/psp)"
BODY=$(jq -n \
  --arg tx "$TXID" \
  --arg user "$USER" \
  --arg cur "BRL" \
  --arg product "AUTOBUY" \
  --arg target "soroban" \
  --arg psp_ref "$TXID" \
  --argjson cents "$AMT_CENTS" '
  {
    type: "pix.pago",
    txid: $tx,
    psp_ref: $psp_ref,
    valor_centavos: $cents,
    currency: $cur,
    user_id: $user,
    metadata: { product: $product, target: $target }
  }')

curl -fsS -X POST "$BASE/webhooks/psp" \
  -H "Authorization: Bearer $API" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq .

echo "3) Aguardando execução do AUTOBUY..."
sleep 3

echo "4) Consultas de conferência"
echo "- Orders:"
curl -fsS "$BASE/_debug/orders_view" -H "Authorization: Bearer $API" | jq .
echo "- Trades:"
curl -fsS "$BASE/trades" -H "Authorization: Bearer $API" | jq .
echo "- Eventos de Vault:"
curl -fsS "$BASE/vault/events" -H "Authorization: Bearer $API" | jq .
echo "- Posição no Vault:"
curl -fsS "$BASE/vault/position?user_id=$USER" -H "Authorization: Bearer $API" | jq .
echo "- Portfolio:"
curl -fsS "$BASE/portfolio?user_id=$USER" -H "Authorization: Bearer $API" | jq .

echo "=== E2E SOROBAN done"
