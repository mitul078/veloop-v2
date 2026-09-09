import { PayoutMethod, PayoutOption } from "./payout.model.js"

const CACHE_TTL_MS = 5 * 60 * 1000

let methodsCache = null
let methodsCacheExpiry = 0

let optionsCache = new Map()

async function get_all_methods() {
    if (methodsCache && Date.now() < methodsCacheExpiry) {
        return methodsCache
    }
    const methods = await PayoutMethod.find({}).sort({ createdAt: 1 }).lean()
    methodsCache = methods
    methodsCacheExpiry = Date.now() + CACHE_TTL_MS
    return methods
}

async function get_method_by_id({ methodId }) {
    const methods = await get_all_methods()
    return methods.find(m => m.methodId === methodId) || null
}

async function get_options_by_method({ methodId }) {
    const cached = optionsCache.get(methodId)
    if (cached && Date.now() < cached.expiry) {
        return cached.data
    }
    const options = await PayoutOption.find({ methodId, active: true }).sort({ payoutValue: 1 }).lean()
    optionsCache.set(methodId, { data: options, expiry: Date.now() + CACHE_TTL_MS })
    return options
}

async function get_option_by_id({ optionId }) {
    return PayoutOption.findOne({ optionId }).lean()
}

function invalidate_cache() {
    methodsCache = null
    methodsCacheExpiry = 0
    optionsCache.clear()
}

export default {
    get_all_methods,
    get_method_by_id,
    get_options_by_method,
    get_option_by_id,
    invalidate_cache
}