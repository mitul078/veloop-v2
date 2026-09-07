import payoutRepository from "./payout.repository.js"
import { ValidationError, NotFoundError } from "../../shared/errors/error_type.js"

async function list_methods() {
    const methods = await payoutRepository.get_all_methods()
    return methods.map(m => ({
        methodId: m.methodId,
        name: m.name,
        type: m.type,
        currency: m.currency,
        active: m.active,
        eligibility: m.eligibility
    }))
}

async function list_options({ methodId }) {
    const method_doc = await payoutRepository.get_method_by_id({ methodId })
    if (!method_doc) {
        throw new NotFoundError("Payout method not found.", "INVALID_PAYOUT_METHOD")
    }
    if (!method_doc.active) {
        throw new ValidationError("This payout method is currently unavailable.", "INACTIVE_PAYOUT_METHOD")
    }

    const options = await payoutRepository.get_options_by_method({ methodId })
    return options.map(o => ({
        optionId: o.optionId,
        payoutValue: o.payoutValue,
        requiredAmount: o.requiredAmount,
        currency: o.currency
    }))
}

async function resolve_option({ methodId, optionId }) {
    const method_doc = await payoutRepository.get_method_by_id({ methodId })
    if (!method_doc || !method_doc.active) {
        throw new ValidationError("This payout method is currently unavailable.", "INACTIVE_PAYOUT_METHOD")
    }

    const option = await payoutRepository.get_option_by_id({ optionId })
    if (!option || option.methodId !== methodId || !option.active) {
        throw new ValidationError("Selected payout option is unavailable.", "INVALID_PAYOUT_OPTION")
    }

    return {
        methodId: method_doc.methodId,
        optionId: option.optionId,
        payoutValue: option.payoutValue,
        requiredAmount: option.requiredAmount,
        currency: option.currency
    }
}

export default {
    list_methods,
    list_options,
    resolve_option
}