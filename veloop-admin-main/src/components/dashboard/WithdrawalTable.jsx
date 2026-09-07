import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Zap,
  ShoppingBag,
  Play,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { useAdminWithdrawals } from '../../context/AdminWithdrawalContext';
import EmptyState from '../common/EmptyState';
import styles from './WithdrawalTable.module.css';

function WithdrawalTable({ onApprove, onReject, onInspect, onShowToast }) {
  const {
    filteredItems,
    items,
    stats,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    searchQuery,
    setSearchQuery,
    actionLoading,
  } = useAdminWithdrawals();

  const [copiedId, setCopiedId] = useState(null);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    onShowToast?.(`Copied ${label}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodIcon = (id) => {
    switch (id) {
      case 'upi':
        return <Zap size={15} className={styles.upiIcon} />;
      case 'amazon':
        return <ShoppingBag size={15} className={styles.amazonIcon} />;
      case 'google_play':
        return <Play size={15} className={styles.gplayIcon} />;
      default:
        return <Gift size={15} className={styles.defaultIcon} />;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Requests', count: items.length },
    { id: 'PENDING', label: 'Pending', count: stats.pendingCount, badgeClass: styles.pendingPill },
    { id: 'APPROVED', label: 'Approved', count: stats.approvedCount, badgeClass: styles.approvedPill },
    { id: 'REJECTED', label: 'Rejected', count: stats.rejectedCount, badgeClass: styles.rejectedPill },
  ];

  const methodTabs = [
    { id: 'ALL', label: 'All Methods' },
    { id: 'upi', label: 'UPI' },
    { id: 'amazon', label: 'Amazon' },
    { id: 'google_play', label: 'Google Play' },
  ];

  return (
    <div className={styles.container}>
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        {/* Status Filter Tabs */}
        <div className={styles.statusTabs}>
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className={`${styles.tabCount} ${tab.badgeClass || ''}`}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className={styles.activeUnderline}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Method filter chips & Search */}
        <div className={styles.rightControls}>
          {/* Method Filter Chips */}
          <div className={styles.methodGroup}>
            {methodTabs.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`${styles.methodChip} ${
                  methodFilter === m.id ? styles.methodChipActive : ''
                }`}
                onClick={() => setMethodFilter(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search user, ID, UPI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No withdrawals match your filters"
          description="Try resetting your search query or switching to another status tab."
          actionLabel="Clear All Filters"
          onAction={() => {
            setStatusFilter('ALL');
            setMethodFilter('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Method & Option</th>
                  <th>VES Debited</th>
                  <th>Payout Amount</th>
                  <th>Destination</th>
                  <th>Date Requested</th>
                  <th>Status</th>
                  <th className={styles.alignRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((w) => {
                    const isPending = w.status === 'PENDING';
                    const isApproved = w.status === 'APPROVED';
                    const isRejected = w.status === 'REJECTED';
                    const destination =
                      w.payoutDetails?.upiId || w.payoutDetails?.email || 'N/A';

                    return (
                      <motion.tr
                        key={w._id}
                        className={styles.tableRow}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                      >
                        {/* User */}
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatarSmall}>
                              {w.user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className={styles.userText}>
                              <span className={styles.userEmailText}>
                                {w.user?.email || 'N/A'}
                              </span>
                              <span className={styles.idSubText}>
                                ID: {w._id ? w._id.slice(-6) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Method & Option */}
                        <td>
                          <div className={styles.methodCell}>
                            <div className={styles.methodIconBadge}>
                              {getMethodIcon(w.method)}
                            </div>
                            <div className={styles.methodText}>
                              <span className={styles.methodTitle}>
                                {w.method?.toUpperCase()}
                              </span>
                              <span className={styles.optionPill}>
                                {w.optionId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* VES Debited */}
                        <td>
                          <span className={styles.vesAmount}>
                            {w.currencyAmount?.toLocaleString()} VES
                          </span>
                        </td>

                        {/* Payout Amount */}
                        <td>
                          <div className={styles.payoutCell}>
                            <span className={styles.payoutAmountText}>
                              ₹{w.payoutAmount}
                            </span>
                            <span className={styles.payoutCurrencyTag}>INR</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td>
                          <div className={styles.destinationCell}>
                            <span className={styles.destinationText} title={destination}>
                              {destination}
                            </span>
                            <button
                              type="button"
                              className={styles.miniCopyBtn}
                              onClick={() => copyText(destination, 'destination')}
                              title="Copy Destination"
                            >
                              {copiedId === destination ? (
                                <Check size={12} className={styles.greenCheck} />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Date Requested */}
                        <td>
                          <span className={styles.dateText}>
                            {formatDate(w.requestedAt || w.createdAt)}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`${styles.statusPill} ${
                              isApproved
                                ? styles.statusApproved
                                : isPending
                                ? styles.statusPending
                                : styles.statusRejected
                            }`}
                          >
                            {isApproved && <CheckCircle2 size={12} />}
                            {isPending && <Clock size={12} />}
                            {isRejected && <XCircle size={12} />}
                            <span>{w.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className={styles.alignRight}>
                          <div className={styles.actionButtonsRow}>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  className={styles.approveBtn}
                                  onClick={() => onApprove(w)}
                                  disabled={actionLoading}
                                  title="Approve Withdrawal"
                                >
                                  <Check size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.rejectBtn}
                                  onClick={() => onReject(w)}
                                  disabled={actionLoading}
                                  title="Reject Withdrawal"
                                >
                                  <X size={13} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className={styles.inspectBtn}
                              onClick={() => onInspect(w)}
                              title="Inspect Full Ticket Audit"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={styles.mobileList}>
            {filteredItems.map((w) => {
              const isPending = w.status === 'PENDING';
              const isApproved = w.status === 'APPROVED';
              const isRejected = w.status === 'REJECTED';
              const destination =
                w.payoutDetails?.upiId || w.payoutDetails?.email || 'N/A';

              return (
                <div key={w._id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatarSmall}>
                        {w.user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className={styles.userEmailText}>{w.user?.email}</span>
                    </div>
                    <span
                      className={`${styles.statusPill} ${
                        isApproved
                          ? styles.statusApproved
                          : isPending
                          ? styles.statusPending
                          : styles.statusRejected
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>

                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Method:</span>
                      <div className={styles.methodPillInline}>
                        {getMethodIcon(w.method)}
                        <span>{w.method.toUpperCase()} ({w.optionId})</span>
                      </div>
                    </div>

                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Payout:</span>
                      <span className={styles.payoutAmountText}>
                        ₹{w.payoutAmount} INR{' '}
                        <span className={styles.vesText}>
                          ({w.currencyAmount?.toLocaleString()} VES)
                        </span>
                      </span>
                    </div>

                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Destination:</span>
                      <div className={styles.destinationCell}>
                        <span className={styles.destinationText}>{destination}</span>
                        <button
                          type="button"
                          className={styles.miniCopyBtn}
                          onClick={() => copyText(destination, 'destination')}
                        >
                          {copiedId === destination ? (
                            <Check size={12} className={styles.greenCheck} />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={styles.mobileRow}>
                      <span className={styles.mobileLabel}>Date:</span>
                      <span className={styles.dateText}>
                        {formatDate(w.requestedAt || w.createdAt)}
                      </span>
                    </div>

                    {isRejected && w.rejectionReason && (
                      <div className={styles.mobileRejectReason}>
                        <span>Reason: {w.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.mobileCardFooter}>
                    <button
                      type="button"
                      className={styles.mobileInspectBtn}
                      onClick={() => onInspect(w)}
                    >
                      <Eye size={14} />
                      <span>Audit Ticket</span>
                    </button>

                    {isPending && (
                      <div className={styles.mobilePendingActions}>
                        <button
                          type="button"
                          className={styles.rejectBtn}
                          onClick={() => onReject(w)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className={styles.approveBtn}
                          onClick={() => onApprove(w)}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default WithdrawalTable;
