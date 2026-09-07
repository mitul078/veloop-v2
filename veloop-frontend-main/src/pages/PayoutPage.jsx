import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  Zap,
  Gift,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import styles from './PayoutPage.module.css';

function PayoutPage({ onNavigateToWallet, onShowToast }) {
  const {
    summary,
    payoutMethods,
    withdrawals,
    fetchPayoutOptions,
    getPayoutDetailFields,
    submitWithdrawal,
    loading,
  } = useWallet();

  const [selectedMethodId, setSelectedMethodId] = useState('upi');
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    async function loadOptions() {
      const res = await fetchPayoutOptions(selectedMethodId);
      const optList = res.options || [];
      setOptions(optList);
      if (optList.length > 0) {
        setSelectedOption(optList[0]);
      } else {
        setSelectedOption(null);
      }
      setFormData({});
      setValidationError('');
    }
    loadOptions();
  }, [selectedMethodId]);

  if (loading && !summary) {
    return <Loader message="Loading payout options..." />;
  }

  const currentMethod = payoutMethods.find((m) => m.methodId === selectedMethodId);
  const detailFields = getPayoutDetailFields(selectedMethodId);
  const userVesBalance = summary?.ves || 0;

  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!currentMethod || !currentMethod.active) {
      setValidationError('This payout method is currently unavailable.');
      return;
    }

    if (!selectedOption) {
      setValidationError('Please select a payout denomination.');
      return;
    }

    if (userVesBalance < selectedOption.requiredAmount) {
      setValidationError(
        `Insufficient VES balance. You have ${userVesBalance.toLocaleString()} VES, but ${selectedOption.requiredAmount.toLocaleString()} VES is required for this withdrawal.`
      );
      return;
    }

    for (const field of detailFields) {
      if (field.required && !formData[field.name]?.trim()) {
        setValidationError(`Please enter your ${field.label}.`);
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      method: selectedMethodId,
      optionId: selectedOption.optionId,
      payoutDetails: formData,
      idempotency_key: `${selectedMethodId}-${selectedOption.optionId}-${Date.now()}`
    };

    const result = await submitWithdrawal(payload);
    setSubmitting(false);

    if (result.success) {
      setSuccessData(result.data);
      onShowToast?.('Withdrawal request submitted successfully!', 'success');
    } else {
      setValidationError(result.message || 'Failed to submit withdrawal.');
      onShowToast?.(result.message || 'Withdrawal failed.', 'error');
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setFormData({});
  };

  const getMethodIcon = (id) => {
    switch (id) {
      case 'upi':
        return <Zap size={22} className={styles.upiIcon} />;
      case 'amazon':
        return <ShoppingBag size={22} className={styles.amazonIcon} />;
      case 'google_play':
        return <Play size={22} className={styles.gplayIcon} />;
      default:
        return <Gift size={22} className={styles.defaultIcon} />;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.meshOverlay} aria-hidden="true" />

      <div className="container">
        <div className={styles.topNavRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onNavigateToWallet}
          >
            <ArrowLeft size={18} />
            <span>Back to Wallet</span>
          </button>

          <div className={styles.balanceBadge}>
            <span className={styles.balanceBadgeLabel}>Available to Withdraw:</span>
            <span className={styles.balanceBadgeVal}>
              {userVesBalance.toLocaleString()} VES
            </span>
            <span className={styles.balanceBadgeFiat}>
              (≈ ₹{summary?.vesValueInr?.toLocaleString() || '2,500'})
            </span>
          </div>
        </div>

        <div className={styles.pageGrid}>
          <div className={styles.mainColumn}>
            {successData ? (
              <motion.div
                className={styles.successCard}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className={styles.successRing}>
                  <CheckCircle2 size={38} className={styles.successIcon} />
                </div>
                <h2 className={styles.successTitle}>Withdrawal Queued!</h2>
                <p className={styles.successSubtitle}>
                  Your request for <strong>₹{successData.payoutAmount}</strong> (
                  {successData.currencyAmount.toLocaleString()} VES) has been created.
                </p>

                <div className={styles.receiptBox}>
                  <div className={styles.receiptRow}>
                    <span>Method:</span>
                    <strong>{successData.method.toUpperCase()}</strong>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Option ID:</span>
                    <strong className={styles.refMono}>{successData.optionId}</strong>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Destination:</span>
                    <strong>
                      {successData.payoutDetails.upiId ||
                        successData.payoutDetails.email ||
                        'Recorded'}
                    </strong>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Transaction ID:</span>
                    <strong className={styles.refMono}>
                      {successData.transactionId.slice(-8)}
                    </strong>
                  </div>
                  <div className={styles.receiptRow}>
                    <span>Status:</span>
                    <span className={styles.pendingBadge}>{successData.status}</span>
                  </div>
                </div>

                <div className={styles.successActions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleReset}
                  >
                    New Withdrawal
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={onNavigateToWallet}
                  >
                    Return to Wallet
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className={styles.payoutCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Request Withdrawal</h2>
                    <p className={styles.cardSubtitle}>
                      Redeem your VES earnings for cash transfers or verified gift cards
                    </p>
                  </div>
                </div>

                {validationError && (
                  <motion.div
                    className={styles.errorBanner}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <AlertCircle size={18} />
                    <span>{validationError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                  {/* Step 1: Select Method */}
                  <div className={styles.stepGroup}>
                    <label className={styles.stepLabel}>Step 1: Choose Payout Method</label>
                    <div className={styles.methodsGrid}>
                      {payoutMethods.map((m) => {
                        const isSelected = selectedMethodId === m.methodId;
                        const isInactive = !m.active;

                        return (
                          <button
                            key={m.methodId}
                            type="button"
                            disabled={isInactive}
                            className={`${styles.methodCard} ${isSelected ? styles.methodActive : ''
                              } ${isInactive ? styles.methodDisabled : ''}`}
                            onClick={() => setSelectedMethodId(m.methodId)}
                          >
                            <div className={styles.methodIconWrap}>
                              {getMethodIcon(m.methodId)}
                            </div>
                            <div className={styles.methodMeta}>
                              <div className={styles.methodTitleRow}>
                                <span className={styles.methodName}>{m.name}</span>
                                {m.methodId === 'upi' && (
                                  <span className={styles.badgeFast}>Fastest</span>
                                )}
                                {isInactive && (
                                  <span className={styles.badgeInactive}>Disabled</span>
                                )}
                              </div>
                              <span className={styles.methodNote}>
                                {isInactive
                                  ? m.eligibility?.note || 'Unavailable'
                                  : m.type === 'bank_transfer'
                                    ? 'Direct Bank / UPI'
                                    : 'Instant E-Code'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.stepGroup}>
                    <div className={styles.stepHeaderRow}>
                      <label className={styles.stepLabel}>
                        Step 2: Select Payout Option ({currentMethod?.name})
                      </label>
                    </div>

                    <div className={styles.optionsGrid}>
                      {options.map((opt) => {
                        const isChosen = selectedOption?.optionId === opt.optionId;
                        const hasEnough = userVesBalance >= opt.requiredAmount;

                        return (
                          <button
                            key={opt.optionId}
                            type="button"
                            className={`${styles.optionCard} ${isChosen ? styles.optionActive : ''
                              } ${!hasEnough ? styles.optionInsufficient : ''}`}
                            onClick={() => setSelectedOption(opt)}
                          >
                            <div className={styles.optionValRow}>
                              <span className={styles.payoutVal}>₹{opt.payoutValue}</span>
                              <span className={styles.currencyTag}>INR</span>
                            </div>
                            <div className={styles.requiredRow}>
                              <Coins size={14} className={styles.coinMini} />
                              <span className={styles.requiredVes}>
                                {opt.requiredAmount.toLocaleString()} VES
                              </span>
                            </div>
                            {!hasEnough && (
                              <span className={styles.shortageText}>
                                Need +{(opt.requiredAmount - userVesBalance).toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {detailFields.length > 0 && (
                    <div className={styles.stepGroup}>
                      <label className={styles.stepLabel}>
                        Step 3: Enter Required Details
                      </label>

                      <div className={styles.fieldsContainer}>
                        {detailFields.map((field) => (
                          <div key={field.name} className={styles.inputWrap}>
                            <label className={styles.fieldLabel}>
                              {field.label} {field.required && <span className={styles.reqStar}>*</span>}
                            </label>
                            <input
                              type={field.name === 'email' ? 'email' : 'text'}
                              placeholder={field.placeholder}
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value)}
                              className={styles.textInput}
                              required={field.required}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOption && (
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryRow}>
                        <span>Chosen Denomination:</span>
                        <strong>₹{selectedOption.payoutValue} INR</strong>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>VES Cost:</span>
                        <span>{selectedOption.requiredAmount.toLocaleString()} VES</span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Remaining Balance After:</span>
                        <span
                          className={
                            userVesBalance >= selectedOption.requiredAmount
                              ? styles.feeFree
                              : styles.amountShort
                          }
                        >
                          {Math.max(0, userVesBalance - selectedOption.requiredAmount).toLocaleString()} VES
                        </span>
                      </div>
                      <div className={styles.summaryDivider} />
                      <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                        <span>You Receive:</span>
                        <span className={styles.totalCash}>₹{selectedOption.payoutValue}</span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={
                      submitting ||
                      !selectedOption ||
                      userVesBalance < (selectedOption?.requiredAmount || 0)
                    }
                  >
                    {submitting ? (
                      'Submitting Request...'
                    ) : (
                      <>
                        <span>
                          Submit Withdrawal (₹{selectedOption?.payoutValue || 0})
                        </span>
                        <ArrowUpRight size={18} />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </div>

          <div className={styles.sideColumn}>
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <Clock size={18} className={styles.sideCardIcon} />
                <h3 className={styles.sideCardTitle}>Recent Withdrawals</h3>
              </div>

              {withdrawals.length === 0 ? (
                <EmptyState
                  icon={ArrowUpRight}
                  title="No Withdrawals"
                  description="Your pending and completed withdrawal tickets will appear here."
                />
              ) : (
                <div className={styles.historyList}>
                  {withdrawals.map((w) => {
                    const isPending = w.status === 'PENDING' || w.status === 'PROCESSING';
                    const isRejected = w.status === 'REJECTED' || w.status === 'CANCELLED';
                    const isApproved = w.status === 'APPROVED';
                    return (
                      <div key={w._id} className={styles.historyItem}>
                        <div className={styles.historyLeft}>
                          <div className={styles.historyMethodRow}>
                            <span className={styles.historyMethod}>
                              {w.method.toUpperCase()} ({w.optionId})
                            </span>
                            <span
                              className={`${styles.statusPill} ${isApproved
                                  ? styles.statusSuccess
                                  : isPending
                                    ? styles.statusProcessing
                                    : styles.statusRejected
                                }`}
                            >
                              {w.status}
                            </span>
                          </div>

                          <span className={styles.historyDest}>
                            {w.payoutDetails?.upiId || w.payoutDetails?.email || 'N/A'}
                          </span>

                          <span className={styles.historyDate}>
                            {formatDate(w.requestedAt || w.createdAt)}
                          </span>

                          {isRejected && w.rejectionReason && (
                            <span className={styles.rejectNotice}>
                              Reason: {w.rejectionReason}
                            </span>
                          )}
                        </div>

                        <div className={styles.historyRight}>
                          <span className={styles.historyFiat}>₹{w.payoutAmount}</span>
                          <span className={styles.historySve}>
                            {w.currencyAmount.toLocaleString()} VES
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <ShieldCheck size={18} className={styles.sideCardIcon} />
                <h3 className={styles.sideCardTitle}>Withdrawal Rules</h3>
              </div>

              <div className={styles.guidelineList}>
                <div className={styles.guidelineItem}>
                  <strong>Instant & Batch Processing</strong>
                  <p>UPI transfers complete in minutes. E-Gift cards are delivered to the entered email.</p>
                </div>
                <div className={styles.guidelineItem}>
                  <strong>Reversal Protection</strong>
                  <p>If a withdrawal is rejected due to invalid account details, your VES are automatically returned.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayoutPage;
