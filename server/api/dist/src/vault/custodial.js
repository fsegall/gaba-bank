// api/src/vault/custodial.ts
import { pool } from '../db.js';
import dotenv from 'dotenv';
import { rpc, Contract, nativeToScVal } from '@stellar/stellar-sdk';
dotenv.config();
const server = new rpc.Server(process.env.SOROBAN_RPC_URL, { allowHttp: true });
export async function getUSDCBalanceUnits(treasuryG, usdcC) {
    const c = new Contract(usdcC);
    // chama balance(id: Address)
    const res = await server.getContractData(usdcC, nativeToScVal('balance')); // contractId, ScVal
    // Para simplicidade no MVP, vamos via CLI wrapper por enquanto:
    // Ou expõe um endpoint /scripts/balance.sh e lê o retorno.
    // Aqui devolvemos zero e deixamos a leitura via CLI real no script abaixo.
    return 0n;
}
export async function getVault(vaultId) {
    const { rows } = await pool.query('select * from vaults where id=$1', [vaultId]);
    if (!rows[0])
        throw new Error('vault not found');
    return rows[0];
}
export async function getTotals(vaultId) {
    const { rows } = await pool.query(`select coalesce(sum(shares),0)::text as total_shares from vault_positions where vault_id=$1`, [vaultId]);
    return { totalShares: BigInt(rows[0].total_shares) };
}
export function pricePerShare(navUnits, totalShares, shareDecimals = 9) {
    // PPS = nav / totalShares; representado como fração (num/den)
    if (totalShares === 0n) {
        // define PPS inicial = 1.0 (em base 10^shareDecimals)
        const den = 10n ** BigInt(shareDecimals);
        return { num: den, den };
    }
    const den = 10n ** BigInt(shareDecimals);
    const num = (navUnits * den) / totalShares;
    return { num, den };
}
export async function deposit(vaultId, userId, amountUnits) {
    const v = await getVault(vaultId);
    const { totalShares } = await getTotals(vaultId);
    // NAV = saldo on-chain da tesouraria (USDC) + (futuros BRLD etc.)
    // Para o MVP: vamos receber o amountUnits como "já convertido/autobuy" e somá-lo ao NAV.
    const navUnits = await currentNavUnits(vaultId); // ver helper abaixo
    const { num: ppsNum, den: ppsDen } = pricePerShare(navUnits, totalShares);
    // aplica fee de entrada (opcional)
    const fee = (amountUnits * BigInt(v.fee_bps)) / 10000n;
    const net = amountUnits - fee;
    // shares = net / pps
    const sharesToMint = (net * ppsDen) / ppsNum;
    await pool.query('begin');
    try {
        // upsert posição
        await pool.query(`
      insert into vault_positions (vault_id, user_id, shares, cost_basis_units)
      values ($1,$2,$3,$4)
      on conflict (vault_id, user_id)
      do update set shares = vault_positions.shares + $3,
                    cost_basis_units = vault_positions.cost_basis_units + $4,
                    updated_at = now()
    `, [vaultId, userId, sharesToMint.toString(), net.toString()]);
        // registra flow
        await pool.query(`
      insert into vault_flows (vault_id, user_id, kind, amount_units, shares_delta, pps_numerator, pps_denominator)
      values ($1,$2,'deposit',$3,$4,$5,$6)
    `, [vaultId, userId, net.toString(), sharesToMint.toString(), ppsNum.toString(), ppsDen.toString()]);
        await pool.query('commit');
    }
    catch (e) {
        await pool.query('rollback');
        throw e;
    }
    return { sharesToMint: sharesToMint.toString(), feeUnits: fee.toString() };
}
// NAV do MVP = somatório dos depósitos líquidos (até conectar leitura on-chain/LP)
async function currentNavUnits(vaultId) {
    const { rows } = await pool.query(`
    select coalesce(sum(
      case when kind='deposit' then amount_units
           when kind='withdraw' then -amount_units
           when kind='fee' then amount_units
           else 0 end
    ),0)::text as nav_units
    from vault_flows where vault_id=$1
  `, [vaultId]);
    return BigInt(rows[0].nav_units);
}
