#!/usr/bin/env bash
set -euo pipefail
: "${SOROBAN_RPC_URL:?}"
: "${STELLAR_NETWORK_PASSPHRASE:?}"
: "${SRC_G:?}"

CID="${1:-}"; ADDR="${2:-}"
[[ -n "$CID" && -n "$ADDR" ]] || { echo "uso: $0 <CONTRACT_ID> <ACCOUNT_G_ADDRESS>"; exit 1; }

stellar contract invoke \
  --id "$CID" \
  --source-account "$SRC_G" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
  -- balance --id "$ADDR"
