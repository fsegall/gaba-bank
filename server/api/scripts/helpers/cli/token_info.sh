#!/usr/bin/env bash
set -euo pipefail
: "${SOROBAN_RPC_URL:?set SOROBAN_RPC_URL}"
: "${STELLAR_NETWORK_PASSPHRASE:?set STELLAR_NETWORK_PASSPHRASE}"
: "${SRC_G:?set SRC_G to a G... source account}"

CID="${1:-}"; [[ -n "$CID" ]] || { echo "uso: $0 <CONTRACT_ID>"; exit 1; }

for fn in symbol decimals; do
  echo ">> $fn:"
  stellar contract invoke \
    --id "$CID" \
    --source-account "$SRC_G" \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
    -- "$fn"
done
