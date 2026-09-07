import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ShieldCheck,
  Coins,
  Gem,
  Disc,
  Dices,
  Filter,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import styles from './WalletPage.module.css';

function WalletPage({ onNavigateToPayout }) {
  const {
    summary,
    filteredTransactions,
    loading,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
  } = useWallet();

  if (loading && !summary) {
    return <Loader message="Loading your wallet balance..." />;
  }

  const filterTabs = [
    { id: 'all', label: 'All Activity' },
    { id: 'CREDIT', label: 'Earned (Credits)' },
    { id: 'DEBIT', label: 'Withdrawals (Debits)' },
    { id: 'ves', label: 'VES Only' },
    { id: 'gems', label: 'Gems Only' },
  ];

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
        <section className={styles.heroSection}>
          <motion.div
            className={styles.balanceCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.balanceHeader}>
              <div className={styles.balanceLabelWrap}>
                <div className={styles.walletIconCircle}>
                  <Wallet size={22} className={styles.walletIcon} />
                </div>
                <div>
                  <span className={styles.balanceLabel}>Primary Wallet Balance</span>
                  <span className={styles.tierTag}>Verified Account</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.withdrawCta}
                onClick={onNavigateToPayout}
              >
                <span>Request Payout</span>
                <ArrowUpRight size={18} />
              </button>
            </div>

            <div className={styles.balanceValueRow}>
              <div className={styles.sveRow}>
                <Coins size={38} className={styles.goldCoin} />
                <h1 className={styles.mainBalance}>
                  {summary?.ves?.toLocaleString() ?? '25,000'}
                </h1>
                <span className={styles.currencyBadge}>VES</span>
              </div>
              <div className={styles.fiatRow}>
                <span className={styles.fiatSymbol}>≈</span>
                <span className={styles.fiatValue}>
                  ₹{summary?.vesValueInr?.toLocaleString() ?? '2,500'}
                </span>
                <span className={styles.rateHint}>(10 VES = ₹1.00 INR)</span>
              </div>
            </div>

            <div className={styles.assetsGrid}>
              <div className={styles.assetCard}>
                <div className={`${styles.assetIconWrap} ${styles.gemGlow}`}>
                  <Gem size={20} />
                </div>
                <div className={styles.assetMeta}>
                  <span className={styles.assetVal}>{summary?.gems ?? 100}</span>
                  <span className={styles.assetName}>Gems</span>
                </div>
              </div>

              <div className={styles.assetCard}>
                <div className={`${styles.assetIconWrap} ${styles.tokenGlow}`}>
                  <Disc size={20} />
                </div>
                <div className={styles.assetMeta}>
                  <span className={styles.assetVal}>{summary?.tokens ?? 500}</span>
                  <span className={styles.assetName}>Tokens</span>
                </div>
              </div>

              <div className={styles.assetCard}>
                <div className={`${styles.assetIconWrap} ${styles.spinGlow}`}>
                  <Dices size={20} />
                </div>
                <div className={styles.assetMeta}>
                  <span className={styles.assetVal}>{summary?.spins ?? 3}</span>
                  <span className={styles.assetName}>Lucky Spins</span>
                </div>
              </div>

              <div className={styles.assetCard}>
                <div className={`${styles.assetIconWrap} ${styles.withdrawnGlow}`}>
                  <ArrowUpRight size={20} />
                </div>
                <div className={styles.assetMeta}>
                  <span className={styles.assetVal}>
                    {summary?.totalWithdrawnVes?.toLocaleString() ?? 2400} VES
                  </span>
                  <span className={styles.assetName}>
                    Withdrawn ({summary?.totalWithdrawalCount ?? 1}x)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className={styles.transactionsSection}>
          <div className={styles.txHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Ledger & Transactions</h2>
              <p className={styles.sectionSubtitle}>
                Real-time transaction history matching backend records
              </p>
            </div>

            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by description or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={styles.filterPills}>
            <Filter size={14} className={styles.filterIcon} />
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.filterPill} ${filter === tab.id ? styles.filterPillActive : ''}`}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.txList}>
            {filteredTransactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No Transactions Match"
                description={
                  searchQuery
                    ? `No transaction matching "${searchQuery}" was found.`
                    : `No transactions found in "${filter}" filter.`
                }
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredTransactions.map((tx, idx) => {
                  const isCredit = tx.direction === 'CREDIT';
                  const isGems = tx.currency === 'gems';

                  return (
                    <motion.div
                      key={tx._id}
                      className={styles.txCard}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, delay: idx * 0.03 }}
                    >
                      <div
                        className={`${styles.txIconWrap} ${
                          isCredit ? styles.txIconCredit : styles.txIconDebit
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={20} />
                        ) : (
                          <ArrowUpRight size={20} />
                        )}
                      </div>

                      <div className={styles.txMeta}>
                        <div className={styles.txTitleRow}>
                          <h4 className={styles.txTitle}>{tx.description}</h4>
                          <span className={styles.typeBadge}>
                            {tx.type}
                          </span>
                          <span
                            className={`${styles.statusBadge} ${
                              tx.status === 'COMPLETED'
                                ? styles.badgeCompleted
                                : styles.badgePending
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <div className={styles.txSubtitleRow}>
                          <span className={styles.sourceTag}>
                            Source: {tx.source}
                          </span>
                          <span className={styles.bulletDot}>•</span>
                          <span className={styles.txDate}>{formatDate(tx.createdAt)}</span>
                          <span className={styles.bulletDot}>•</span>
                          <span className={styles.balanceFlow}>
                            Before: {tx.balance_before.toLocaleString()} → After:{' '}
                            {tx.balance_after.toLocaleString()}
                          </span>
                          {tx.reference_id && (
                            <>
                              <span className={styles.bulletDot}>•</span>
                              <span className={styles.txRef}>
                                Ref: {tx.reference_id.slice(-6)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={styles.txAmountWrap}>
                        <span
                          className={`${styles.txAmount} ${
                            isCredit ? styles.amountCredit : styles.amountDebit
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {tx.amount?.toLocaleString()} {tx.currency?.toUpperCase()}
                        </span>
                        <span className={styles.txFiat}>
                          {isGems ? '💎 Bonus' : `≈ ₹${(tx.amount / 10).toFixed(2)}`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </section>

        <section className={styles.assuranceSection}>
          <div className={styles.assuranceCard}>
            <ShieldCheck size={26} className={styles.shieldIcon} />
            <div className={styles.assuranceText}>
              <h4>Tamper-Evident Ledger Integrity</h4>
              <p>
                Every transaction event is cryptographically verified against the user state ledger.
                Withdrawals are audited and logged with immutable reference IDs.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WalletPage;
