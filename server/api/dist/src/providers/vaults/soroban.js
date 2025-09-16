// src/providers/vaults/soroban.ts
import { Address, Contract, Keypair, Networks, TransactionBuilder, scValToNative, xdr, rpc, } from '@stellar/stellar-sdk';
import * as fs from 'node:fs';
const rpcUrl = process.env.SOROBAN_RPC_URL;
const passphrase = process.env.SOROBAN_NETWORK_PASSPHRASE;
const treasuryPub = process.env.SOROBAN_TREASURY_PUBLIC;
const treasurySecFile = process.env.SOROBAN_TREASURY_SECRET_FILE;
const vaultId = process.env.SOROBAN_VAULT_CONTRACT_ID; // C...
const usdcId = process.env.SOROBAN_USDC_CONTRACT_ID; // token contrato (se necessário)
const timeoutSec = Number(process.env.SOROBAN_TIMEOUT_SECONDS ?? '60');
const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
const networkPassphrase = passphrase.includes('Public') ? Networks.PUBLIC : passphrase;
function loadTreasury() {
    const secret = fs.readFileSync(treasurySecFile, 'utf8').trim();
    return Keypair.fromSecret(secret);
}
async function loadAccount(publicKey) {
    return server.getAccount(publicKey);
}
async function prepareAndSend(tx) {
    // Soroban precisa de prepareTransaction (simulação) para footprint
    const prepared = await server.prepareTransaction(tx);
    const kp = loadTreasury();
    prepared.sign(kp);
    const sendResp = await server.sendTransaction(prepared);
    if (sendResp.status === 'ERROR')
        throw new Error(`Soroban send error: ${sendResp.errorResult}`);
    // opcional: aguardar confirmação
    let hash = sendResp.hash;
    for (;;) {
        const r = await server.getTransaction(hash);
        if (r.status === 'SUCCESS')
            return { hash };
        if (r.status === 'FAILED')
            throw new Error(`tx failed: ${hash}`);
        await new Promise(r => setTimeout(r, 800));
    }
}
async function callReadonly(contract, method, ...args) {
    const source = await loadAccount(treasuryPub);
    const tx = new TransactionBuilder(source, { fee: '100000', networkPassphrase })
        .addOperation(contract.call(method, ...args))
        .setTimeout(timeoutSec)
        .build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        // retorno único
        const val = sim.result.retval;
        return scValToNative(val);
    }
    throw new Error(`simulate failed for ${method}: ${JSON.stringify(sim, null, 2)}`);
}
async function invokeContract(method, ...args) {
    const source = await loadAccount(treasuryPub);
    const contract = new Contract(vaultId);
    const tx = new TransactionBuilder(source, { fee: '200000', networkPassphrase })
        .addOperation(contract.call(method, ...args))
        .setTimeout(timeoutSec)
        .build();
    const kp = loadTreasury();
    tx.sign(kp);
    return prepareAndSend(tx);
}
export class SorobanVaultProvider {
    kind = 'soroban';
    async deposit(args) {
        const { amountBaseUnits, idempotencyKey, userId, metadata } = args;
        // 1) shares antes
        const beforeShares = await this.readSharesOf(treasuryPub);
        // 2) (opcional) "approve" do token, se o contrato deposit espera pull de USDC:
        // Se o seu vault faz internal pull via token standard, descomente e ajuste:
        // await this.approve(usdcId, treasuryPub, vaultId, amountBaseUnits);
        // 3) chama método deposit do seu contrato
        // Assumindo assinatura: deposit(caller: Address, amount: i128, memo?: bytes)
        // TODO: ajuste nomes/assinaturas conforme o seu contrato
        const contract = new Contract(vaultId);
        const caller = Address.fromString(treasuryPub).toScVal();
        const amount = xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString('0'), lo: xdr.Uint64.fromString(amountBaseUnits.toString()) }));
        const memo = xdr.ScVal.scvBytes(Buffer.from(idempotencyKey.slice(0, 28))); // memos são limitados; idempotência básica
        const { hash } = await invokeContract('deposit', caller, amount, memo);
        // 4) shares depois
        const afterShares = await this.readSharesOf(treasuryPub);
        const minted = afterShares - beforeShares;
        return { externalId: hash, shares: minted < 0n ? 0n : minted };
    }
    async withdraw(args) {
        const { shares, idempotencyKey, userId, metadata } = args;
        // medir underlying antes (USDC)
        const before = await this.readUnderlyingOf(treasuryPub);
        // Assumindo: withdraw_shares(caller: Address, shares: i128, memo?: bytes)
        const caller = Address.fromString(treasuryPub).toScVal();
        const s = xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString('0'), lo: xdr.Uint64.fromString(shares.toString()) }));
        const memo = xdr.ScVal.scvBytes(Buffer.from(idempotencyKey.slice(0, 28)));
        const { hash } = await invokeContract('withdraw_shares', caller, s, memo);
        const after = await this.readUnderlyingOf(treasuryPub);
        const redeemed = before > after ? (before - after) : 0n;
        return { externalId: hash, redeemedBaseUnits: redeemed };
    }
    async getPosition(userId) {
        // Em um design “pooled” a posição real do usuário fica no seu banco (subledger).
        // Aqui retornamos a posição da tesouraria (referência) — o cron reconcilia o sub-razão.
        const shares = await this.readSharesOf(treasuryPub);
        const underlying = await this.readUnderlyingOf(treasuryPub);
        return {
            userId,
            vaultId,
            shares,
            principalBaseUnits: underlying,
            updatedAt: new Date(),
        };
    }
    async getTreasuryPosition() {
        const shares = await this.readSharesOf(treasuryPub);
        const underlying = await this.readUnderlyingOf(treasuryPub);
        return {
            userId: 'treasury',
            vaultId,
            shares,
            principalBaseUnits: underlying,
            updatedAt: new Date(),
        };
    }
    // ============ Helpers dependentes da ABI do seu contrato ============
    // Lê shares do endereço (view)
    async readSharesOf(addr) {
        const c = new Contract(vaultId);
        // Assumindo: shares_of(addr: Address) -> i128
        const out = await callReadonly(c, 'shares_of', Address.fromString(addr).toScVal());
        return BigInt(out);
    }
    // Lê saldo subjacente (USDC) do endereço (view)
    async readUnderlyingOf(addr) {
        const c = new Contract(vaultId);
        // Assumindo: underlying_of(addr: Address) -> i128 (base units do USDC)
        const out = await callReadonly(c, 'underlying_of', Address.fromString(addr).toScVal());
        return BigInt(out);
    }
    // (Opcional) Aprovação de token padrão p/ o vault “pullar” fundos
    async approve(tokenContractId, fromG, spenderC, amount) {
        const token = new Contract(tokenContractId);
        // Padrão token Soroban: approve(from: Address, spender: Address, amount: i128, exp: u32)
        // TODO: ajuste p/ ABI do token que você usa (se difere do padrão)
        const from = Address.fromString(fromG).toScVal();
        const spender = Address.fromString(spenderC).toScVal();
        const amt = xdr.ScVal.scvI128(new xdr.Int128Parts({ hi: xdr.Int64.fromString('0'), lo: xdr.Uint64.fromString(amount.toString()) }));
        const exp = xdr.ScVal.scvU32(~~(Date.now() / 1000) + 3600);
        const { hash } = await invokeContract.call(null, 'approve', from, spender, amt, exp); // reuse helper
        return hash;
    }
}
