import api from './axios'
import { dummyPayoutDetailFields } from '../utils/dummyData'

export async function fetchPayoutMethods() {
  const res = await api.get('/payout/methods')
  return res.data.data
}

export async function fetchPayoutOptions(methodId) {
  const res = await api.get(`/payout/options/${methodId}`)
  return res.data.data
}

export async function fetchWithdrawals(params = {}) {
  const res = await api.get('/withdrawals', { params })
  return res.data.data
}


export function getPayoutDetailFields(methodId) {
  return dummyPayoutDetailFields[methodId] || []
}

export async function createWithdrawal(payload) {
  try {
    const res = await api.post('/withdrawals', payload)
    return {
      success: true,
      data: res.data.data,
      message: res.data.message || 'Withdrawal request submitted successfully!'
    }
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message,
      code: err.response?.data?.code
    }
  }
}