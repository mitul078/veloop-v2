# VELoop Wallet & Payout Backend

A secure, backend-driven wallet, payout, and withdrawal system for VELoop Rewards. Built so the backend is the sole source of truth for balances, payout pricing, and withdrawal eligibility — the frontend only displays and collects input; it never decides or trusts client-supplied amounts.

## 1. Project Overview

This system manages:
- **Wallet balances** across four currencies: VEs, Gems, Tokens, Spins
- **A full transaction ledger** — every balance change is recorded, never applied silently
- **Configurable payout methods and denominations** (UPI, Amazon Gift Card, Google Play Gift Card, PayPal), stored in the database, not hardcoded in the frontend
- **Withdrawal requests** with a full lifecycle (`PENDING → APPROVED / REJECTED / CANCELLED`)
- **Admin actions** (approve/reject) with automatic balance reversal on rejection
- **Audit logging** for every sensitive action
- **Idempotency and atomic concurrency-safe operations** for all balance-mutating endpoints

## 2. Architecture

```
Frontend (React)
   │
   ▼
API Client (axios)
   │
   ▼
Express Routes → Middleware (auth, validate, rate-limit)
   │
   ▼
Controller → Service (business logic) → Repository (DB access) → MongoDB
```

Each module (`auth`, `wallet`, `payout`, `withdrawal`) follows the same layered structure:

```
modules/<name>/
├── <name>.model.js        Mongoose schema
├── <name>.repository.js   Raw DB access, no business logic
├── <name>.service.js      Business rules, validation, orchestration
├── <name>.controller.js   HTTP request/response handling
├── <name>.route.js        Route wiring + middleware
├── <name>.validation.js   Zod request schemas
└── index.js                Route re-export
```

This keeps each layer replaceable independently — e.g. swapping databases later would only touch the repository layer.

## 3. Database Schema

### Auth
```
{
  email: String (unique),
  password: String (bcrypt hash),
  verified: Boolean,
  role: "user" | "admin"
}
```

### Wallet
```
{
  user: ObjectId (ref Auth, unique),
  ves: Number,
  gems: Number,
  tokens: Number,
  spins: Number
}
```

### WalletTransaction (the ledger)
```
{
  user: ObjectId,
  currency: "ves" | "gems" | "tokens" | "spins",
  type: String (e.g. "AD_REWARD", "WITHDRAWAL", "REVERSAL"),
  direction: "CREDIT" | "DEBIT",
  amount: Number,
  balance_before: Number,
  balance_after: Number,
  source: String,
  reference_id: ObjectId (links to a Withdrawal, if applicable),
  status: "COMPLETED" | "PENDING" | "FAILED",
  idempotency_key: String (unique, sparse)
}
```

### PayoutMethod
```
{
  methodId: String (unique, e.g. "upi"),
  name: String,
  type: String,
  currency: String,
  active: Boolean,
  eligibility: Mixed,
  metadata: Mixed
}
```

### PayoutOption
```
{
  methodId: String,
  optionId: String (unique, e.g. "upi_100"),
  payoutValue: Number (₹ amount),
  requiredAmount: Number (VEs required),
  currency: String,
  active: Boolean
}
```

### Withdrawal
```
{
  user: ObjectId,
  method: String,
  optionId: String,
  currency: String,
  currencyAmount: Number,   // VEs deducted
  payoutAmount: Number,     // ₹ value user receives
  payoutDetails: Mixed,     // e.g. { upiId }
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" | "CANCELLED",
  rejectionReason: String,
  reviewNote: String,
  transactionId: ObjectId (linked ledger entry),
  idempotencyKey: String (unique, sparse)
}
```

### AuditLog
```
{
  actor_id: ObjectId,       // who performed the action
  action: String,           // e.g. "WITHDRAWAL_APPROVED"
  target_user_id: ObjectId, // whose data was affected
  reference_id: ObjectId,
  metadata: Mixed,
  ip: String
}
```

## 4. Key Design Decisions

### 4.1 Wallet Deduction Strategy — Option A (Immediate Deduction)

When a user submits a withdrawal, the required VEs are **debited immediately**, atomically, in the same database transaction that creates the withdrawal record. The withdrawal then sits in `PENDING` status.

**Why this approach:**
- Simpler to implement correctly and verify under a tight timeline than a dual-balance (`available` vs `held`) reservation system.
- Matches how many real payout/rewards platforms behave — money is taken at request time, and reversed via a `REVERSAL` ledger entry if the request is later rejected.
- Combined with atomic operations and rejection-triggered reversal, this gives the same guarantee a reservation system would (a user can never spend the same VEs twice), just with one fewer intermediate state to manage.

