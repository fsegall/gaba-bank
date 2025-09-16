// api/src/scripts/soroban-helpers.ts
import {
    Address,
    BASE_FEE,
    Contract,
    Keypair,
    Networks,
    TransactionBuilder,
    nativeToScVal,
    xdr,
    rpc,
  } from "@stellar/stellar-sdk";
  
  export function scvAddress(g: string): xdr.ScVal {
    const scAddr = Address.fromString(g).toScAddress();
    return xdr.ScVal.scvAddress(scAddr);
  }
  
  export function scvI128(v: string | bigint): xdr.ScVal {
    return nativeToScVal(v.toString(), { type: "i128" });
  }
  
  export async function sendAndWait(
    server: rpc.Server,
    tx: any
  ) {
    const send = await server.sendTransaction(tx);
    if (send.errorResult) throw new Error(`send error: ${send.errorResult}`);
  
    // get transaction result
    const res = await server.getTransaction(send.hash);
    if (res.status !== "SUCCESS") {
      throw new Error(`tx failed: ${res.status}`);
    }
    return { hash: send.hash, res };
  }
  
  export async function buildInvokeTx(opts: {
    server: rpc.Server;
    kp: Keypair;
    networkPassphrase: string;
    contractId: string;
    method: string;
    args: xdr.ScVal[];
    timeout?: number;
  }) {
    const { server, kp, networkPassphrase, contractId, method, args, timeout = 60 } = opts;
    const acct = await server.getAccount(kp.publicKey());
    const c = new Contract(contractId);
  
    let tx = new TransactionBuilder(acct, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(c.call(method, ...args))
      .setTimeout(timeout)
      .build();
  
    // prepara footprint + auth via simulate
    tx = await server.prepareTransaction(tx);
    tx.sign(kp);
    return tx;
  }
  