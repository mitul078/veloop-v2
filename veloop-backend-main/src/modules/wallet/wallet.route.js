import { Router } from "express"
import authenticate from "../../shared/middlewares/authenticate.middleware.js"
import walletController from "./wallet.controller.js"
import validate from "../../shared/middlewares/validate.middleware.js"
import walletValidation from "./wallet.validation.js"
import { wallet_mutation_rate_limiter } from "../../shared/middlewares/rate_limit.middleware.js"
import internal_only from "../../shared/middlewares/internal.middleware.js"

const router = Router()

router.get("/", authenticate, walletController.get_wallet)
router.get("/transactions", authenticate, validate(walletValidation.list_transactions_schema), walletController.get_transactions)
router.get("/summary", authenticate, walletController.get_summary)
router.post("/credit", internal_only, wallet_mutation_rate_limiter, validate(walletValidation.credit_schema), walletController.credit)
router.post("/debit", internal_only, wallet_mutation_rate_limiter, validate(walletValidation.debit_schema), walletController.debit)

export default router