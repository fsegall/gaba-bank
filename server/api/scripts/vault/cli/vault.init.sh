#!/usr/bin/env bash
set -euo pipefail
: "${SOROBAN_RPC_URL:?missing}"
: "${STELLAR_NETWORK_PASSPHRASE:?missing}"
: "${VAULT_C:?missing}"
: "${USDC_C:?missing}"
: "${ADMIN_G:?missing}"
: "${REBAL_G:?missing}"

FEE_BPS="${FEE_BPS:-100}"

BASE_ARGS=(
  --id "$VAULT_C"
  --rpc-url "$SOROBAN_RPC_URL"
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE"
  -- init --asset "$USDC_C" --admin "$ADMIN_G" --rebalancer "$REBAL_G" --fee_bps "$FEE_BPS"
)

if [[ "${SIGN_WITH_LAB:-0}" == "1" ]]; then
  echo ">> init (mode: lab)"
  stellar contract invoke --source-account "$ADMIN_G" --sign-with-lab "${BASE_ARGS[@]}"
elif [[ -n "${ADMIN_S:-}" ]]; then
  echo ">> init (mode: seed-as-source)"
  stellar contract invoke --source-account "$ADMIN_S" "${BASE_ARGS[@]}"
else
  echo ">> init (mode: public+sign-with-key)"
  : "${ADMIN_S:?missing ADMIN_S (seed) ou export SIGN_WITH_LAB=1}"
  stellar contract invoke --source-account "$ADMIN_G" --sign-with-key "$ADMIN_S" "${BASE_ARGS[@]}"
fi
