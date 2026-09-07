import { Router } from "express"
import authenticate from "../../shared/middlewares/authenticate.middleware.js"
import validate from "../../shared/middlewares/validate.middleware.js"
import withdrawalController from "./withdrawal.controller.js"
import withdrawalValidation from "./withdrawal.validation.js"
import { withdrawal_rate_limiter } from "../../shared/middlewares/rate_limit.middleware.js"
import require_admin from "../../shared/middlewares/role.middleware.js"

const router = Router()

router.post("/", authenticate, withdrawal_rate_limiter, validate(withdrawalValidation.create_withdrawal_schema), withdrawalController.create)
router.get("/", authenticate, validate(withdrawalValidation.list_withdrawals_schema), withdrawalController.list)
router.get("/:id", authenticate, validate(withdrawalValidation.get_withdrawal_schema), withdrawalController.get_by_id)
router.post("/:id/approve", authenticate, require_admin, withdrawalController.admin_approve)
router.post("/:id/reject", authenticate, require_admin, withdrawalController.admin_reject)
router.get("/admin/all", authenticate, require_admin, withdrawalController.admin_list)

export default router