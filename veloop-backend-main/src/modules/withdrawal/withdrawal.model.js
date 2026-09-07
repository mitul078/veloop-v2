import mongoose from "mongoose"

const STATUSES = ["PENDING", "PROCESSING", "APPROVED", "REJECTED", "CANCELLED"]

const withdrawal_schema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true },
    method: { type: String, required: true },
    optionId: { type: String, required: true },
    currency: { type: String, required: true, default: "ves" },
    currencyAmount: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    payoutDetails: { type: mongoose.Schema.Types.Mixed, required: true }, //{ upiId: "" }
    status: { type: String, enum: STATUSES, default: "PENDING" },
    rejectionReason: { type: String, default: null },
    reviewNote: { type: String, default: null },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "WalletTransaction", default: null },
    idempotencyKey: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null }
}, { timestamps: true })

withdrawal_schema.index({ user: 1, createdAt: -1 })
withdrawal_schema.index({ status: 1 })
withdrawal_schema.index({ idempotencyKey: 1 }, { unique: true, sparse: true })

export const Withdrawal = mongoose.model("Withdrawal", withdrawal_schema)
export { STATUSES }