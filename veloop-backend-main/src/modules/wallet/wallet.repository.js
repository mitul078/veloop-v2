import mongoose from "mongoose"
import { Wallet, WalletTransaction } from "./wallet.model.js"

async function get_or_create_wallet({ user_id }) {
    let wallet = await Wallet.findOne({ user: user_id })
    if (!wallet) {
        wallet = await Wallet.create({ user: user_id })
    }
    return wallet
}

async function get_wallet({ user_id }) {
    return Wallet.findOne({ user: user_id })
}

async function credit_wallet_atomic({ user_id, currency, amount, session }) {
    return Wallet.findOneAndUpdate(
        { user: user_id },
        { $inc: { [currency]: amount } },
        { new: true, upsert: true, session }
    )
}

async function debit_wallet_atomic({ user_id, currency, amount, session }) {
    return Wallet.findOneAndUpdate(
        { user: user_id, [currency]: { $gte: amount } },
        { $inc: { [currency]: -amount } },
        { new: true, session }
    )
}

async function create_transaction({
    user_id, currency, type, direction, amount,
    balance_before, balance_after, source, reference_id,
    description, metadata, idempotency_key, session
}) {
    const doc = {
        user: user_id, currency, type, direction, amount,
        balance_before, balance_after, source, reference_id,
        description: description || "", metadata: metadata || {}
    }

    if (idempotency_key) {
        doc.idempotency_key = idempotency_key
    }

    const docs = await WalletTransaction.create([doc], { session })
    return docs[0]
}

async function get_transactions({ user_id, page = 1, limit = 20, currency, type }) {
    const match = { user: user_id }
    if (currency) match.currency = currency
    if (type) match.type = type

    const [items, total] = await Promise.all([
        WalletTransaction.find(match)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        WalletTransaction.countDocuments(match)
    ])

    return { items, total, page, limit }
}

async function find_transaction_by_idempotency_key({ idempotency_key }) {
    return WalletTransaction.findOne({ idempotency_key })
}

async function get_withdrawal_totals_by_user({ user_id }) {
    return WalletTransaction.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(user_id), type: "WITHDRAWAL", direction: "DEBIT" } },
        {
            $group: {
                _id: null,
                totalWithdrawn: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        }
    ])
}

async function start_session() {
    return mongoose.startSession()
}

export default {
    get_or_create_wallet,
    get_wallet,
    credit_wallet_atomic,
    debit_wallet_atomic,
    create_transaction,
    get_transactions,
    find_transaction_by_idempotency_key,
    get_withdrawal_totals_by_user,
    start_session
}