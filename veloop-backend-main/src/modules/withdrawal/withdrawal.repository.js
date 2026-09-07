import { Withdrawal } from "./withdrawal.model.js"

async function create_withdrawal(data, session) {
    const docs = await Withdrawal.create([data], { session })
    return docs[0]
}

async function find_by_idempotency_key({ idempotencyKey }) {
    return Withdrawal.findOne({ idempotencyKey })
}

async function get_withdrawals_by_user({ user_id, page = 1, limit = 20, status }) {
    const match = { user: user_id }
    if (status) match.status = status

    const [items, total] = await Promise.all([
        Withdrawal.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Withdrawal.countDocuments(match)
    ])

    return { items, total, page, limit }
}

async function get_withdrawal_by_id({ withdrawal_id, user_id }) {
    return Withdrawal.findOne({ _id: withdrawal_id, user: user_id })
}

async function update_status({ withdrawal_id, status, rejectionReason, reviewNote }) {
    const update = { status }
    if (rejectionReason !== undefined) update.rejectionReason = rejectionReason
    if (reviewNote !== undefined) update.reviewNote = reviewNote
    if (["APPROVED", "REJECTED", "CANCELLED"].includes(status)) update.processedAt = new Date()

    return Withdrawal.findByIdAndUpdate(withdrawal_id, update, { new: true })
}

async function get_withdrawal_by_id_admin({ withdrawal_id }) {
    return Withdrawal.findById(withdrawal_id)
}

async function get_all_withdrawals({ page = 1, limit = 20, status }) {
    const match = {}
    if (status) match.status = status

    const [items, total] = await Promise.all([
        Withdrawal.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "email"),
        Withdrawal.countDocuments(match)
    ])

    return { items, total, page, limit }
}

export default {
    create_withdrawal,
    find_by_idempotency_key,
    get_withdrawals_by_user,
    get_withdrawal_by_id,
    update_status,
    get_withdrawal_by_id_admin,
    get_all_withdrawals
}