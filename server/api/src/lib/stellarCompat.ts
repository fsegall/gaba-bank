// api/src/lib/stellarCompat.ts
import * as SDK from "@stellar/stellar-sdk";

export const Keypair = SDK.Keypair;
export const Networks = SDK.Networks;
export const Transaction = SDK.Transaction;

/** Retorna uma instância de Server, independente de a lib exportar Server ou Horizon.Server */
export function getServer(horizonUrl: string) {
  const anySDK = SDK as any;
  if (anySDK.Server) return new anySDK.Server(horizonUrl);
  if (anySDK.Horizon?.Server) return new anySDK.Horizon.Server(horizonUrl);
  throw new Error("stellar-sdk: não encontrei Server nem Horizon.Server");
}
