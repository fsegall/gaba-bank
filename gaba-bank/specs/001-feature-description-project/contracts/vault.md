# Vault Service Contract

**Base URL**: `/api/vault`

This service provides data related to the investment vault.

---

## GET /api/vault

Returns global vault metrics and the current user's position.

**Request**:

- Method: `GET`

**Response (200 OK)**:

- **Content-Type**: `application/json`
- **Body**: `Vault` object (see `data-model.md`)

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

---

## GET /api/vault/transactions

Returns the user's transaction history for the vault.

**Request**:

- Method: `GET`

**Response (200 OK)**:

- **Content-Type**: `application/json`
- **Body**: Array of `Transaction` objects (see `data-model.md`)

---

## POST /api/vault/deposit

Simulates a deposit transaction.

**Request**:

- Method: `POST`
- **Body**:
  ```json
  {
    "amount": number
  }
  ```

**Response (200 OK - Success)**:

```json
{
  "status": "Success",
  "transactionId": "tx..."
}
```

**Response (400 Bad Request - Failure)**:

```json
{
  "status": "Failed",
  "error": "Insufficient funds"
}
```

---

## POST /api/vault/withdraw

Simulates a withdrawal transaction.

**Request**:

- Method: `POST`
- **Body**:
  ```json
  {
    "amount": number
  }
  ```

**Response (200 OK - Success)**:

```json
{
  "status": "Success",
  "transactionId": "tx..."
}
```

**Response (400 Bad Request - Failure)**:

```json
{
  "status": "Failed",
  "error": "Exceeds withdrawal limit"
}
```
