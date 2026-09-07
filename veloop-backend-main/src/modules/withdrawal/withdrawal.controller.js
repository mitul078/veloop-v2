import ApiResponse from "../../shared/utils/api_response.js"
import withdrawalService from "./withdrawal.service.js"

async function create(req, res, next) {
    try {
        const { method, optionId, payoutDetails, idempotency_key } = req.body
        const withdrawal = await withdrawalService.create_withdrawal({
            user_id: req.user.id,
            method,
            optionId,
            payoutDetails,
            idempotency_key,
            ip: req.ip
        })
        return res.status(201).json(new ApiResponse(withdrawal, "WITHDRAWAL SUBMITTED SUCCESSFULLY"))
    } catch (error) {
        next(error)
    }
}

async function list(req, res, next) {
    try {
        const { page, limit, status } = req.query
        const data = await withdrawalService.get_withdrawals({ user_id: req.user.id, page, limit, status })
        return res.status(200).json(new ApiResponse(data, "WITHDRAWALS FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function get_by_id(req, res, next) {
    try {
        const { id } = req.params
        const withdrawal = await withdrawalService.get_withdrawal_by_id({ withdrawal_id: id, user_id: req.user.id })
        return res.status(200).json(new ApiResponse(withdrawal, "WITHDRAWAL FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function admin_approve(req, res, next) {
    try {
        const { id } = req.params
        const { reviewNote } = req.body
        const result = await withdrawalService.approve_withdrawal({
            withdrawal_id: id, reviewNote, actor_id: req.user.id, ip: req.ip
        })
        return res.status(200).json(new ApiResponse(result, "WITHDRAWAL APPROVED"))
    } catch (error) {
        next(error)
    }
}

async function admin_reject(req, res, next) {
    try {
        const { id } = req.params
        const { rejectionReason, reviewNote } = req.body
        const result = await withdrawalService.reject_withdrawal({
            withdrawal_id: id, rejectionReason, reviewNote, actor_id: req.user.id, ip: req.ip
        })
        return res.status(200).json(new ApiResponse(result, "WITHDRAWAL REJECTED"))
    } catch (error) {
        next(error)
    }
}

async function admin_list(req, res, next) {
    try {
        const { page, limit, status } = req.query
        const data = await withdrawalService.get_all_withdrawals_admin({ page, limit, status })
        return res.status(200).json(new ApiResponse(data, "ALL WITHDRAWALS FETCHED"))
    } catch (error) {
        next(error)
    }
}

export default {
    create,
    list,
    get_by_id,
    admin_approve,
    admin_reject,
    admin_list
}