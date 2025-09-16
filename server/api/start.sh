#!/bin/bash

# Script para iniciar a aplicação com todas as variáveis de ambiente necessárias

echo "🚀 Iniciando aplicação Defy Invest..."

# Carrega variáveis do .env.local
if [ -f .env.local ]; then
    echo "📁 Carregando variáveis do .env.local..."
    set -a
    source .env.local
    set +a
fi

# Define variáveis específicas que podem estar faltando
export HORIZON_URL="${HORIZON_URL:-https://horizon-testnet.stellar.org}"
export SOROSWAP_API_KEY_FILE="${SOROSWAP_API_KEY_FILE:-../ops/secrets/soroswap_api_key}"
export SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
export REFLECTOR_CONTRACT_ID="${REFLECTOR_CONTRACT_ID:-CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC}"
export SOROBAN_NETWORK_PASSPHRASE="${SOROBAN_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
export SOROBAN_VIEW_SOURCE="${SOROBAN_VIEW_SOURCE:-GB3JDWCQ6M3S6Q6N4QH7Z7U53Y6Q5YGXK4V6F2T3N7I32D5WJ7KQ4XYZ}"

echo "✅ Variáveis de ambiente configuradas:"
echo "   HORIZON_URL: $HORIZON_URL"
echo "   SOROSWAP_API_KEY_FILE: $SOROSWAP_API_KEY_FILE"
echo "   SOROBAN_RPC_URL: $SOROBAN_RPC_URL"
echo "   REFLECTOR_CONTRACT_ID: $REFLECTOR_CONTRACT_ID"

# Verifica se o arquivo de API key existe
if [ ! -f "$SOROSWAP_API_KEY_FILE" ]; then
    echo "❌ Arquivo de API key não encontrado: $SOROSWAP_API_KEY_FILE"
    exit 1
fi

echo "🔑 API key encontrada: $(head -c 10 "$SOROSWAP_API_KEY_FILE")..."

# Inicia a aplicação
echo "🌐 Iniciando servidor na porta 8080..."
npm start

