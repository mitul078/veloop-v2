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

## 8. Scaling: From 1,000 to 1,000,000 Users

The current design (MongoDB with atomic per-document operations, a full transaction ledger, and stateless JWT auth) scales reasonably as-is into the low hundreds of thousands of users, but several concrete changes would be needed approaching a million:

**Database:**
- Add read replicas for the wallet/transaction read paths (`GET /wallet`, `GET /wallet/transactions`) — these are read-heavy and don't need to hit the primary.
- Shard the `WalletTransaction` collection by `user_id` once ledger volume grows large enough that single-node write throughput becomes a bottleneck; the existing indexes (`{ user: 1, createdAt: -1 }`) are already shard-key-friendly.
- Move to a dedicated time-series or append-only store for the ledger if transaction volume grows into the tens of millions of rows, since it's a write-heavy, immutable, append-only workload — a good fit for specialized storage rather than a general-purpose collection.

**Application layer:**
- Move rate limiting from in-memory (`express-rate-limit`'s default store) to a shared store like Redis, since in-memory limiters don't work correctly across multiple horizontally-scaled server instances — each instance would track limits independently, defeating the purpose.
- Introduce a message queue (e.g. SQS, RabbitMQ) between withdrawal creation and actual payout processing/admin review, so the API response to the user stays fast regardless of downstream processing load, and processing can be scaled independently.
- Cache `PayoutMethod`/`PayoutOption` reads (they change rarely) — a simple Redis cache with a short TTL or explicit invalidation on admin update would remove repeated DB round-trips for what is largely static configuration data.

**Concurrency & consistency:**
- The atomic `$gte`-filtered update pattern already used here scales well under contention on a *single* document, since MongoDB serializes writes per-document regardless of load — this doesn't need to change. The main scaling risk at high volume is many different users writing simultaneously (horizontal load), which is a MongoDB sharding/replica-set capacity question, not a correctness question with the current logic.

**Idempotency store:**
- The current sparse-unique-index approach on `idempotency_key` remains correct at scale, but for very high-volume idempotency needs (e.g. millions of requests/day), a dedicated fast key-value store (Redis with TTL) ahead of the database is a common pattern to reduce load on MongoDB for what is fundamentally a short-lived deduplication check.

**Reconciliation:**
- At scale, periodic automated reconciliation jobs (comparing `SUM(ledger entries)` against the stored `Wallet` balance per user, flagging any drift) become essential — currently this can be done manually via aggregation queries, but a scheduled job with alerting would be the production-grade version.

## 9. Environment Variables

See `.env.example` for the full list. Never commit a real `.env` file.

## 10. Deployment

- Backend: deployed on Render
- Frontend (user-facing): deployed on Vercel
- Frontend (admin console): deployed on Vercel (separate project)
- Database: MongoDB Atlas

Live URLs: *(fill in after deployment)*
