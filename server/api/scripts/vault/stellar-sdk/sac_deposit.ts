/* eslint-disable no-console */
import "dotenv/config";
import { Keypair, Networks, rpc } from "@stellar/stellar-sdk";
import { buildInvokeTx, scvAddress, scvI128, sendAndWait } from "../../helpers/soroban.js";

const {
  SOROBAN_RPC_URL,
  STELLAR_NETWORK_PASSPHRASE,
  USDC_C,
  REBAL_G,
  REBAL_S,
} = process.env as Record<string, string>;

function req(name: string) {
  if (!process.env[name]) throw new Error(`Missing env: ${name}`);
}
["SOROBAN_RPC_URL", "STELLAR_NETWORK_PASSPHRASE", "USDC_C", "REBAL_G", "REBAL_S"].forEach(req);

function parseArgs() {
  // --units 10000000   (1 USDC com 7 decimais)
  const i = process.argv.indexOf("--units");
  if (i === -1 || !process.argv[i + 1]) {
    console.error("Use: ts-node sac_deposit.ts --units 10000000");
    process.exit(1);
  }
  return BigInt(process.argv[i + 1]);
}

async function main() {
  const units = parseArgs();
  const server = new rpc.Server(SOROBAN_RPC_URL!, { allowHttp: true });
  const kp = Keypair.fromSecret(REBAL_S!);

  // chama USDC_SAC.deposit(to, amount)
  const env = await buildInvokeTx({
    server,
    kp,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE!,
    contractId: USDC_C!,
    method: "deposit",
    args: [scvAddress(REBAL_G!), scvI128(units)],
  });

  const { hash } = await sendAndWait(server, env);
  console.log(`✅ SAC deposit sent. Hash: ${hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
