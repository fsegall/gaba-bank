#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)/contracts/defy-vault"

stellar contract build

WASM="$(ls -1 target/wasm32v1-none/release/*.wasm 2>/dev/null || true)"
if [ -z "${WASM}" ]; then
  WASM="$(ls -1 target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || true)"
fi
if [ -z "${WASM}" ]; then
  echo "❌ Não encontrei o .wasm em target/{wasm32v1-none,wasm32-unknown-unknown}/release"
  exit 1
fi

echo "✅ WASM: ${WASM}"
ls -lh "${WASM}"
