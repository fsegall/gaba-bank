# Wallet Service Contract

**Base URL**: `/api/wallet`

This service provides data related to the user's wallet.

---

## GET /api/wallet

Returns the current user's wallet state, including connection status and asset balances.

**Request**:

- Method: `GET`

**Response (200 OK)**:

- **Content-Type**: `application/json`
- **Body**: `Wallet` object (see `data-model.md`)

**Example (Connected)**:

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

**Example (Disconnected)**:

```json
{
  "isConnected": false,
  "publicKey": null,
  "assets": []
}
```
