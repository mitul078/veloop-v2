import mongoose from "mongoose"

const wallet_schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true, unique: true },
    ves: { type: Number, default: 0, min: 0 },
    gems: { type: Number, default: 0, min: 0 },
    tokens: { type: Number, default: 0, min: 0 },
    spins: { type: Number, default: 0, min: 0 }
}, { timestamps: true })


const CURRENCIES = ["ves", "gems", "tokens", "spins"]
const CREDIT_TYPES = ["REWARD", "BONUS", "REFERRAL", "DAILY_REWARD", "AD_REWARD", "GAME_REWARD", "ADMIN_CREDIT", "EXCHANGE_CREDIT", "REVERSAL"]
const DEBIT_TYPES = ["WITHDRAWAL", "EXCHANGE_DEBIT", "ADMIN_DEBIT", "CORRECTION"]

const wallet_transaction_schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    currency: { type: String, enum: CURRENCIES, required: true },
    type: { type: String, enum: [...CREDIT_TYPES, ...DEBIT_TYPES], required: true },
    direction: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true, min: 0 },
    balance_before: { type: Number, required: true },
    balance_after: { type: Number, required: true },
    source: { type: String, required: true },
    reference_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], default: "COMPLETED" },
    description: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    idempotency_key: { type: String }
}, { timestamps: true })



wallet_transaction_schema.index({ user: 1, createdAt: -1 })
wallet_transaction_schema.index({ reference_id: 1 })
wallet_transaction_schema.index({ idempotency_key: 1 }, { unique: true, sparse: true })

export const Wallet = mongoose.model("Wallet", wallet_schema)
export const WalletTransaction = mongoose.model("WalletTransaction", wallet_transaction_schema)
export { CURRENCIES, CREDIT_TYPES, DEBIT_TYPES }