import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { useAdminWithdrawals } from '../context/AdminWithdrawalContext';
import StatsOverview from '../components/dashboard/StatsOverview';
import WithdrawalTable from '../components/dashboard/WithdrawalTable';
import RejectModal from '../components/dashboard/RejectModal';
import DetailsModal from '../components/dashboard/DetailsModal';
import styles from './AdminDashboardPage.module.css';

function AdminDashboardPage({ onShowToast }) {
  const {
    approveWithdrawal,
    rejectWithdrawal,
    setStatusFilter,
    stats,
  } = useAdminWithdrawals();

  // Modals state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [inspectTarget, setInspectTarget] = useState(null);

  // Approve handler
  const handleApprove = async (withdrawal) => {
    try {
      const res = await approveWithdrawal(withdrawal._id);
      if (res.success) {
        onShowToast?.(
          `Approved withdrawal of ₹${withdrawal.payoutAmount} for ${withdrawal.user?.email}`,
          'success'
        );
      }
    } catch (err) {
      onShowToast?.('Failed to approve withdrawal.', 'error');
    }
  };

  // Open reject modal
  const handleOpenReject = (withdrawal) => {
    setRejectTarget(withdrawal);
  };

  // Confirm rejection from modal
  const handleConfirmReject = async (id, reason, reviewNote) => {
    try {
      const res = await rejectWithdrawal(id, reason, reviewNote);
      if (res.success) {
        onShowToast?.(`Withdrawal marked as rejected.`, 'error');
        setRejectTarget(null);
      }
    } catch (err) {
      onShowToast?.('Failed to reject withdrawal.', 'error');
    }
  };

  // Inspect handler
  const handleInspect = (withdrawal) => {
    setInspectTarget(withdrawal);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Welcome & Overview Header */}
        <section className={styles.headerSection}>
          <motion.div
            className={styles.headerContent}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className={styles.titleRow}>
              <div className={styles.titleBadge}>
                <Layers size={13} />
                <span>Withdrawal Moderation Console</span>
              </div>
            </div>

            <div className={styles.headlineRow}>
              <div>
                <h1 className={styles.pageTitle}>Review & Payout Queue</h1>
                <p className={styles.pageDescription}>
                  Verify user withdrawal tickets, process disbursements, or decline invalid submissions with preset reasons.
                </p>
              </div>

              {stats.pendingCount > 0 && (
                <div
                  className={styles.pendingAlertBox}
                  onClick={() => setStatusFilter('PENDING')}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.pulseDot} />
                  <div className={styles.alertTextWrap}>
                    <span className={styles.alertTitle}>
                      {stats.pendingCount} Pending Reviews
                    </span>
                    <span className={styles.alertSub}>
                      ₹{stats.pendingTotalInr.toLocaleString()} awaiting moderation
                    </span>
                  </div>
                  <ArrowUpRight size={16} className={styles.alertArrow} />
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* 4 Stats Cards */}
        <StatsOverview onSelectStatus={(status) => setStatusFilter(status)} />

        {/* Withdrawals Management Table */}
        <WithdrawalTable
          onApprove={handleApprove}
          onReject={handleOpenReject}
          onInspect={handleInspect}
          onShowToast={onShowToast}
        />
      </div>

      {/* Reject Modal Dialog */}
      <RejectModal
        withdrawal={rejectTarget}
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Details / Inspection Modal */}
      <DetailsModal
        withdrawal={inspectTarget}
        isOpen={Boolean(inspectTarget)}
        onClose={() => setInspectTarget(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
}

export default AdminDashboardPage;
