import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Check,
  Zap,
  ShoppingBag,
  Play,
  Gift,
} from 'lucide-react';
import { useAdminWithdrawals } from '../../context/AdminWithdrawalContext';
import styles from './RejectModal.module.css';

const REJECTION_PRESETS = [
  "Invalid payout details provided.",
  "Suspicious activity detected on this account.",
  "Duplicate withdrawal request.",
  "Unable to verify user identity.",
  "Other (specify below)"
];

function RejectModal({ withdrawal, isOpen, onClose, onConfirm }) {
  const { actionLoading } = useAdminWithdrawals();

  const [selectedPreset, setSelectedPreset] = useState(REJECTION_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(REJECTION_PRESETS[0]);
      setCustomReason('');
      setReviewNote('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !withdrawal) return null;

  const isOther = selectedPreset === 'Other (specify below)';

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalReason = isOther ? customReason.trim() : selectedPreset;

    if (!finalReason) {
      setErrorMsg('Please select or specify a valid rejection reason.');
      return;
    }

    onConfirm(withdrawal._id, finalReason, reviewNote.trim());
  };

  const getMethodIcon = (id) => {
    switch (id) {
      case 'upi':
        return <Zap size={14} className={styles.upiIcon} />;
      case 'amazon':
        return <ShoppingBag size={14} className={styles.amazonIcon} />;
      case 'google_play':
        return <Play size={14} className={styles.gplayIcon} />;
      default:
        return <Gift size={14} className={styles.defaultIcon} />;
    }
  };

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
          <div className={styles.header}>
            <div className={styles.headerIconWrap}>
              <AlertTriangle size={18} className={styles.warnIcon} />
            </div>
            <div className={styles.headerTitleWrap}>
              <h3 className={styles.title}>Reject Withdrawal Request</h3>
              <p className={styles.subtitle}>
                Specify why this payout request is being declined
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.ticketSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>User Email</span>
              <span className={styles.summaryValue}>{withdrawal.user?.email}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Payout Amount</span>
              <span className={styles.summaryValueHighlight}>
                ₹{withdrawal.payoutAmount} INR
                <span className={styles.vesPill}>
                  ({withdrawal.currencyAmount?.toLocaleString()} VES)
                </span>
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Method</span>
              <span className={styles.methodPill}>
                {getMethodIcon(withdrawal.method)}
                <span>{withdrawal.method?.toUpperCase()}</span>
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Destination</span>
              <span className={styles.destinationVal}>
                {withdrawal.payoutDetails?.upiId || withdrawal.payoutDetails?.email || 'N/A'}
              </span>
            </div>
          </div>

          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Select Rejection Reason Preset
              </label>
              <div className={styles.presetList}>
                {REJECTION_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.presetOption} ${
                        isSelected ? styles.presetSelected : ''
                      }`}
                      onClick={() => setSelectedPreset(preset)}
                    >
                      <div className={styles.radioDot}>
                        {isSelected && <Check size={11} />}
                      </div>
                      <span className={styles.presetText}>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isOther && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Custom Reason <span className={styles.reqStar}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Explain reason for rejection..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Internal Admin Note</label>
                <span className={styles.optionalTag}>Optional</span>
              </div>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. User notified via support desk"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.confirmBtn}
                disabled={actionLoading}
              >
                {actionLoading ? 'Declining...' : 'Confirm & Reject'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default RejectModal;