**Trade-off acknowledged:** a reserved-balance model is architecturally "purer" at very large scale (avoids ever showing a user a balance they can't immediately act on), but was not necessary to satisfy the stated requirements within the project timeline.

### 4.2 Idempotency

Every balance-mutating endpoint (`wallet/credit`, `wallet/debit`, `withdrawals`) accepts an optional `idempotency_key`. If the same key is submitted twice:
1. **Application-level check** — a fast lookup for an existing record with that key; if found, the original result is returned immediately, no new mutation occurs.
2. **Database-level guarantee** — a sparse unique index on `idempotency_key` ensures that even under a genuine race (two identical requests arriving simultaneously), only one document can ever be created with that key. The second insert fails at the database level and is handled gracefully.

The field has **no default value** — it is entirely absent from documents where no key was supplied, which is what makes the sparse index behave correctly (a `null`-valued field is not the same as an absent field for indexing purposes).

### 4.3 Concurrency Safety

Wallet debits use a single atomic MongoDB operation combining the balance check and the deduction:

```js
Wallet.findOneAndUpdate(
  { user: user_id, [currency]: { $gte: amount } },
  { $inc: { [currency]: -amount } }
)
```

The `$gte` condition lives inside the **query filter**, not a separate application-level check performed before the update. This means MongoDB itself resolves any race between two simultaneous requests — only one can match the filter and succeed; the other's filter no longer matches once the first has applied, and it fails cleanly with an "insufficient balance" response. This was verified under real concurrent load (see Testing section).

### 4.4 Backend-Controlled Pricing

The frontend never sends an amount. A withdrawal request contains only `{ method, optionId, payoutDetails }`. The backend independently looks up the real `requiredAmount` for that `optionId` from the database and uses only that value — any extra fields sent by the client (e.g. an injected `amount` or `payoutAmount`) are silently ignored by validation and never read by the withdrawal logic. This was directly tested by sending a manipulated request with fake amount fields; the real, correct values were still used.

## 5. Local Setup

```bash
git clone <repo-url>
cd veloop-wallet-backend
npm install
cp .env.example .env   # fill in real values
npm run dev
```

### Seeding demo/reference data

```bash
node seed/payoutOptions.js   # payout methods + denominations
node seed/demoUser.js        # demo user with pre-loaded wallet + sample transactions
```

Demo user credentials: `demo@veloop.test` / `Demo@12345`

### Promoting a user to admin

```js
// in mongosh
db.auths.updateOne({ email: "your-email" }, { $set: { role: "admin" } })
```
Then log in again — the JWT is only refreshed with the new role on a fresh login.

## 6. Requirements — MongoDB Replica Set

Atomic multi-document transactions (`session.withTransaction`) require MongoDB to run as a replica set. **MongoDB Atlas clusters are replica sets by default**, including the free tier — no extra configuration needed if using Atlas. A plain standalone local `mongod` will not support transactions.

## 7. Testing

All required test scenarios were verified manually against the running API (see `postman_collection.json` for the exact requests used):

| Test | Result |
|---|---|
| Normal credit | ✅ Pass |
| Normal withdrawal (debit + ledger + record, atomic) | ✅ Pass |
| Insufficient balance rejected cleanly, no partial state | ✅ Pass |
| Duplicate/double-click request returns original result, no double deduction | ✅ Pass |
| Two simultaneous withdrawals for the same funds — only one succeeds | ✅ Pass |
| Invalid/nonexistent payout option rejected | ✅ Pass |
| User cannot access another user's withdrawal (404, not 403 — avoids leaking existence) | ✅ Pass |
| Rejected withdrawal correctly reverses the deduction via a `REVERSAL` ledger entry | ✅ Pass |
| Injected/manipulated amount fields in the request are ignored; real values re-derived server-side | ✅ Pass |

## 8. Production Hardening — Improvements Implemented

After the core functionality was built and verified against all required test cases, the backend was reviewed specifically for production-readiness (speed, scalability, reliability) — not for bugs, since none were found in this pass. The following concrete improvements were made:

| # | Improvement | What changed | Why |
|---|---|---|---|
| 1 | Removed a redundant DB read on every wallet mutation | `credit_wallet`/`debit_wallet`/`create_withdrawal`/`reject_withdrawal` previously fetched the wallet once to record `balance_before`, then again via the atomic update. `balance_before` is now derived arithmetically from the atomic update's result (`balance_after ∓ amount`) instead. | Cuts one full DB round-trip from every single wallet-mutating request, with zero change in correctness — the math is exact, not approximate. |
| 2 | In-memory caching for payout configuration | `GET /payout/methods` and `GET /payout/options/:method` are now served from a short-lived (5 min) in-memory cache instead of querying MongoDB on every call. | This data changes rarely; caching removes nearly all read load for what is largely static configuration. Deliberately **not** applied to the internal `get_option_by_id` lookup used by the security-critical `resolve_option` function — that stays a fresh, always-current query, since it's the one value that directly controls money movement. |
| 3 | `.lean()` on all read-only list/detail queries | Applied to transaction lists, withdrawal lists, and payout config queries. | Returns plain JS objects instead of full Mongoose documents for data that's only ever serialized to JSON — lower memory use and faster response construction, with no change to the response shape. |
| 4 | Transaction retry logic | Wrapped `session.withTransaction(...)` calls in a retry helper that specifically retries `TransientTransactionError`/`UnknownTransactionCommitResult` (MongoDB's own documented recoverable-error labels), with a short backoff, up to 3 attempts. | Real replica-set conditions (e.g. a brief primary election) can cause a transaction to fail for reasons unrelated to the actual business logic. Genuine business rejections (e.g. insufficient balance) are correctly **not** retried, since they don't carry these error labels — confirmed by testing that an insufficient-balance request still fails immediately, not after a retry delay. |
| 5 | Compound index on `Withdrawal` | Replaced a single-field `{status: 1}` index with `{status: 1, createdAt: -1}`. | Matches the exact query pattern used by the admin withdrawal list endpoint (filter by status, sort by recency) — lets MongoDB satisfy both the filter and the sort from one index instead of filtering then sorting separately. |
| 6 | Response compression | Added the `compression` middleware. | Reduces payload size over the wire for larger responses (e.g. transaction/withdrawal lists). Below the default 1KB threshold, compression is correctly skipped, since gzip overhead isn't worth it for small payloads. |

## 9. Environment Variables

See `.env.example` for the full list. Never commit a real `.env` file.

## 10. Deployment

- Backend: deployed on Render
- Frontend (user-facing): deployed on Vercel
- Frontend (admin console): deployed on Vercel (separate project)
- Database: MongoDB Atlas

Live URLs:
- Backend API: *(add your Render URL here)*
- User frontend: *https://veloop-frontend-v2.vercel.app*
- Admin console: *https://veloop-admin-v1.vercel.app*
