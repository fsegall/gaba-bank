/* eslint-disable no-console */
import "dotenv/config";
import { Keypair, rpc } from "@stellar/stellar-sdk";
import { buildInvokeTx, scvAddress, scvI128, sendAndWait } from "../../helpers/soroban.js";
const { SOROBAN_RPC_URL, STELLAR_NETWORK_PASSPHRASE, VAULT_C, REBAL_G, REBAL_S, } = process.env;
function req(name) {
    if (!process.env[name])
        throw new Error(`Missing env: ${name}`);
}
["SOROBAN_RPC_URL", "STELLAR_NETWORK_PASSPHRASE", "VAULT_C", "REBAL_G", "REBAL_S"].forEach(req);
function parseArgs() {
    const i = process.argv.indexOf("--units");
    if (i === -1 || !process.argv[i + 1]) {
        console.error("Use: ts-node vault_deposit.ts --units 10000000");
        process.exit(1);
    }
    return BigInt(process.argv[i + 1]);
}
async function main() {
    const units = parseArgs();
    const server = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
    const kp = Keypair.fromSecret(REBAL_S);
    // vault.deposit(from, to, amount)
    const env = await buildInvokeTx({
        server,
        kp,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        contractId: VAULT_C,
        method: "deposit",
        args: [scvAddress(REBAL_G), scvAddress(REBAL_G), scvI128(units)],
    });
    const { hash } = await sendAndWait(server, env);
    console.log(`✅ Vault deposit sent. Hash: ${hash}`);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
