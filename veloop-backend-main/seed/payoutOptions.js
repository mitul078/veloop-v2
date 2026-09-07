import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env") })


// Only import env.js and anything that depends on it AFTER dotenv.config() has run
const { default: mongoose } = await import("mongoose")
const { PayoutMethod, PayoutOption } = await import("../src/modules/payout/payout.model.js")
const { default: env } = await import("../src/shared/config/env.js")

const methods = [
    { methodId: "upi", name: "UPI Transfer", type: "bank_transfer", currency: "ves", active: true, eligibility: {} },
    { methodId: "amazon", name: "Amazon Gift Card", type: "gift_card", currency: "ves", active: true, eligibility: {} },
    { methodId: "google_play", name: "Google Play Gift Card", type: "gift_card", currency: "ves", active: true, eligibility: {} },
    { methodId: "paypal", name: "PayPal", type: "bank_transfer", currency: "ves", active: false, eligibility: { note: "Currently unavailable in your region" } }
]

const upi_options = [
    { optionId: "upi_10", payoutValue: 10, requiredAmount: 2400 },
    { optionId: "upi_25", payoutValue: 25, requiredAmount: 5800 },
    { optionId: "upi_50", payoutValue: 50, requiredAmount: 10000 },
    { optionId: "upi_100", payoutValue: 100, requiredAmount: 19500 },
    { optionId: "upi_150", payoutValue: 150, requiredAmount: 28500 },
    { optionId: "upi_300", payoutValue: 300, requiredAmount: 52500 },
    { optionId: "upi_500", payoutValue: 500, requiredAmount: 80500 },
    { optionId: "upi_1000", payoutValue: 1000, requiredAmount: 150000 }
]

const amazon_options = [
    { optionId: "amazon_50", payoutValue: 50, requiredAmount: 10000 },
    { optionId: "amazon_100", payoutValue: 100, requiredAmount: 19500 },
    { optionId: "amazon_250", payoutValue: 250, requiredAmount: 46000 }
]

const google_play_options = [
    { optionId: "gplay_50", payoutValue: 50, requiredAmount: 10000 },
    { optionId: "gplay_100", payoutValue: 100, requiredAmount: 19500 },
    { optionId: "gplay_250", payoutValue: 250, requiredAmount: 46000 }
]

const all_options = [
    ...upi_options.map(o => ({ ...o, methodId: "upi", currency: "ves", active: true })),
    ...amazon_options.map(o => ({ ...o, methodId: "amazon", currency: "ves", active: true })),
    ...google_play_options.map(o => ({ ...o, methodId: "google_play", currency: "ves", active: true }))
]

async function seed() {
    await mongoose.connect(env.db.mongodb_uri)
    console.log("Connected to DB for seeding")

    await PayoutMethod.deleteMany({})
    await PayoutOption.deleteMany({})

    await PayoutMethod.insertMany(methods)
    await PayoutOption.insertMany(all_options)

    console.log(`Seeded ${methods.length} payout methods and ${all_options.length} payout options`)
    await mongoose.disconnect()
    process.exit(0)
}

seed().catch(err => {
    console.error("Seed failed:", err)
    process.exit(1)
})