import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import bcrypt from "bcryptjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const { default: mongoose } = await import("mongoose")
const { Auth } = await import("../src/modules/auth/auth.model.js")
const { Wallet, WalletTransaction } = await import("../src/modules/wallet/wallet.model.js")
const { default: env } = await import("../src/shared/config/env.js")

const DEMO_EMAIL = "demo@veloop.test"
const DEMO_PASSWORD = "Demo@12345"

async function seed() {
    await mongoose.connect(env.db.mongodb_uri)
    console.log("Connected to DB for demo user seeding")

    await Auth.deleteOne({ email: DEMO_EMAIL })

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 10)
    const demoUser = await Auth.create({
        email: DEMO_EMAIL,
        password: hashed,
        verified: true,
        role: "user"
    })

    await Wallet.deleteOne({ user: demoUser._id })
    const wallet = await Wallet.create({
        user: demoUser._id,
        ves: 25000,
        gems: 100,
        tokens: 500,
        spins: 3
    })

    await WalletTransaction.deleteMany({ user: demoUser._id })

    const sample_transactions = [
        { currency: "ves", type: "AD_REWARD", direction: "CREDIT", amount: 500, balance_before: 0, balance_after: 500, source: "WATCH_AD", description: "Watch Ad Reward" },
        { currency: "ves", type: "DAILY_REWARD", direction: "CREDIT", amount: 100, balance_before: 500, balance_after: 600, source: "DAILY_LOGIN", description: "Daily Reward" },
        { currency: "ves", type: "REFERRAL", direction: "CREDIT", amount: 2000, balance_before: 600, balance_after: 2600, source: "REFERRAL_BONUS", description: "Referral Reward" },
        { currency: "gems", type: "BONUS", direction: "CREDIT", amount: 20, balance_before: 0, balance_after: 20, source: "BONUS_EVENT", description: "Bonus Gems" },
        { currency: "ves", type: "WITHDRAWAL", direction: "DEBIT", amount: 2400, balance_before: 2600, balance_after: 200, source: "WITHDRAWAL", description: "UPI Withdrawal" },
        { currency: "ves", type: "ADMIN_CREDIT", direction: "CREDIT", amount: 24800, balance_before: 200, balance_after: 25000, source: "DEMO_SETUP", description: "Demo balance top-up" }
    ]

    for (const tx of sample_transactions) {
        await WalletTransaction.create({ user: demoUser._id, ...tx })
    }

    console.log("Demo user created:")
    console.log(`  Email: ${DEMO_EMAIL}`)
    console.log(`  Password: ${DEMO_PASSWORD}`)
    console.log(`  Wallet: ${JSON.stringify({ ves: wallet.ves, gems: wallet.gems, tokens: wallet.tokens, spins: wallet.spins })}`)
    console.log(`  Sample transactions: ${sample_transactions.length}`)

    await mongoose.disconnect()
    process.exit(0)
}

seed().catch(err => {
    console.error("Demo seed failed:", err)
    process.exit(1)
})