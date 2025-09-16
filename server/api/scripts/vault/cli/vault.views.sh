#!/usr/bin/env bash
set -euo pipefail
: "${SOROBAN_RPC_URL:?missing}"
: "${STELLAR_NETWORK_PASSPHRASE:?missing}"
: "${VAULT_C:?missing}"
: "${ADMIN_G:?missing}"

echo "base_asset:"
stellar contract invoke --id "$VAULT_C" --source-account "$ADMIN_G" \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- base_asset

echo "fee_bps:"
stellar contract invoke --id "$VAULT_C" --source-account "$ADMIN_G" \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- fee_bps

echo "total_assets:"
stellar contract invoke --id "$VAULT_C" --source-account "$ADMIN_G" \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- total_assets

echo "total_shares:"
stellar contract invoke --id "$VAULT_C" --source-account "$ADMIN_G" \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- total_shares

echo "price_per_share_scaled:"
stellar contract invoke --id "$VAULT_C" --source-account "$ADMIN_G" \
  --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" -- price_per_share_scaled
