import mongoose from "mongoose"

const payout_method_schema = new mongoose.Schema({
    methodId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    currency: { type: String, required: true, default: "ves" },
    active: { type: Boolean, default: true },
    eligibility: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true })

const payout_option_schema = new mongoose.Schema({
    methodId: { type: String, required: true },
    optionId: { type: String, required: true, unique: true },
    payoutValue: { type: Number, required: true },
    requiredAmount: { type: Number, required: true },
    currency: { type: String, required: true, default: "ves" },
    active: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true })

//indexing

payout_method_schema.index({ methodId: 1 }, { unique: true })
payout_method_schema.index({ active: 1 })

payout_option_schema.index({ optionId: 1 }, { unique: true })
payout_option_schema.index({ methodId: 1, active: 1 })

//exports

export const PayoutMethod = mongoose.model("PayoutMethod", payout_method_schema)
export const PayoutOption = mongoose.model("PayoutOption", payout_option_schema)