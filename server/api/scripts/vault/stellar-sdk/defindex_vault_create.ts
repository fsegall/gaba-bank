// scripts/defindex_vault_create.ts
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.docker' });
import {
  DefindexSDK,
  SupportedNetworks,
  type CreateDefindexVault,
  type DepositToVaultParams,
} from '@defindex/sdk';
import { TransactionBuilder, Networks, Keypair } from '@stellar/stellar-sdk';
import * as fs from 'node:fs';

const sdk = new DefindexSDK({ apiKey: process.env.DEFINDEX_API_KEY! });

const NET =
  (process.env.DEFINDEX_NETWORK || 'testnet').toLowerCase() === 'mainnet'
    ? SupportedNetworks.MAINNET
    : SupportedNetworks.TESTNET;

function netPassphrase() {
  return NET === SupportedNetworks.TESTNET
    ? Networks.TESTNET
    : Networks.PUBLIC;
}

async function signAndSend(xdr: string, secret: string) {
  const tx = TransactionBuilder.fromXDR(xdr, netPassphrase());
  const kp = Keypair.fromSecret(secret);
  tx.sign(kp);
  const res = await sdk.sendTransaction(tx.toXDR(), NET, false);
  return res; // { hash, status }
}

async function main() {
  console.log('🚀 Starting Defindex vault creation script...');
  console.log('📊 Network:', NET === SupportedNetworks.MAINNET ? 'MAINNET' : 'TESTNET');
  console.log('🔗 RPC URL:', process.env.SOROBAN_RPC_URL || 'default');
  
  // 0) health & factory
  console.log('🔍 Checking Defindex API health...');
  const health = await sdk.healthCheck();
  if (!health?.status?.reachable) throw new Error('Defindex API unreachable');
  console.log('✅ API health check passed');
  
  console.log('🏭 Getting factory address...');
  const factory = await sdk.getFactoryAddress(NET);
  console.log('[ok] factory:', factory.address);

  // 1) create vault (build XDR)
  console.log('⚙️  Building vault configuration...');
  
  // Lê o secret do arquivo ou da variável
  let callerSecret: string;
  if (process.env.DEFINDEX_CALLER_SECRET_FILE) {
    callerSecret = fs.readFileSync(process.env.DEFINDEX_CALLER_SECRET_FILE, 'utf8').trim();
    console.log('📁 Read secret from file:', process.env.DEFINDEX_CALLER_SECRET_FILE);
  } else {
    callerSecret = process.env.DEFINDEX_CALLER_SECRET!;
    console.log('🔑 Using secret from environment variable');
  }
  
  const callerKp = Keypair.fromSecret(callerSecret);
  console.log('👤 Caller address:', callerKp.publicKey());
  
  const cfg: CreateDefindexVault = {
    roles: {
      0: process.env.DEFINDEX_EMERGENCY_MANAGER!, // Emergency
      1: process.env.DEFINDEX_FEE_RECEIVER!,      // Fee Receiver
      2: process.env.DEFINDEX_VAULT_MANAGER!,     // Manager
      3: process.env.DEFINDEX_REBALANCE_MANAGER!, // Rebalance
    },
    vault_fee_bps: 100, // 1%
    assets: [{
      address: process.env.DEFINDEX_ASSET_CONTRACT!,
      strategies: [{
        address: process.env.DEFINDEX_STRATEGY_ADDRESS!,
        name: 'Primary Strategy',
        paused: false,
      }],
    }],
    name_symbol: {
      name: process.env.DEFINDEX_VAULT_NAME || 'Defy Vault',
      symbol: process.env.DEFINDEX_VAULT_SYMBOL || 'DFV',
    },
    upgradable: true,
    caller: callerKp.publicKey(),
  };
  
  console.log('📋 Vault config:');
  console.log('  - Name:', cfg.name_symbol.name);
  console.log('  - Symbol:', cfg.name_symbol.symbol);
  console.log('  - Fee BPS:', cfg.vault_fee_bps);
  console.log('  - Asset Contract:', cfg.assets[0].address);
  console.log('  - Strategy:', cfg.assets[0].strategies[0].address);
  console.log('  - Roles:', Object.keys(cfg.roles).length, 'roles configured');

  console.log('🏗️  Creating vault transaction...');
  
  // Retry logic para rate limit
  let create;
  let retries = 0;
  const maxRetries = 5;
  
  while (retries < maxRetries) {
    try {
      create = await sdk.createVault(cfg, NET);
      break;
    } catch (error: any) {
      if (error.message?.includes('Rate limit') || error.message?.includes('rate limit')) {
        retries++;
        const delay = Math.min(1000 * Math.pow(2, retries), 30000); // Exponential backoff, max 30s
        console.log(`⏳ Rate limit hit, waiting ${delay/1000}s before retry ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  
  if (!create || !create.xdr) throw new Error('createVault returned null XDR after retries');
  console.log('✅ Vault XDR generated successfully');
  console.log('[build] createVault.xdr:', create.xdr.slice(0, 72) + '...');

  // 2) assina e envia (caller = manager no exemplo)
  console.log('✍️  Signing and sending vault creation transaction...');
  const sent = await signAndSend(create.xdr, callerSecret);
  const txHash = (sent as any).hash || (sent as any).transactionHash || (sent as any).id;
  console.log('✅ Vault creation transaction sent!');
  console.log('[sent] create tx:', txHash, 'status:', sent.status);

  // ⚠️ Pegue o endereço do vault recém-criado.
  // Dica: o tx result/receipts da factory contém o ContractID do vault.
  // Se preferir, use o dApp/GUI "Using GUI (Basic)" para conferir o address.
  const vaultAddress = process.env.DEFINDEX_VAULT_ADDRESS || process.env.CVAULT!; // provisório, sobrescreva com o address real
  console.log('🏦 Vault address (from env):', vaultAddress);
  console.log('⚠️  IMPORTANT: Update DEFINDEX_VAULT_ADDRESS with the actual vault address from the transaction result!');

  // 3) first rebalance (obrigatório 1x) — via API REST (retorna XDR p/ assinar)
  // Vide docs: /vault/{VAULT}/rebalance (Authorization: Bearer <API key>)
  // Para simplificar, pule aqui e faça via cURL uma vez (ver seção abaixo das instruções).
  console.log('⏭️  Skipping rebalance step (manual via API)');

  // 4) primeiro depósito (1001 unidades mínimas ficam travadas)
  if (process.env.DEFINDEX_TREASURY_SECRET) {
    console.log('💰 Preparing initial deposit...');
    const amounts: number[] = [ 2000000 ]; // ex.: 2.0000000 unidades (7 dps)
    console.log('💵 Deposit amount:', amounts[0], 'units (7 decimals)');
    
    const deposit: DepositToVaultParams = {
      amounts,
      caller: process.env.DEFINDEX_TREASURY_G!,
      invest: true,          // auto-invest após depósito
      slippageBps: 100,      // 1%
    };
    console.log('📝 Deposit params:', {
      caller: deposit.caller,
      invest: deposit.invest,
      slippageBps: deposit.slippageBps
    });
    
    console.log('🏗️  Building deposit transaction...');
    const dep = await sdk.depositToVault(vaultAddress, deposit, NET);
    if (!dep.xdr) throw new Error('depositToVault returned null XDR');
    console.log('✅ Deposit XDR generated successfully');
    console.log('[build] deposit.xdr:', dep.xdr.slice(0, 72) + '...');
    
    console.log('✍️  Signing and sending deposit transaction...');
    const depRes = await signAndSend(dep.xdr, process.env.DEFINDEX_TREASURY_SECRET!);
    const depTxHash = (depRes as any).hash || (depRes as any).transactionHash || (depRes as any).id;
    console.log('✅ Deposit transaction sent!');
    console.log('[sent] deposit tx:', depTxHash, 'status:', depRes.status);

    // 5) ler saldo/shares
    console.log('📊 Reading vault balance...');
    const bal = await sdk.getVaultBalance(vaultAddress, process.env.DEFINDEX_TREASURY_G!, NET);
    console.log('💰 Vault balance:');
    console.log('  - Shares (dfTokens):', bal.dfTokens);
    console.log('  - Underlying balance:', bal.underlyingBalance);
  } else {
    console.log('ℹ️ Defina DEFINDEX_TREASURY_SECRET para automatizar o depósito neste smoke.');
  }
  
  console.log('🎉 Script completed successfully!');
  console.log('📋 Next steps:');
  console.log('  1. Update DEFINDEX_VAULT_ADDRESS with the actual vault address');
  console.log('  2. Run rebalance via API: POST /vault/{VAULT}/rebalance');
  console.log('  3. Test deposit/withdraw operations');
}

main().catch((e) => {
  console.error('❌ Script failed:', e.message);
  console.error('Stack trace:', e.stack);
  process.exit(1);
});
