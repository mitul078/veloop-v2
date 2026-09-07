# VELoop Wallet & Payout — API Documentation

Base URL (local): `http://localhost:4000/api/v1`

All request/response bodies are JSON. All timestamps are ISO 8601 UTC.

## Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "SOME MESSAGE",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

## Authentication

Protected routes require a Bearer token:
```
Authorization: Bearer <access_token>
```

`access_token` is obtained via `/auth/login` and is short-lived (15 minutes by default). Use `/auth/refresh-token` to obtain a new one via the `refresh_token` httpOnly cookie set at login.

Internal-only routes (wallet credit/debit) require a separate header:
```
X-Internal-Key: <internal service key>
```
These are never callable by a normal user JWT alone.

---

## Auth

### `POST /auth/register`
Creates a new user account.

**Auth:** None
**Rate limit:** 5 requests / hour / IP

**Body:**
```json
{ "email": "user@example.com", "password": "MinEightChars" }
```

**Success (201):**
```json
{ "success": true, "message": "REGISTER SUCCESSFUL", "data": { "id": "...", "email": "user@example.com" } }
```

**Errors:** `USER_ALREADY_EXISTS` (409), `VALIDATION_ERROR` (400)

---

### `POST /auth/login`
**Auth:** None
**Rate limit:** 15 requests / 15 min / IP

**Body:**
```json
{ "email": "user@example.com", "password": "..." }
```

**Success (200):**
```json
{
  "success": true,
  "message": "LOGIN SUCCESSFUL",
  "data": {
    "user": { "id": "...", "email": "...", "role": "user" },
    "access_token": "eyJ..."
  }
}
```
Also sets an httpOnly `refresh_token` cookie.

**Errors:** `CREDENTIALS_INCORRECT` (401)

---

### `POST /auth/refresh-token`
**Auth:** `refresh_token` cookie (sent automatically by the browser)
**Rate limit:** 15 requests / 15 min / IP

**Success (200):**
```json
{ "success": true, "message": "TOKEN REFRESHED", "data": { "access_token": "eyJ..." } }
```

**Errors:** `TOKEN_INVALID` (401), `LOGIN_AGAIN` (401, if token reuse detected — this revokes the entire session as a security measure)

---

### `POST /auth/logout`
**Auth:** `refresh_token` cookie (optional — safe to call even without one)

**Success (200):** `{ "success": true, "message": "LOGOUT SUCCESSFUL", "data": null }`

---

### `GET /auth/me`
Returns the currently authenticated user's identity, including their current role. Useful for session restoration on page load.

**Auth:** Bearer token required

**Success (200):**
```json
{ "success": true, "message": "CURRENT USER FETCHED", "data": { "id": "...", "email": "...", "role": "user" } }
```

---

## Wallet

### `GET /wallet`
Returns current balances. Auto-creates a wallet with zero balances if the user doesn't have one yet.

**Auth:** Bearer token required

**Success (200):**
```json
{
  "success": true,
  "message": "WALLET FETCHED",
  "data": { "ves": 25000, "gems": 100, "tokens": 500, "spins": 3, "updatedAt": "..." }
}
```

---

### `GET /wallet/summary`
Returns balances plus derived values (₹ conversion, lifetime withdrawal totals).

**Auth:** Bearer token required

**Success (200):**
```json
{
  "success": true,
  "message": "SUMMARY FETCHED",
  "data": {
    "ves": 25000, "gems": 100, "tokens": 500, "spins": 3,
    "vesValueInr": 2500,
    "totalWithdrawnVes": 19500,
    "totalWithdrawalCount": 1,
    "updatedAt": "..."
  }
}
```

---

### `GET /wallet/transactions`
Paginated ledger for the authenticated user.

**Auth:** Bearer token required

**Query params:** `page` (default 1), `limit` (default 20, max 50), `currency` (optional filter), `type` (optional filter)

**Success (200):**
```json
{
  "success": true,
  "message": "TRANSACTIONS FETCHED",
  "data": {
    "items": [ { "_id": "...", "currency": "ves", "type": "WITHDRAWAL", "direction": "DEBIT", "amount": 19500, "balance_before": 25000, "balance_after": 5500, "source": "WITHDRAWAL", "reference_id": "...", "status": "COMPLETED", "createdAt": "..." } ],
    "total": 6, "page": 1, "limit": 20
  }
}
```

---

### `POST /wallet/credit` — Internal only
Credits a user's wallet. Not reachable by normal users.

**Auth:** `X-Internal-Key` header required
**Rate limit:** 10 requests / minute

**Body:**
```json
{
  "user_id": "...",
  "currency": "ves",
  "amount": 500,
  "type": "AD_REWARD",
  "source": "WATCH_AD",
  "description": "optional",
  "idempotency_key": "optional"
}
```

**Success (201):** returns the created `WalletTransaction`.

**Errors:** `FORBIDDEN` (401, missing/invalid internal key), `VALIDATION_ERROR` (400)

---

### `POST /wallet/debit` — Internal only
Same shape as `/wallet/credit`, but decrements the balance.

**Errors:** additionally `INSUFFICIENT_BALANCE` (400) if the balance is too low — this check and the deduction happen atomically, safe under concurrent requests.

---

## Payout

### `GET /payout/methods`
Lists all payout methods, including inactive ones (so the frontend can render a disabled state rather than hiding them).

**Auth:** Bearer token required

