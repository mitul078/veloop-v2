import ApiResponse from "../../shared/utils/api_response.js"
import walletService from "./wallet.service.js"

async function get_wallet(req, res, next) {
    try {
        const wallet = await walletService.get_wallet({ user_id: req.user.id })
        return res.status(200).json(new ApiResponse(wallet, "WALLET FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function get_transactions(req, res, next) {
    try {
        const { page, limit, currency, type } = req.query
        const data = await walletService.get_transactions({ user_id: req.user.id, page, limit, currency, type })
        return res.status(200).json(new ApiResponse(data, "TRANSACTIONS FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function get_summary(req, res, next) {
    try {
        const summary = await walletService.get_summary({ user_id: req.user.id })
        return res.status(200).json(new ApiResponse(summary, "SUMMARY FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function credit(req, res, next) {
    try {
        const result = await walletService.credit_wallet({ ...req.body, ip: req.ip })
        return res.status(201).json(new ApiResponse(result, "WALLET CREDITED"))
    } catch (error) {
        next(error)
    }
}

async function debit(req, res, next) {
    try {
        const result = await walletService.debit_wallet({ ...req.body, ip: req.ip })
        return res.status(201).json(new ApiResponse(result, "WALLET DEBITED"))
    } catch (error) {
        next(error)
    }
}

export default {
    get_wallet,
    get_transactions,
    get_summary,
    credit,
    debit
}

