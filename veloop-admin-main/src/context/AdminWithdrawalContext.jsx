import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import api from '../lib/axios';

const AdminWithdrawalContext = createContext(null);

export function AdminWithdrawalProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/withdrawals/admin/all', { params });
      setItems(res.data.data.items || []);
    } catch (err) {
      console.error('Failed to load admin withdrawals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
    // Refetch whenever the backend-supported status filter changes —
    // method filter and search stay client-side (see filteredItems below)
  }, [statusFilter]);

  const approveWithdrawal = async (id, reviewNote = 'Approved by admin.') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/withdrawals/${id}/approve`, { reviewNote });
      await loadWithdrawals(); // refetch — don't trust local patching
      return { success: true, message: res.data.message, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Approve failed.' };
    } finally {
      setActionLoading(false);
    }
  };

  const rejectWithdrawal = async (id, rejectionReason, reviewNote = '') => {
    setActionLoading(true);
    try {
      const res = await api.post(`/withdrawals/${id}/reject`, { rejectionReason, reviewNote });
      await loadWithdrawals(); // refetch
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Reject failed.' };
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = items.filter((w) => w.status === 'PENDING');
    const approved = items.filter((w) => w.status === 'APPROVED');
    const rejected = items.filter((w) => w.status === 'REJECTED');

    return {
      pendingCount: pending.length,
      pendingTotalInr: pending.reduce((sum, w) => sum + (w.payoutAmount || 0), 0),
      pendingTotalVes: pending.reduce((sum, w) => sum + (w.currencyAmount || 0), 0),
      approvedCount: approved.length,
      approvedTotalInr: approved.reduce((sum, w) => sum + (w.payoutAmount || 0), 0),
      approvedTotalVes: approved.reduce((sum, w) => sum + (w.currencyAmount || 0), 0),
      rejectedCount: rejected.length,
      rejectedTotalInr: rejected.reduce((sum, w) => sum + (w.payoutAmount || 0), 0),
      totalProcessedVolumeInr: approved.reduce((sum, w) => sum + (w.payoutAmount || 0), 0),
      totalRequestsCount: items.length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (methodFilter !== 'ALL' && item.method !== methodFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const userEmail = item.user?.email?.toLowerCase() || '';
        const transactionId = item.transactionId?.toLowerCase() || '';
        const id = item._id?.toLowerCase() || '';
        const upiId = item.payoutDetails?.upiId?.toLowerCase() || '';
        const payoutEmail = item.payoutDetails?.email?.toLowerCase() || '';
        const optionId = item.optionId?.toLowerCase() || '';

        const matches =
          userEmail.includes(query) || transactionId.includes(query) ||
          id.includes(query) || upiId.includes(query) ||
          payoutEmail.includes(query) || optionId.includes(query);

        if (!matches) return false;
      }
      return true;
    });
  }, [items, methodFilter, searchQuery]);

  return (
    <AdminWithdrawalContext.Provider
      value={{
        items,
        filteredItems,
        stats,
        loading,
        statusFilter,
        setStatusFilter,
        methodFilter,
        setMethodFilter,
        searchQuery,
        setSearchQuery,
        actionLoading,
        approveWithdrawal,
        rejectWithdrawal,
        refresh: loadWithdrawals,
        resetToMockData: loadWithdrawals,
      }}
    >
      {children}
    </AdminWithdrawalContext.Provider>
  );
}

export function useAdminWithdrawals() {
  const context = useContext(AdminWithdrawalContext);
  if (!context) {
    throw new Error('useAdminWithdrawals must be used within an AdminWithdrawalProvider');
  }
  return context;
}