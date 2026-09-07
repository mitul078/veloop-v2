import { z } from "zod"

const list_transactions_schema = z.object({
    query: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(50).optional().default(20),
        currency: z.enum(["ves", "gems", "tokens", "spins"]).optional(),
        type: z.string().optional()
    })
})

const credit_schema = z.object({
    body: z.object({
        user_id: z.string().min(1, "USER ID REQUIRED"),
        currency: z.enum(["ves", "gems", "tokens", "spins"]),
        amount: z.number().positive("AMOUNT MUST BE POSITIVE"),
        type: z.string().min(1, "TYPE REQUIRED"),
        source: z.string().min(1, "SOURCE REQUIRED"),
        description: z.string().optional(),
        reference_id: z.string().optional(),
        idempotency_key: z.string().optional()
    })
})

const debit_schema = z.object({
    body: z.object({
        user_id: z.string().min(1, "USER ID REQUIRED"),
        currency: z.enum(["ves", "gems", "tokens", "spins"]),
        amount: z.number().positive("AMOUNT MUST BE POSITIVE"),
        type: z.string().min(1, "TYPE REQUIRED"),
        source: z.string().min(1, "SOURCE REQUIRED"),
        description: z.string().optional(),
        reference_id: z.string().optional(),
        idempotency_key: z.string().optional()
    })
})

export default { list_transactions_schema, credit_schema, debit_schema }