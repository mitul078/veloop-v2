import { UnauthorizedError } from "../errors/error_type.js"

function require_admin(req, res, next) {
    if (req.user?.role !== "admin") {
        throw new UnauthorizedError("Admin access required.", "FORBIDDEN")
    }
    next()
}

export default require_admin