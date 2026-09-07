import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, LogOut, RefreshCw, Gem, Disc, Dices } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import styles from './Navbar.module.css';

function Navbar({ activeTab, onTabChange }) {
  const { logout } = useAuth();
  const { summary, refreshWallet, loading } = useWallet();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandGroup} onClick={() => onTabChange('wallet')}>
          <div className={styles.logoRing}>
            <motion.img
              src={logo}
              alt="VELoop"
              className={styles.logoImg}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>VELoop</span>
            <span className={styles.brandBadge}>Wallet</span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className={`${styles.navTabs} ${styles.desktopOnly}`}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'wallet' ? styles.tabActive : ''}`}
            onClick={() => onTabChange('wallet')}
          >
            <Wallet size={16} />
            <span>My Wallet</span>
            {activeTab === 'wallet' && (
              <motion.div
                layoutId="activeTabPill"
                className={styles.activeIndicator}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'payout' ? styles.tabActive : ''}`}
            onClick={() => onTabChange('payout')}
          >
            <ArrowUpRight size={16} />
            <span>Payouts</span>
            {activeTab === 'payout' && (
              <motion.div
                layoutId="activeTabPill"
                className={styles.activeIndicator}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </nav>

        {/* Balances & Actions */}
        <div className={styles.actions}>
          {summary && (
            <div className={styles.balancesGroup}>
              {/* Primary VES Balance */}
              <div className={styles.balanceChip}>
                <span className={styles.vesTag}>VES</span>
                <span className={styles.balanceAmount}>
                  {summary.ves?.toLocaleString()}
                </span>
                <span className={styles.fiatHint}>
                  (₹{summary.vesValueInr?.toLocaleString()})
                </span>
              </div>

              <div className={styles.desktopOnly}>
                <div className={styles.miniPill} title="Gems">
                  <Gem size={13} className={styles.gemIcon} />
                  <span>{summary.gems}</span>
                </div>
              </div>

              <div className={styles.desktopOnly}>
                <div className={styles.miniPill} title="Tokens">
                  <Disc size={13} className={styles.tokenIcon} />
                  <span>{summary.tokens}</span>
                </div>
              </div>

              <div className={styles.desktopOnly}>
                <div className={styles.miniPill} title="Lucky Spins">
                  <Dices size={13} className={styles.spinIcon} />
                  <span>{summary.spins}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.iconBtn}
            onClick={refreshWallet}
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
          </button>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className={styles.logoutLabel}>Logout</span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileTabsRow} ${styles.mobileOnly}`}>
        <div className="container">
          <nav className={styles.navTabsMobile}>
            <button
              type="button"
              className={`${styles.tabBtnMobile} ${
                activeTab === 'wallet' ? styles.tabActiveMobile : ''
              }`}
              onClick={() => onTabChange('wallet')}
            >
              <Wallet size={16} />
              <span>My Wallet</span>
              {activeTab === 'wallet' && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  className={styles.activeIndicatorMobile}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              type="button"
              className={`${styles.tabBtnMobile} ${
                activeTab === 'payout' ? styles.tabActiveMobile : ''
              }`}
              onClick={() => onTabChange('payout')}
            >
              <ArrowUpRight size={16} />
              <span>Payouts</span>
              {activeTab === 'payout' && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  className={styles.activeIndicatorMobile}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
