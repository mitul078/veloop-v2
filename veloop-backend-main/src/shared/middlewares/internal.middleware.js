import { UnauthorizedError } from "../errors/error_type.js"
import env from "../config/env.js"

function internal_only(req, res, next) {
    const provided_key = req.headers["x-internal-key"]

    if (!provided_key || provided_key !== env.internal_service_key) {
        throw new UnauthorizedError("This endpoint is not accessible.", "FORBIDDEN")
    }

    next()
}

export default internal_only