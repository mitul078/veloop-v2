import { z } from "zod"

const create_withdrawal_schema = z.object({
    body: z.object({
        method: z.string().min(1, "METHOD REQUIRED"),
        optionId: z.string().min(1, "OPTION ID REQUIRED"),
        payoutDetails: z.record(z.any()).refine(val => Object.keys(val).length > 0, {
            message: "PAYOUT DETAILS REQUIRED"
        }),
        idempotency_key: z.string().optional()
    })
})

const list_withdrawals_schema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(50).optional().default(20),
        status: z.enum(["PENDING", "PROCESSING", "APPROVED", "REJECTED", "CANCELLED"]).optional()
    })
})

const get_withdrawal_schema = z.object({
    params: z.object({
        id: z.string().min(1, "WITHDRAWAL ID REQUIRED")
    })
})

export default {
    create_withdrawal_schema,
    list_withdrawals_schema,
    get_withdrawal_schema
}
