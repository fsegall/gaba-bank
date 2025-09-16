// api/src/lib/stellarSigner.ts
import { execFile } from "node:child_process";
import axios from "axios";
import { Horizon } from "@stellar/stellar-sdk";


const HORIZON_URL =
  process.env.HORIZON_URL ||
  process.env.STELLAR_RPC_URL ||     // fallback comum usado no seu .env
  process.env.STELLAR_HORIZON_URL || // se existir
  'https://horizon-testnet.stellar.org';

if (!/^https?:\/\//.test(HORIZON_URL)) {
  throw new Error(`[stellarSigner] invalid HORIZON_URL: ${HORIZON_URL}`);
}

export const horizon = new Horizon.Server(HORIZON_URL);

// (se precisar do passphrase em alguma assinatura classic)
export const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  process.env.SOROBAN_NETWORK_PASSPHRASE || // você já usa essa no oracle
  'Test SDF Network ; September 2015';

export async function signWithCLI(xdrB64: string, alias = "defy-treasury") {
  return new Promise<string>((resolve, reject) => {
    const child = execFile(
      "stellar",
      [
        "tx",
        "sign",
        "--sign-with-key",
        alias,
        "--network",
        process.env.STELLAR_NETWORK || "testnet",
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout.trim());
      }
    );
    child.stdin?.write(xdrB64);
    child.stdin?.end();
  });
}

export async function submitSignedXDR(xdrSignedB64: string) {
  const url = `${HORIZON_URL.replace(/\/$/, "")}/transactions`;
  const response = await axios.post(
    url,
    `tx=${encodeURIComponent(xdrSignedB64)}`,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}
