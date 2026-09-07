import walletRepository from "./wallet.repository.js"
import { ValidationError } from "../../shared/errors/error_type.js"
import auditService from "../../shared/services/audit.service.js"

const VE_TO_INR_RATE = 0.10

async function get_wallet({ user_id }) {
    const wallet = await walletRepository.get_or_create_wallet({ user_id })
    return {
        ves: wallet.ves,
        gems: wallet.gems,
        tokens: wallet.tokens,
        spins: wallet.spins,
        updatedAt: wallet.updatedAt
    }
}

async function get_transactions({ user_id, page, limit, currency, type }) {
    return walletRepository.get_transactions({ user_id, page, limit, currency, type })
}

async function get_summary({ user_id }) {
    const wallet = await walletRepository.get_or_create_wallet({ user_id })
    const withdrawal_totals = await walletRepository.get_withdrawal_totals_by_user({ user_id })
    const totals = withdrawal_totals[0] || { totalWithdrawn: 0, count: 0 }

    return {
        ves: wallet.ves,
        gems: wallet.gems,
        tokens: wallet.tokens,
        spins: wallet.spins,
        vesValueInr: Math.round(wallet.ves * VE_TO_INR_RATE),
        totalWithdrawnVes: totals.totalWithdrawn,
        totalWithdrawalCount: totals.count,
        updatedAt: wallet.updatedAt
    }
}

async function credit_wallet({ user_id, currency, amount, type, source, reference_id, description, metadata, idempotency_key, actor_id, ip }) {
    if (amount <= 0) throw new ValidationError("AMOUNT MUST BE POSITIVE")

    if (idempotency_key) {
        const existing = await walletRepository.find_transaction_by_idempotency_key({ idempotency_key })
        if (existing) return existing
    }

    const session = await walletRepository.start_session()
    try {
        let result
        await session.withTransaction(async () => {
            const before = await walletRepository.get_wallet({ user_id })
            const balance_before = before ? before[currency] : 0

            const updated = await walletRepository.credit_wallet_atomic({ user_id, currency, amount, session })

            result = await walletRepository.create_transaction({
                user_id, currency, type, direction: "CREDIT", amount,
                balance_before, balance_after: updated[currency],
                source, reference_id, description, metadata, idempotency_key, session
            })
        })

        await auditService.log_action({
            actor_id: actor_id || null,
            action: "WALLET_CREDIT",
            target_user_id: user_id,
            target_type: "WalletTransaction",
            reference_id: result._id,
            metadata: { currency, amount, type, source },
            ip
        })

        return result
    } finally {
        await session.endSession()
    }
}

async function debit_wallet({ user_id, currency, amount, type, source, reference_id, description, metadata, idempotency_key, actor_id, ip }) {
    if (amount <= 0) throw new ValidationError("AMOUNT MUST BE POSITIVE")

    if (idempotency_key) {
        const existing = await walletRepository.find_transaction_by_idempotency_key({ idempotency_key })
        if (existing) return existing
    }

    const session = await walletRepository.start_session()
    try {
        let result
        await session.withTransaction(async () => {
            const before = await walletRepository.get_wallet({ user_id })
            const balance_before = before ? before[currency] : 0

            const updated = await walletRepository.debit_wallet_atomic({ user_id, currency, amount, session })

            if (!updated) {
                throw new ValidationError(`INSUFFICIENT ${currency.toUpperCase()} BALANCE`, "INSUFFICIENT_BALANCE")
            }

            result = await walletRepository.create_transaction({
                user_id, currency, type, direction: "DEBIT", amount,
                balance_before, balance_after: updated[currency],
                source, reference_id, description, metadata, idempotency_key, session
            })
        })

        await auditService.log_action({
            actor_id: actor_id || null,
            action: "WALLET_DEBIT",
            target_user_id: user_id,
            target_type: "WalletTransaction",
            reference_id: result._id,
            metadata: { currency, amount, type, source },
            ip
        })

        return result
    } finally {
        await session.endSession()
    }
}

async function validate_balance({ user_id, currency, amount }) {
    const wallet = await walletRepository.get_wallet({ user_id })
    const balance = wallet ? wallet[currency] : 0
    return { sufficient: balance >= amount, balance }
}

export default {
    get_wallet,
    get_transactions,
    get_summary,
    credit_wallet,
    debit_wallet,
    validate_balance
}