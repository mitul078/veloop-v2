import { motion } from 'framer-motion';
import {
  ShieldAlert,
  LogOut,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminWithdrawals } from '../../context/AdminWithdrawalContext';
import styles from './AdminNavbar.module.css';

function AdminNavbar({ onShowToast }) {
  const { adminUser, logout } = useAdminAuth();
  const { stats, resetToMockData, refresh } = useAdminWithdrawals();

  const handleResetData = () => {
    if (typeof resetToMockData === 'function') {
      resetToMockData();
    } else if (typeof refresh === 'function') {
      refresh();
    }
    onShowToast?.('Refreshed withdrawal records', 'info');
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Brand Group */}
        <div className={styles.brandGroup}>
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
            <div className={styles.brandTopRow}>
              <span className={styles.brandTitle}>VELoop</span>
              <span className={styles.adminBadge}>
                <ShieldCheck size={12} />
                <span>Admin</span>
              </span>
            </div>
            <span className={styles.brandSub}>Withdrawal Review Console</span>
          </div>
        </div>

        {/* Center / Pending notification indicator */}
        <div className={styles.centerGroup}>
          <div className={styles.systemStatusChip}>
            <span className={styles.statusPulseDot} />
            <span className={styles.systemStatusText}>System Live</span>
          </div>

          {stats.pendingCount > 0 ? (
            <div className={styles.pendingBadge}>
              <Clock size={13} className={styles.pendingClockIcon} />
              <span>{stats.pendingCount} Pending</span>
            </div>
          ) : (
            <div className={`${styles.pendingBadge} ${styles.allClearBadge}`}>
              <CheckCircle2 size={13} />
              <span>Queue Cleared</span>
            </div>
          )}
        </div>

        {/* Right user chip & actions */}
        <div className={styles.actions}>
          {/* Admin User Chip */}
          <div className={styles.userChip}>
            <div className={styles.userAvatar}>
              <ShieldAlert size={14} />
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userEmail}>{adminUser?.email || 'admin@veloop.com'}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleResetData}
            title="Reset to default mock data"
          >
            <RotateCcw size={15} />
            <span className={styles.btnLabel}>Reset</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.logoutBtn}`}
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={15} />
            <span className={styles.btnLabel}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
