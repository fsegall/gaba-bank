#!/usr/bin/env node
// tools/gen-treasury.js
/* Gera um par de chaves, salva a SECRET em ops/secrets/stellar_treasury_secret
   e (opcional) já funde a conta na testnet via Friendbot.
   Uso:
     node tools/gen-treasury.js           # gera G... e salva S... no arquivo
     node tools/gen-treasury.js --fund    # idem + chama Friendbot
     node tools/gen-treasury.js --force   # sobrescreve o arquivo se já existir
*/
const fs = require('fs');
const path = require('path');

function requireStellar() {
  try { return require('stellar-sdk'); }
  catch {
    try { return require(path.resolve(__dirname, '../api/node_modules/stellar-sdk')); }
    catch {
      console.error('❌ stellar-sdk não encontrado. Rode: (cd api && npm i stellar-sdk)');
      process.exit(1);
    }
  }
}

const { Keypair } = requireStellar();

const args = process.argv.slice(2);
const force = args.includes('--force');
const fund  = args.includes('--fund') || args.includes('-f');

const outFile = path.resolve(__dirname, '../ops/secrets/stellar_treasury_secret');
const network = (process.env.STELLAR_NETWORK || 'testnet').toLowerCase();
const friendbotURL = network === 'testnet' ? 'https://friendbot.stellar.org' : null;

// não sobrescreve sem --force
if (fs.existsSync(outFile) && !force) {
  console.error(`⚠️  Arquivo já existe: ${outFile}\nUse --force para sobrescrever (cuidado).`);
  process.exit(2);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });

const kp = Keypair.random();
fs.writeFileSync(outFile, kp.secret() + '\n', { mode: 0o600 });

console.log('PUBLIC:', kp.publicKey());
console.error('🔒 Secret salva em', outFile, '(NÃO comitar)');

if (friendbotURL && fund) {
  // Node >= 18 tem fetch global
  (async () => {
    try {
      const res = await fetch(`${friendbotURL}?addr=${kp.publicKey()}`);
      const j = await res.json();
      if (res.ok) {
        console.log('✅ Friendbot ok:', j.hash || '(hash não retornado)');
      } else {
        console.error('❌ Friendbot erro:', j);
        process.exit(3);
      }
    } catch (e) {
      console.error('❌ Falha ao chamar Friendbot:', e.message);
      process.exit(3);
    }
  })();
} else if (friendbotURL) {
  console.log(`👉 Para fundear na testnet:\n   curl -s "${friendbotURL}/?addr=${kp.publicKey()}" | jq .`);
}
