#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/contracts/defy-vault"

: "${SOROBAN_RPC_URL:?missing}"
: "${STELLAR_NETWORK_PASSPHRASE:?missing}"
: "${ADMIN_G:?missing}"

WASM="target/wasm32v1-none/release/defy_vault.wasm"
[ -f "$WASM" ] || { echo "❌ wasm não encontrado em $WASM"; exit 1; }

ARGS=( --wasm "$WASM"
       --rpc-url "$SOROBAN_RPC_URL"
       --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" )

if [[ "${SIGN_WITH_LAB:-0}" == "1" ]]; then
  echo ">> Deploy (mode: lab)"
  stellar contract deploy --source-account "$ADMIN_G" --sign-with-lab "${ARGS[@]}"
elif [[ -n "${ADMIN_S:-}" ]]; then
  echo ">> Deploy (mode: seed-as-source)"
  # seed S… usada diretamente como --source-account (assina local)
  stellar contract deploy --source-account "$ADMIN_S" "${ARGS[@]}"
else
  echo ">> Deploy (mode: public+sign-with-key)"
  : "${ADMIN_S:?missing ADMIN_S (seed) ou export SIGN_WITH_LAB=1}"
  stellar contract deploy --source-account "$ADMIN_G" --sign-with-key "$ADMIN_S" "${ARGS[@]}"
fi