**Success (200):**
```json
{
  "success": true,
  "message": "PAYOUT METHODS FETCHED",
  "data": {
    "methods": [
      { "methodId": "upi", "name": "UPI Transfer", "type": "bank_transfer", "currency": "ves", "active": true, "eligibility": {} },
      { "methodId": "paypal", "name": "PayPal", "type": "bank_transfer", "currency": "ves", "active": false, "eligibility": { "note": "Currently unavailable in your region" } }
    ]
  }
}
```

---

### `GET /payout/options/:method`
Lists denominations for a given method. `:method` is a `methodId` (e.g. `upi`).

**Auth:** Bearer token required

**Success (200):**
```json
{
  "success": true,
  "message": "PAYOUT OPTIONS FETCHED",
  "data": {
    "options": [
      { "optionId": "upi_100", "payoutValue": 100, "requiredAmount": 19500, "currency": "ves" }
    ]
  }
}
```

**Errors:** `INVALID_PAYOUT_METHOD` (404, method doesn't exist), `INACTIVE_PAYOUT_METHOD` (400, method exists but is disabled)

---

## Withdrawals

### `POST /withdrawals`
Creates a withdrawal. Atomically: verifies the real required amount server-side, debits the wallet, writes a ledger entry, and creates the withdrawal record — all as one transaction.

**Auth:** Bearer token required
**Rate limit:** 5 requests / minute

**Body:**
```json
{
  "method": "upi",
  "optionId": "upi_100",
  "payoutDetails": { "upiId": "user@bank" },
  "idempotency_key": "optional-client-generated-uuid"
}
```

Note: the frontend never sends an amount. The real `requiredAmount` is always looked up server-side from `optionId`; any extra fields sent are ignored.

**Success (201):**
```json
{
  "success": true,
  "message": "WITHDRAWAL SUBMITTED SUCCESSFULLY",
  "data": {
    "_id": "...", "user": "...", "method": "upi", "optionId": "upi_100",
    "currency": "ves", "currencyAmount": 19500, "payoutAmount": 100,
    "payoutDetails": { "upiId": "user@bank" }, "status": "PENDING",
    "transactionId": "...", "requestedAt": "...", "createdAt": "..."
  }
}
```

**Errors:** `INSUFFICIENT_BALANCE` (400), `INVALID_PAYOUT_OPTION` (400), `INACTIVE_PAYOUT_METHOD` (400), `INVALID_PAYOUT_DETAILS` (400)

If the same `idempotency_key` is submitted again, the original withdrawal is returned unchanged — no second deduction occurs.

---

### `GET /withdrawals`
Lists the authenticated user's own withdrawals.

**Auth:** Bearer token required
**Query params:** `page`, `limit`, `status` (optional filter)

---

### `GET /withdrawals/:id`
Fetch a single withdrawal by ID. Scoped to the authenticated user — another user's withdrawal ID returns `404 WITHDRAWAL_NOT_FOUND`, identical to a nonexistent ID (does not leak existence).

---

## Admin — Withdrawal Review

All admin routes require `role: "admin"` on the authenticated account, in addition to a valid Bearer token.

### `GET /withdrawals/admin/all`
Lists withdrawals across **all** users (unscoped). Each item includes the owning user's email via population.

**Auth:** Bearer token + admin role
**Query params:** `page`, `limit`, `status` (optional filter)

**Errors:** `FORBIDDEN` (401, non-admin account)

---

### `POST /withdrawals/:id/approve`
Marks a `PENDING`/`PROCESSING` withdrawal as `APPROVED`. Does not move money (money was already deducted at request time under Option A) — this marks the payout as confirmed/paid out externally.

**Auth:** Bearer token + admin role

**Body:**
```json
{ "reviewNote": "optional" }
```

**Success (200):** returns the updated withdrawal.

**Errors:** `WITHDRAWAL_NOT_FOUND` (404), `INVALID_WITHDRAWAL_STATE` (400, already approved/rejected)

---

### `POST /withdrawals/:id/reject`
Rejects a `PENDING`/`PROCESSING` withdrawal and **atomically reverses the deduction** — the original VEs amount is credited back to the user's wallet with a `REVERSAL` ledger entry linked to the withdrawal.

**Auth:** Bearer token + admin role

**Body:**
```json
{ "rejectionReason": "Invalid payout details provided.", "reviewNote": "optional" }
```

**Success (200):** `{ "success": true, "message": "WITHDRAWAL REJECTED" }`

**Errors:** `WITHDRAWAL_NOT_FOUND` (404), `INVALID_WITHDRAWAL_STATE` (400)

---

## Error Code Reference

| Code | Meaning |
|---|---|
| `USER_ALREADY_EXISTS` | Email already registered |
| `CREDENTIALS_INCORRECT` | Wrong email/password on login |
| `TOKEN_INVALID` | Expired/malformed refresh token |
| `LOGIN_AGAIN` | Refresh token reuse detected — session revoked |
| `FORBIDDEN` | Missing/invalid internal key, or non-admin accessing admin route |
| `VALIDATION_ERROR` | Request body failed schema validation |
| `INSUFFICIENT_BALANCE` | Wallet doesn't have enough of the requested currency |
| `INVALID_PAYOUT_METHOD` | `methodId` doesn't exist |
| `INACTIVE_PAYOUT_METHOD` | Method exists but is currently disabled |
| `INVALID_PAYOUT_OPTION` | `optionId` doesn't exist, or doesn't belong to the given method |
| `INVALID_PAYOUT_DETAILS` | `payoutDetails` missing or empty |
| `WITHDRAWAL_NOT_FOUND` | Withdrawal doesn't exist, or doesn't belong to the requesting user |
| `INVALID_WITHDRAWAL_STATE` | Attempting to approve/reject an already-processed withdrawal |
| `RATE_LIMITED` | Too many requests in the current window |
