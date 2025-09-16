#!/usr/bin/env bash
set -euo pipefail

# Requisitos comuns
: "${SOROBAN_RPC_URL:?missing SOROBAN_RPC_URL}"
: "${STELLAR_NETWORK_PASSPHRASE:?missing STELLAR_NETWORK_PASSPHRASE}"
: "${VAULT_C:?missing VAULT_C (Contract ID do Vault)}"
: "${USDC_C:?missing USDC_C (Contract ID do token base)}"

# Quem assina as mutações (depósito/saque) = o "usuário" do Vault
# Modo 1 (Laboratory): export SIGN_WITH_LAB=1 e USER_G=G...
# Modo 2 (seed como source): export USER_S=S...
# Modo 3 (pública + sign-with-key): export USE_PUBLIC=1, USER_G=G..., USER_S=S...
: "${USER_G:=}"    # opcional em alguns modos
: "${USER_S:=}"    # opcional em alguns modos
: "${USE_PUBLIC:=}" # se "1", tenta usar G... + --sign-with-key

# Para onde creditar/retirar (default = USER_G)
TO_G="${TO_G:-${USER_G:-}}"

# Ação: deposit | withdraw | both (default: deposit)
ACTION="${ACTION:-deposit}"

# Valores:
# - Para depósito use AMOUNT_UNITS (inteiro em "unidades" do token)
#   Ex.: se decimals=7, 1.0 USDC => AMOUNT_UNITS=10000000
# - Para saque use SHARES_UNITS (inteiro de shares)
AMOUNT_UNITS="${AMOUNT_UNITS:-}"
SHARES_UNITS="${SHARES_UNITS:-}"

# Util: imprime decimals do token base
function show_decimals() {
  echo ">> USDC.decimals"
  stellar contract invoke \
    --id "$USDC_C" \
    --source-account "${USER_S:-${USER_G:-}}" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
    -- decimals || true
}

# Assinatura dinâmica
function sign_args() {
  local who="${1:?missing who for sign_args}" # "user" por enquanto (poderíamos expandir no futuro)
  # Prioridade:
  # 1) Lab
  if [[ "${SIGN_WITH_LAB:-0}" == "1" ]]; then
    [[ -n "${USER_G:-}" ]] || { echo "❌ Precisa USER_G (G...) para SIGN_WITH_LAB=1"; exit 1; }
    printf -- "--source-account %s --sign-with-lab" "$USER_G"
    return
  fi
  # 2) Pública + sign-with-key (quando USE_PUBLIC=1)
  if [[ "${USE_PUBLIC:-0}" == "1" ]]; then
    [[ -n "${USER_G:-}" && -n "${USER_S:-}" ]] || { echo "❌ Precisa USER_G (G...) e USER_S (S...) para USE_PUBLIC=1"; exit 1; }
    printf -- "--source-account %s --sign-with-key %s" "$USER_G" "$USER_S"
    return
  fi
  # 3) Seed como source (mais simples)
  if [[ -n "${USER_S:-}" ]]; then
    printf -- "--source-account %s" "$USER_S"
    return
  fi

  echo "❌ Nenhum modo de assinatura válido detectado.
  Opções:
    - SIGN_WITH_LAB=1 e USER_G=G...
    - OU USER_S=S... (seed como source)
    - OU USE_PUBLIC=1 + USER_G=G... + USER_S=S..."
  exit 1
}

function invoke_vault() {
  local method="$1"; shift
  local base_args=( --id "$VAULT_C"
                    --rpc-url "$SOROBAN_RPC_URL"
                    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
                    -- "$method" "$@" )

  # shellcheck disable=SC2046
  stellar contract invoke $(sign_args user) "${base_args[@]}"
}

# Sanidade básica
[[ -n "$TO_G" ]] || { echo "❌ TO_G está vazio (defina TO_G=G... ou ao menos USER_G=G...)"; exit 1; }

echo "== Vault TX =="
echo "• VAULT_C = $VAULT_C"
echo "• USDC_C  = $USDC_C"
echo "• MODE    = $(
  if [[ "${SIGN_WITH_LAB:-0}" == "1" ]]; then echo "lab"; \
  elif [[ "${USE_PUBLIC:-0}" == "1" ]]; then echo "public+sign-with-key"; \
  elif [[ -n "${USER_S:-}" ]]; then echo "seed-as-source"; \
  else echo "unknown"; fi
)"
echo "• ACTION  = $ACTION"
echo

show_decimals
echo

case "$ACTION" in
  deposit)
    [[ -n "$AMOUNT_UNITS" ]] || { echo "❌ Defina AMOUNT_UNITS p/ depósito"; exit 1; }
    echo ">> deposit amount=$AMOUNT_UNITS from=$USER_G to=$TO_G"
    invoke_vault deposit --from "$USER_G" --to "$TO_G" --amount "$AMOUNT_UNITS"
    ;;

  withdraw)
    [[ -n "$SHARES_UNITS" ]] || { echo "❌ Defina SHARES_UNITS p/ saque"; exit 1; }
    echo ">> withdraw shares=$SHARES_UNITS owner=$USER_G to=$TO_G"
    invoke_vault withdraw --owner "$USER_G" --to "$TO_G" --shares "$SHARES_UNITS"
    ;;

  both)
    [[ -n "$AMOUNT_UNITS" ]] || { echo "❌ Defina AMOUNT_UNITS p/ depósito"; exit 1; }
    echo ">> deposit amount=$AMOUNT_UNITS from=$USER_G to=$TO_G"
    invoke_vault deposit --from "$USER_G" --to "$TO_G" --amount "$AMOUNT_UNITS"
    echo
    echo ">> views pós-depósito"
    "$(git rev-parse --show-toplevel)"/api/scripts/vault/vault.views.sh || true
    echo
    # Se não informar SHARES_UNITS, usa AMOUNT_UNITS como aproximação no 1º depósito
    local shares="${SHARES_UNITS:-$AMOUNT_UNITS}"
    echo ">> withdraw shares=$shares owner=$USER_G to=$TO_G"
    invoke_vault withdraw --owner "$USER_G" --to "$TO_G" --shares "$shares"
    ;;

  *)
    echo "❌ ACTION inválida. Use: deposit | withdraw | both"
    exit 1
    ;;
esac

echo
echo ">> views finais"
"$(git rev-parse --show-toplevel)"/api/scripts/vault/vault.views.sh || true
