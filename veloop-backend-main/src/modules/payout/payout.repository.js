import { PayoutMethod, PayoutOption } from "./payout.model.js"

async function get_all_methods() {
    return PayoutMethod.find({}).sort({ createdAt: 1 })
}

async function get_method_by_id({ methodId }) {
    return PayoutMethod.findOne({ methodId })
}

async function get_options_by_method({ methodId }) {
    return PayoutOption.find({ methodId, active: true }).sort({ payoutValue: 1 })
}

async function get_option_by_id({ optionId }) {
    return PayoutOption.findOne({ optionId })
}

export default {
    get_all_methods,
    get_method_by_id,
    get_options_by_method,
    get_option_by_id
}