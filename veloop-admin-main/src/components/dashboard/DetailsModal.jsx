import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Code2,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import styles from './DetailsModal.module.css';

function DetailsModal({ withdrawal, isOpen, onClose, onShowToast }) {
  const [copiedField, setCopiedField] = useState(null);
  const [showJson, setShowJson] = useState(false);

  if (!isOpen || !withdrawal) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onShowToast?.(`Copied ${fieldName}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not processed yet';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const isPending = withdrawal.status === 'PENDING';
  const isApproved = withdrawal.status === 'APPROVED';

  return (
    <AnimatePresence>
      <div className={styles.backdrop} onClick={onClose}>
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleWrap}>
              <div className={styles.headerBadgeRow}>
                <span className={styles.headerTag}>Withdrawal Audit Ticket</span>
                <span
                  className={`${styles.statusBadge} ${
                    isApproved
                      ? styles.statusApproved
                      : isPending
                      ? styles.statusPending
                      : styles.statusRejected
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>
              <h3 className={styles.ticketId}>ID: {withdrawal._id}</h3>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Info Cards */}
          <div className={styles.infoSection}>
            {/* User Details */}
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <User size={15} className={styles.cardIcon} />
                <span className={styles.cardTitle}>User Account</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Email</span>
                <span className={styles.detailValHighlight}>
                  {withdrawal.user?.email || 'N/A'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>User ID</span>
                <span className={styles.detailValMono}>
                  {withdrawal.user?._id || 'N/A'}
                </span>
              </div>
            </div>

            {/* Payout Details */}
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <CreditCard size={15} className={styles.cardIcon} />
                <span className={styles.cardTitle}>Disbursement Details</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Method</span>
                <span className={styles.methodName}>
                  {withdrawal.method?.toUpperCase()} ({withdrawal.optionId})
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Payout Amount</span>
                <span className={styles.amountPill}>
                  ₹{withdrawal.payoutAmount} INR
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Debited VES</span>
                <span className={styles.vesText}>
                  {withdrawal.currencyAmount?.toLocaleString()} VES
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Destination</span>
                <div className={styles.copyableDest}>
                  <span className={styles.detailValMono}>
                    {withdrawal.payoutDetails?.upiId ||
                      withdrawal.payoutDetails?.email ||
                      'N/A'}
                  </span>
                  <button
                    type="button"
                    className={styles.copyIconBtn}
                    onClick={() =>
                      copyToClipboard(
                        withdrawal.payoutDetails?.upiId ||
                          withdrawal.payoutDetails?.email ||
                          '',
                        'Destination'
                      )
                    }
                    title="Copy Destination"
                  >
                    {copiedField === 'Destination' ? (
                      <Check size={13} className={styles.greenCheck} />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Timestamps & Lifecycle */}
            <div className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <Calendar size={15} className={styles.cardIcon} />
                <span className={styles.cardTitle}>Lifecycle Timestamps</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Requested At</span>
                <span className={styles.detailVal}>
                  {formatDate(withdrawal.requestedAt || withdrawal.createdAt)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Processed At</span>
                <span className={styles.detailVal}>
                  {formatDate(withdrawal.processedAt)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailKey}>Transaction ID</span>
                <div className={styles.copyableDest}>
                  <span className={styles.detailValMono}>
                    {withdrawal.transactionId || 'N/A'}
                  </span>
                  {withdrawal.transactionId && (
                    <button
                      type="button"
                      className={styles.copyIconBtn}
                      onClick={() =>
                        copyToClipboard(withdrawal.transactionId, 'Transaction ID')
                      }
                      title="Copy Transaction ID"
                    >
                      {copiedField === 'Transaction ID' ? (
                        <Check size={13} className={styles.greenCheck} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Notes / Rejection Reason */}
            {(withdrawal.reviewNote || withdrawal.rejectionReason) && (
              <div className={styles.auditCard}>
                <div className={styles.cardHeader}>
                  <FileCheck size={15} className={styles.cardIcon} />
                  <span className={styles.cardTitle}>Admin Audit Notes</span>
                </div>
                {withdrawal.rejectionReason && (
                  <div className={styles.rejectNotice}>
                    <AlertCircle size={15} />
                    <span>
                      <strong>Rejection Reason:</strong> {withdrawal.rejectionReason}
                    </span>
                  </div>
                )}
                {withdrawal.reviewNote && (
                  <div className={styles.reviewNoteRow}>
                    <span className={styles.detailKey}>Review Note</span>
                    <span className={styles.detailVal}>
                      {withdrawal.reviewNote}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Raw JSON viewer toggle */}
          <div className={styles.rawJsonSection}>
            <button
              type="button"
              className={styles.jsonToggleBtn}
              onClick={() => setShowJson(!showJson)}
            >
              <Code2 size={14} />
              <span>{showJson ? 'Hide Raw JSON' : 'Inspect Raw JSON Payload'}</span>
            </button>

            {showJson && (
              <pre className={styles.jsonBlock}>
                {JSON.stringify(withdrawal, null, 2)}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DetailsModal;
