export interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

export interface Asset {
  code: string;
  name: string;
  balance: string;
  issuer?: string;
}

export interface Vault {
  id: string;
  name: string;
  totalValue: string;
  assets: Asset[];
  apy: string;
  status: "active" | "inactive";
}

export interface SwapPair {
  from: string;
  to: string;
  rate: string;
  fee: string;
}

export interface Wallet {
  address: string;
  publicKey: string;
  network: "testnet" | "mainnet";
  status: "connected" | "disconnected" | "connecting";
}
