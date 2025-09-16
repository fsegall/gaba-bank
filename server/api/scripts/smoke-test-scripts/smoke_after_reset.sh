# vars
TOKEN=devtoken
USER=00000000-0000-0000-0000-000000000001

# 1) Produtos (só para conferir que carregou)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/products | jq .

# 2) Criar depósito (R$ 100,00)
DEP=$(curl -s -X POST http://localhost:8080/depositos \
  -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" \
  -H "content-type: application/json" -d '{"valor_centavos":10000}')
TXID=$(jq -r .txid <<< "$DEP"); echo "TXID=$TXID"

# 3) Simular webhook PIX pago (sem Authorization; com assinatura)
curl -s -X POST http://localhost:8080/webhooks/psp \
  -H "x-provider-signature: test" -H "content-type: application/json" \
  -d "{\"type\":\"pix.pago\",\"psp_ref\":\"abc-demo\",\"txid\":\"$TXID\",\"valor_centavos\":10000}" | jq .

# 4) Conferir carteiras/ordens
curl -s -H "Authorization: Bearer $TOKEN" -H "x-user-id: $USER" \
  http://localhost:8080/portfolio | jq .

# 5) Conferir reconciliação BRL (delta ~ 0)
psql "$DATABASE_URL" -c "select * from vw_wallet_brl_check where user_id = '$USER';"
