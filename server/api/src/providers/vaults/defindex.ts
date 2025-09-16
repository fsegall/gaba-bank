import {
    DefindexSDK,
    SupportedNetworks,
    type DepositToVaultParams,
    type WithdrawSharesParams,
    // type WithdrawFromVaultParams // se preferir sacar por amounts
  } from '@defindex/sdk';
  
  import { IVaultProvider, DepositArgs, WithdrawArgs, Position } from './types.js';
  
  // Use seu signer já existente para assinar XDR com a chave da tesouraria.
  // Ex.: src/lib/stellarSigner.ts exporta signXDR(xdr: string, network: 'testnet'|'mainnet'): Promise<string>
  import { signWithCLI } from '../../lib/stellarSigner.js';
  
  const apiKey = process.env.DEFINDEX_API_KEY!;
  const baseUrl = process.env.DEFINDEX_API_BASE || 'https://api.defindex.io';
  const vaultAddress = process.env.DEFINDEX_VAULT_ADDRESS!;
  const treasury = process.env.DEFINDEX_TREASURY_ACCOUNT!;
  const netEnv = (process.env.DEFINDEX_NETWORK || 'testnet').toLowerCase();
  const network =
    netEnv === 'mainnet' ? SupportedNetworks.MAINNET : SupportedNetworks.TESTNET;
  
  const assetIndex = Number(process.env.DEFINDEX_VAULT_ASSET_INDEX ?? '0');
  const slippageBps = Number(process.env.DEFINDEX_SLIPPAGE_BPS ?? '50');
  const autoInvest = String(process.env.DEFINDEX_AUTO_INVEST ?? 'true') === 'true';
  
  const sdk = new DefindexSDK({
    apiKey,
    baseUrl,   // opcional; o SDK já defaulta para produção
    timeout: 30_000,
  });
  
  function toNumSafe(bi: bigint): number {
    // amounts/ shares no SDK são `number` em vários pontos; converta com cuidado
    const asStr = bi.toString();
    const asNum = Number(asStr);
    if (!Number.isFinite(asNum)) {
      throw new Error(`overflow converting bigint ${asStr} to number`);
    }
    return asNum;
  }
  
  // Helpers de leitura com coerção para BigInt:
  async function readSharesAndUnderlying(addr: string) {
    const bal = await sdk.getVaultBalance(vaultAddress, addr, network);
    // Doc mostra dfTokens (shares) e underlyingBalance (array por ativo). :contentReference[oaicite:3]{index=3}
    const shares = BigInt(String(bal.dfTokens));
    const underlyingList = Array.isArray(bal.underlyingBalance)
      ? bal.underlyingBalance
      : [bal.underlyingBalance];
    const underlyingAtIndex = BigInt(String(underlyingList[assetIndex] ?? '0'));
    return { shares, underlyingAtIndex };
  }
  
  export class DefindexVaultProvider implements IVaultProvider {
    kind: 'defindex' = 'defindex';
  
    /**
     * Deposita USDC (base units 7dps) no vault do DeFindex.
     * Fluxo: getBalance(before) -> depositToVault() -> assina XDR -> sendTransaction() -> getBalance(after)
     * Retorna shares efetivamente mintadas (after - before).
     */
    async deposit(args: DepositArgs) {
      const { amountBaseUnits, idempotencyKey, userId, metadata } = args;
  
      // 1) leitura prévia p/ calcular delta de shares
      const before = await readSharesAndUnderlying(treasury);
  
      // 2) pedir XDR de depósito
      const depositData: DepositToVaultParams = {
        // DeFindex usa um array "amounts" — um por ativo do vault
        amounts: [toNumSafe(amountBaseUnits)],
        caller: treasury,       // doc usa caller/from para o endereço que assina/recebe. :contentReference[oaicite:4]{index=4}
        invest: autoInvest,
        slippageBps,
      };
  
      const { xdr } = await sdk.depositToVault(vaultAddress, depositData, network);
  
      // 3) assinar e enviar
      const signedXdr = await signWithCLI(xdr, netEnv as 'testnet' | 'mainnet');
      const sent = await sdk.sendTransaction(signedXdr, network, false);
      const externalId = String((sent as any).hash || (sent as any).transactionHash || (sent as any).id); // tx hash como external_id
  
      // 4) leitura pós-envio
      const after = await readSharesAndUnderlying(treasury);
      const mintedShares = after.shares - before.shares;
  
      // Dica: persista provider_events com {provider:'defindex', kind:'DEPOSIT', external_id:hash, payload:{userId, idempotencyKey, metadata}}
      return { externalId, shares: mintedShares < 0n ? 0n : mintedShares };
    }
  
    /**
     * Queima `shares` e resgata USDC para a tesouraria.
     * Fluxo: medir underlying antes/depois e retornar delta como redeemedBaseUnits.
     */
    async withdraw(args: WithdrawArgs) {
      const { shares, idempotencyKey, userId, metadata } = args;
  
      const before = await readSharesAndUnderlying(treasury);
  
      const ws: WithdrawSharesParams = {
        shares: toNumSafe(shares),
        caller: treasury,
        slippageBps,
      };
  
      const { xdr } = await sdk.withdrawShares(vaultAddress, ws, network);
      const signedXdr = await signWithCLI(xdr, netEnv as 'testnet' | 'mainnet');
      const sent = await sdk.sendTransaction(signedXdr, network, false);
      const externalId = String((sent as any).hash || (sent as any).transactionHash || (sent as any).id);
  
      const after = await readSharesAndUnderlying(treasury);
      const redeemed = before.underlyingAtIndex - after.underlyingAtIndex;
  
      return { externalId, redeemedBaseUnits: redeemed < 0n ? 0n : redeemed };
    }
  
    /**
     * Posição do usuário (no seu sub-razão). Para DeFindex, on-chain as shares ficam na tesouraria;
     * aqui mantemos a leitura de tesouraria como fallback (útil no cron de reconciliação).
     */
    async getPosition(userId: string): Promise<Position> {
      // você provavelmente guarda a posição do usuário em vault_positions;
      // esta leitura retorna a posição da TREASURY como referência.
      const b = await readSharesAndUnderlying(treasury);
      return {
        userId,
        vaultId: vaultAddress,
        shares: b.shares,                // shares totais na treasury
        principalBaseUnits: b.underlyingAtIndex, // USDC (assetIndex)
        updatedAt: new Date(),
      };
    }
  
    async getTreasuryPosition(): Promise<Position> {
      const b = await readSharesAndUnderlying(treasury);
      return {
        userId: 'treasury',
        vaultId: vaultAddress,
        shares: b.shares,
        principalBaseUnits: b.underlyingAtIndex,
        updatedAt: new Date(),
      };
    }
  }
  