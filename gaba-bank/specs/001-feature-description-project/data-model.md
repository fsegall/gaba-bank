# Data Models

This document defines the core data structures for the Defy Invest MVP frontend. These models are based on the Key Entities identified in the feature specification.

## 1. Wallet

Represents the user's wallet state, including connection status and mock asset balances.

**TypeScript Interface**:

```typescript
interface Asset {
  code: "XLM" | "USDC" | "BRLD";
  balance: string;
}

interface Wallet {
  isConnected: boolean;
  publicKey: string | null;
  assets: Asset[];
}
```

**Example**:

```json
{
  "isConnected": true,
  "publicKey": "G...",
  "assets": [
    { "code": "XLM", "balance": "1000.00" },
    { "code": "USDC", "balance": "500.50" },
    { "code": "BRLD", "balance": "2500.75" }
  ]
}
```

## 2. Vault

Represents the DeFi investment vault, including global metrics and the user's specific position.

**TypeScript Interface**:

```typescript
interface VaultMetrics {
  pps: number; // Price Per Share
  tvl: number; // Total Value Locked
  totalShares: number;
}

interface UserVaultPosition {
  shares: number;
  balance: number; // USD equivalent
}

interface Vault extends VaultMetrics {
  userPosition: UserVaultPosition;
}
```

**Example**:

```json
{
  "pps": 1.05,
  "tvl": 1250000.0,
  "totalShares": 1190476.19,
  "userPosition": {
    "shares": 5000,
    "balance": 5250.0
  }
}
```

## 3. Transaction

Represents a user's deposit or withdrawal history.

**TypeScript Interface**:

```typescript
type TransactionType = "Deposit" | "Withdrawal";
type TransactionStatus = "Success" | "Failed";

interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  timestamp: string; // ISO 8601 format
}
```

**Example**:

```json
[
  {
    "id": "tx123",
    "type": "Deposit",
    "status": "Success",
    "amount": 1000.0,
    "timestamp": "2025-09-15T10:00:00Z"
  },
  {
    "id": "tx124",
    "type": "Withdrawal",
    "status": "Failed",
    "amount": 200.0,
    "timestamp": "2025-09-15T11:30:00Z"
  }
]
```
