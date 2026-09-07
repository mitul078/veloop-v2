import withdrawalRepository from "./withdrawal.repository.js"
import walletRepository from "../wallet/wallet.repository.js"
import payoutService from "../payout/payout.service.js"
import { ValidationError, NotFoundError } from "../../shared/errors/error_type.js"
import auditService from "../../shared/services/audit.service.js"

async function create_withdrawal({ user_id, method, optionId, payoutDetails, idempotency_key, ip }) {
    if (idempotency_key) {
        const existing = await withdrawalRepository.find_by_idempotency_key({ idempotencyKey: idempotency_key })
        if (existing) return existing
    }

    const resolved = await payoutService.resolve_option({ methodId: method, optionId })

    if (!payoutDetails || typeof payoutDetails !== "object") {
        throw new ValidationError("Payout details are required.", "INVALID_PAYOUT_DETAILS")
    }

    const session = await walletRepository.start_session()
    try {
        let withdrawal
        await session.withTransaction(async () => {
            const before = await walletRepository.get_wallet({ user_id })
            const balance_before = before ? before[resolved.currency] : 0

            const updated = await walletRepository.debit_wallet_atomic({
                user_id,
                currency: resolved.currency,
                amount: resolved.requiredAmount,
                session
            })

            if (!updated) {
                throw new ValidationError(`INSUFFICIENT ${resolved.currency.toUpperCase()} BALANCE`, "INSUFFICIENT_BALANCE")
            }

            const transaction = await walletRepository.create_transaction({
                user_id,
                currency: resolved.currency,
                type: "WITHDRAWAL",
                direction: "DEBIT",
                amount: resolved.requiredAmount,
                balance_before,
                balance_after: updated[resolved.currency],
                source: "WITHDRAWAL",
                reference_id: null,
                description: `Withdrawal: ${resolved.methodId} ${resolved.optionId}`,
                session
            })

            withdrawal = await withdrawalRepository.create_withdrawal({
                user: user_id,
                method: resolved.methodId,
                optionId: resolved.optionId,
                currency: resolved.currency,
                currencyAmount: resolved.requiredAmount,
                payoutAmount: resolved.payoutValue,
                payoutDetails,
                status: "PENDING",
                transactionId: transaction._id,
                idempotencyKey: idempotency_key || undefined,
                requestedAt: new Date()
            }, session)

            transaction.reference_id = withdrawal._id
            await transaction.save({ session })
        })

        await auditService.log_action({
            actor_id: user_id,
            action: "WITHDRAWAL_CREATED",
            target_user_id: user_id,
            target_type: "Withdrawal",
            reference_id: withdrawal._id,
            metadata: { method, optionId, amount: resolved.requiredAmount },
            ip
        })

        return withdrawal
    } finally {
        await session.endSession()
    }
}

async function get_withdrawals({ user_id, page, limit, status }) {
    return withdrawalRepository.get_withdrawals_by_user({ user_id, page, limit, status })
}

async function get_withdrawal_by_id({ withdrawal_id, user_id }) {
    const withdrawal = await withdrawalRepository.get_withdrawal_by_id({ withdrawal_id, user_id })
    if (!withdrawal) {
        throw new NotFoundError("Withdrawal not found.", "WITHDRAWAL_NOT_FOUND")
    }
    return withdrawal
}

async function reject_withdrawal({ withdrawal_id, reviewNote, rejectionReason, actor_id, ip }) {
    const withdrawal = await withdrawalRepository.get_withdrawal_by_id_admin({ withdrawal_id})

    if (!withdrawal) throw new NotFoundError("Withdrawal not found.", "WITHDRAWAL_NOT_FOUND")
    if (withdrawal.status !== "PENDING" && withdrawal.status !== "PROCESSING") {
        throw new ValidationError("This withdrawal cannot be rejected in its current state.", "INVALID_WITHDRAWAL_STATE")
    }

    const session = await walletRepository.start_session()
    try {
        await session.withTransaction(async () => {
            const before = await walletRepository.get_wallet({ user_id: withdrawal.user })
            const balance_before = before ? before[withdrawal.currency] : 0

            const updated = await walletRepository.credit_wallet_atomic({
                user_id: withdrawal.user,
                currency: withdrawal.currency,
                amount: withdrawal.currencyAmount,
                session
            })

            await walletRepository.create_transaction({
                user_id: withdrawal.user,
                currency: withdrawal.currency,
                type: "REVERSAL",
                direction: "CREDIT",
                amount: withdrawal.currencyAmount,
                balance_before,
                balance_after: updated[withdrawal.currency],
                source: "WITHDRAWAL_REJECTED",
                reference_id: withdrawal._id,
                description: `Reversal for rejected withdrawal ${withdrawal._id}`,
                session
            })

            await withdrawalRepository.update_status({
                withdrawal_id: withdrawal._id,
                status: "REJECTED",
                rejectionReason,
                reviewNote
            })
        })

        await auditService.log_action({
            actor_id,
            action: "WITHDRAWAL_REJECTED",
            target_user_id: withdrawal.user,
            target_type: "Withdrawal",
            reference_id: withdrawal._id,
            metadata: { rejectionReason },
            ip
        })
    } finally {
        await session.endSession()
    }
}

async function approve_withdrawal({ withdrawal_id, reviewNote, actor_id, ip }) {
    const withdrawal = await withdrawalRepository.get_withdrawal_by_id_admin({ withdrawal_id })
    if (!withdrawal) throw new NotFoundError("Withdrawal not found.", "WITHDRAWAL_NOT_FOUND")
    if (withdrawal.status !== "PENDING" && withdrawal.status !== "PROCESSING") {
        throw new ValidationError("This withdrawal cannot be approved in its current state.", "INVALID_WITHDRAWAL_STATE")
    }

    const updated = await withdrawalRepository.update_status({
        withdrawal_id, status: "APPROVED", reviewNote
    })

    await auditService.log_action({
        actor_id,
        action: "WITHDRAWAL_APPROVED",
        target_user_id: withdrawal.user,
        target_type: "Withdrawal",
        reference_id: withdrawal._id,
        ip
    })

    return updated
}

async function get_all_withdrawals_admin({ page, limit, status }) {
    return withdrawalRepository.get_all_withdrawals({ page, limit, status })
}

export default {
    create_withdrawal,
    get_withdrawals,
    get_withdrawal_by_id,
    reject_withdrawal,
    approve_withdrawal,
    get_all_withdrawals_admin
}