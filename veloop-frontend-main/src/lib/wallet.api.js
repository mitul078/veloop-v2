import api from './axios'

export async function fetchWallet() {
  const res = await api.get('/wallet')
  return res.data.data
}

export async function fetchWalletSummary() {
  const res = await api.get('/wallet/summary')
  return res.data.data
}

export async function fetchTransactions(params = {}) {
  const res = await api.get('/wallet/transactions', { params })
  return res.data.data
}