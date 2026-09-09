import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import env from "./shared/config/env.js";
import { req_logger } from "./shared/middlewares/req_logger.js";
import { error_handler, not_found_handler } from "./shared/middlewares/error.middleware.js";
import { authRoutes } from "./modules/auth/index.js";
import { walletRoutes } from "./modules/wallet/index.js";
import { payoutRoutes } from "./modules/payout/index.js";
import { withdrawalRoutes } from "./modules/withdrawal/index.js";

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(compression())
app.use(cors({
    origin: [env.frontendUrl, "http://localhost:5173", "http://localhost:5174", env.adminFrontendUrl],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-internal-key"]
}))
app.use(express.json())
app.use(cookieParser())
app.use(req_logger)

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "OK" })
})

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/wallet", walletRoutes)
app.use("/api/v1/payout", payoutRoutes)
app.use("/api/v1/withdrawals", withdrawalRoutes)

app.use(not_found_handler)
app.use(error_handler)

export default app