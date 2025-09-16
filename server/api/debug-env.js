// Script para debug das variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente...\n');

// Lista de variáveis necessárias baseada nos erros
const requiredVars = [
  'HORIZON_URL',
  'SOROSWAP_API_KEY_FILE', 
  'SOROSWAP_API_KEY',
  'SOROBAN_RPC_URL',
  'REFLECTOR_CONTRACT_ID',
  'SOROBAN_NETWORK_PASSPHRASE',
  'SOROBAN_VIEW_SOURCE',
  'STELLAR_RPC_URL',
  'STELLAR_NETWORK',
  'STELLAR_SIGNER_ALIAS'
];

console.log('📋 Status das variáveis necessárias:');
console.log('=' .repeat(50));

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mostra apenas os primeiros 20 caracteres para segurança
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: UNDEFINED`);
    missingVars.push(varName);
  }
});

console.log('\n' + '=' .repeat(50));

if (missingVars.length > 0) {
  console.log(`❌ Variáveis faltando (${missingVars.length}):`);
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
} else {
  console.log('✅ Todas as variáveis necessárias estão definidas!');
}

// Verifica arquivos de API key
console.log('\n🔑 Verificando arquivos de API key:');
import fs from 'node:fs';

const apiKeyFiles = [
  '../ops/secrets/soroswap_api_key',
  './ops/secrets/soroswap_api_key',
  'ops/secrets/soroswap_api_key'
];

apiKeyFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      console.log(`✅ ${filePath}: ${content.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${filePath}: Arquivo não encontrado`);
    }
  } catch (error) {
    console.log(`❌ ${filePath}: Erro ao ler - ${error.message}`);
  }
});

console.log('\n🎯 Próximos passos:');
if (missingVars.length > 0) {
  console.log('1. Defina as variáveis faltando no .env.local ou .env.docker');
  console.log('2. Ou exporte-as diretamente no terminal');
  console.log('3. Execute: source .env.local && npm start');
} else {
  console.log('1. Execute: npm start');
}
