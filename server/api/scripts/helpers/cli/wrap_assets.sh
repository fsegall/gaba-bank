#!/usr/bin/env bash
set -euo pipefail

# ===== Config padrão (edite se precisar) =====
: "${SOROBAN_RPC_URL:=https://soroban-testnet.stellar.org}"
: "${STELLAR_NETWORK_PASSPHRASE:=Test SDF Network ; September 2015}"

# Issuer padrão (o do seu exemplo)
: "${ISSUER_PUB:=GCXWBWKZC22G3DR6IJVYFHMNET4KC2MPXZAGHG2HOQZGJAGLYLW356UV}"

# Ativos padrão
ASSETS=("BRLD" "USDC")

# Assinatura:
#   - Para Laboratory: export SIGN_WITH_LAB=1
#   - Para seed local: export ISSUER_SECRET="SXXXXXXXXXXXXXXXXXXXXXXXX"
SIGN_WITH_LAB="${SIGN_WITH_LAB:-0}"
ENV_OUT="${ENV_OUT:-.env}"

# ===== Descobrir CLI disponível =====
CLI=""
if command -v stellar >/dev/null 2>&1; then
  if stellar contract --help >/dev/null 2>&1; then
    CLI="stellar"
  fi
fi

if [[ -z "$CLI" ]] && command -v soroban >/dev/null 2>&1; then
  if soroban lab token --help >/dev/null 2>&1; then
    CLI="soroban"
  fi
fi

if [[ -z "$CLI" ]]; then
  echo "Nenhum CLI compatível encontrado. Instale 'stellar-cli' (recomendado) ou 'soroban-cli'." >&2
  exit 1
fi

echo ">> Usando CLI: $CLI"
echo ">> Rede: $SOROBAN_RPC_URL"
echo ">> Passphrase: $STELLAR_NETWORK_PASSPHRASE"
echo ">> Issuer: $ISSUER_PUB"
echo ">> ENV de saída: $ENV_OUT"
echo

mkdir -p "$(dirname "$ENV_OUT")"
touch "$ENV_OUT"

# Helpers
extract_contract_id() {
  # tenta detectar um C... na saída
  grep -Eo 'C[A-Z0-9]+' | head -n1 || true
}

deploy_with_stellar() {
  local code="$1"
  local asset="$code:$ISSUER_PUB"
  echo "==> [$code] Calculando ID determinístico..."
  ID_OUT="$(stellar contract asset id \
    --asset "$asset" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
  CONTRACT_ID="$(printf "%s\n" "$ID_OUT" | extract_contract_id)"
  [[ -n "$CONTRACT_ID" ]] || { echo "Falha ao obter ID para $asset"; exit 1; }
  echo "    ID: $CONTRACT_ID"

  echo "==> [$code] Fazendo deploy (wrap SAC)..."
  if [[ "$SIGN_WITH_LAB" == "1" ]]; then
    DEPLOY_OUT="$(stellar contract asset deploy \
      --asset "$asset" \
      --source-account "$ISSUER_PUB" \
      --sign-with-lab \
      --rpc-url "$SOROBAN_RPC_URL" \
      --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
  else
    : "${ISSUER_SECRET:?Defina ISSUER_SECRET ou use SIGN_WITH_LAB=1}"
    DEPLOY_OUT="$(stellar contract asset deploy \
      --asset "$asset" \
      --source-account "$ISSUER_SECRET" \
      --rpc-url "$SOROBAN_RPC_URL" \
      --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
  fi

  # se já existia, o deploy pode retornar erro benigno; garantimos o ID via id()
  printf "%s\n" "$DEPLOY_OUT" >/dev/null

  # grava no .env (duas chaves úteis)
  UCODE_UPPER="$(echo "$code" | tr '[:lower:]' '[:upper:]')"
  if [[ "$UCODE_UPPER" == "BRLD" ]]; then
    KEY1="SOROBAN_ASSET_BRL_CONTRACT_ID"
  else
    KEY1="SOROBAN_ASSET_${UCODE_UPPER}_CONTRACT_ID"
  fi
  KEY2="ASSET_${UCODE_UPPER}_CONTRACT_ID"

  # remove linhas antigas e append
  sed -i.bak "/^${KEY1}=.*/d;/^${KEY2}=.*/d" "$ENV_OUT" || true
  {
    echo "${KEY1}=${CONTRACT_ID}"
    echo "${KEY2}=${CONTRACT_ID}"
  } >> "$ENV_OUT"

  echo "    Gravado em $ENV_OUT: ${KEY1}=${CONTRACT_ID}"
}

deploy_with_soroban() {
  local code="$1"
  local asset="$code:$ISSUER_PUB"
  echo "==> [$code] Fazendo wrap via soroban CLI..."
  if [[ "$SIGN_WITH_LAB" == "1" ]]; then
    WRAP_OUT="$(soroban lab token wrap \
      --asset "$asset" \
      --sign-with-lab \
      --rpc-url "$SOROBAN_RPC_URL" \
      --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
  else
    : "${ISSUER_SECRET:?Defina ISSUER_SECRET ou use SIGN_WITH_LAB=1}"
    WRAP_OUT="$(soroban lab token wrap \
      --asset "$asset" \
      --secret-key "$ISSUER_SECRET" \
      --rpc-url "$SOROBAN_RPC_URL" \
      --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
  fi

  CONTRACT_ID="$(printf "%s\n" "$WRAP_OUT" | extract_contract_id)"
  if [[ -z "$CONTRACT_ID" ]]; then
    # fallback: tentar consultar ID se o CLI tiver 'id'
    if soroban lab token id --help >/dev/null 2>&1; then
      ID_OUT="$(soroban lab token id \
        --asset "$asset" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1 || true)"
      CONTRACT_ID="$(printf "%s\n" "$ID_OUT" | extract_contract_id)"
    fi
  fi

  [[ -n "$CONTRACT_ID" ]] || { echo "Não consegui extrair o Contract ID de $code"; exit 1; }

  UCODE_UPPER="$(echo "$code" | tr '[:lower:]' '[:upper:]')"
  if [[ "$UCODE_UPPER" == "BRLD" ]]; then
    KEY1="SOROBAN_ASSET_BRL_CONTRACT_ID"
  else
    KEY1="SOROBAN_ASSET_${UCODE_UPPER}_CONTRACT_ID"
  fi
  KEY2="ASSET_${UCODE_UPPER}_CONTRACT_ID"
  sed -i.bak "/^${KEY1}=.*/d;/^${KEY2}=.*/d" "$ENV_OUT" || true
  {
    echo "${KEY1}=${CONTRACT_ID}"
    echo "${KEY2}=${CONTRACT_ID}"
  } >> "$ENV_OUT"

  echo "    Gravado em $ENV_OUT: ${KEY1}=${CONTRACT_ID}"
}

# ===== Loop dos ativos =====
for code in "${ASSETS[@]}"; do
  if [[ "$CLI" == "stellar" ]]; then
    deploy_with_stellar "$code"
  else
    deploy_with_soroban "$code"
  fi
done

echo
echo "✅ Concluído. Verifique os IDs no arquivo $ENV_OUT."
