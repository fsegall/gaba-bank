// api/src/lib/stellarSigner.ts
import { execFile } from "node:child_process";
import { Horizon, Networks, Transaction } from "@stellar/stellar-sdk";

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;
const HORIZON_URL = process.env.HORIZON_URL!;
const server = new Horizon.Server(HORIZON_URL);

export async function signWithCLI(
      xdrB64: string,
      alias = process.env.STELLAR_SIGNER_ALIAS || "defy-treasury"
    ) {
      return new Promise<string>((resolve, reject) => {
        const child = execFile(
          "stellar",
          [
            "tx",
            "sign",
            "--sign-with-key",
            alias,
            "--network",
            (process.env.STELLAR_NETWORK || "testnet").toLowerCase(),
          ],
          { maxBuffer: 10 * 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              const msg = `stellar tx sign failed: ${stderr || error.message}`;
              return reject(new Error(msg));
            }
            resolve(String(stdout).trim());
          }
        );
        // envia o XDR pro stdin do processo do CLI
        child.stdin?.write(xdrB64);
        child.stdin?.end();
      });
    }

export async function submitSignedXDR(xdrSignedB64: string) {
  const tx = new Transaction(xdrSignedB64, NETWORK_PASSPHRASE);
  return server.submitTransaction(tx);
}
