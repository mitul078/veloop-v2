import { Router } from "express"
import authenticate from "../../shared/middlewares/authenticate.middleware.js"
import payoutController from "./payout.controller.js"

const router = Router()

router.get("/methods", authenticate, payoutController.get_methods)
router.get("/options/:method", authenticate, payoutController.get_options)

export default router