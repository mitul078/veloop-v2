import ApiResponse from "../../shared/utils/api_response.js"
import payoutService from "./payout.service.js"

async function get_methods(req, res, next) {
    try {
        const methods = await payoutService.list_methods()
        return res.status(200).json(new ApiResponse({ methods }, "PAYOUT METHODS FETCHED"))
    } catch (error) {
        next(error)
    }
}

async function get_options(req, res, next) {
    try {
        const { method } = req.params
        const options = await payoutService.list_options({ methodId: method })
        return res.status(200).json(new ApiResponse({ options }, "PAYOUT OPTIONS FETCHED"))
    } catch (error) {
        next(error)
    }
}

export default { get_methods, get_options }