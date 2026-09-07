import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { fetchWalletSummary, fetchTransactions } from '../lib/wallet.api';
import { fetchPayoutMethods, fetchPayoutOptions, fetchWithdrawals, createWithdrawal, getPayoutDetailFields } from '../lib/payout.api';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, txRes, methodsRes, wListRes] = await Promise.all([
        fetchWalletSummary(),
        fetchTransactions(),
        fetchPayoutMethods(),
        fetchWithdrawals(),
      ]);

      setSummary(sum);
      setTransactions(txRes.items || []);
      setPayoutMethods(methodsRes.methods || []);
      setWithdrawals(wListRes.items || []);
    } catch (err) {
      console.error('[WalletContext] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      let matchesFilter = true;
      if (filter === 'CREDIT') matchesFilter = tx.direction === 'CREDIT';
      else if (filter === 'DEBIT') matchesFilter = tx.direction === 'DEBIT';
      else if (filter === 'ves') matchesFilter = tx.currency === 'ves';
      else if (filter === 'gems') matchesFilter = tx.currency === 'gems';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.description.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.source.toLowerCase().includes(q) ||
        (tx.reference_id && String(tx.reference_id).toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchQuery]);

  const submitWithdrawal = async (payload) => {
    const res = await createWithdrawal(payload);
    if (res.success && res.data) {
      await loadData();
    }
    return res;
  };

  return (
    <WalletContext.Provider
      value={{
        summary,
        transactions,
        filteredTransactions,
        payoutMethods,
        withdrawals,
        loading,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        fetchPayoutOptions,
        getPayoutDetailFields,
        submitWithdrawal,
        refreshWallet: loadData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}