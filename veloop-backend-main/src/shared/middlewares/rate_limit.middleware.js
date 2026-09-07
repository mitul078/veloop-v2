import rateLimit from "express-rate-limit";
import { RateLimitError } from "../errors/error_type.js";

const rate_limit_handler = (req, res, next) => {
    next(new RateLimitError("Too many requests. Please try again later.", "RATE_LIMITED"));
};

export const auth_rate_limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rate_limit_handler
});

export const register_rate_limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rate_limit_handler
});

export const withdrawal_rate_limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rate_limit_handler
});

export const wallet_mutation_rate_limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rate_limit_handler
});