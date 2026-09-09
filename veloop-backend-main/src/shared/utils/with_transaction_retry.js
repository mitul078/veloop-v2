async function with_transaction_retry(session, fn, { maxRetries = 3 } = {}) {
    let attempt = 0

    while (true) {
        try {
            return await session.withTransaction(fn)
        } catch (error) {
            const isTransient =
                error.errorLabels?.includes("TransientTransactionError") ||
                error.errorLabels?.includes("UnknownTransactionCommitResult")

            attempt++

            if (!isTransient || attempt >= maxRetries) {
                throw error
            }

            await new Promise(resolve => setTimeout(resolve, 50 * attempt))
        }
    }
}

export default with_transaction_retry