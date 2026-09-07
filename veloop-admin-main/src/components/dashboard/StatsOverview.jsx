import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useAdminWithdrawals } from '../../context/AdminWithdrawalContext';
import styles from './StatsOverview.module.css';

function StatsOverview({ onSelectStatus }) {
  const { stats, statusFilter } = useAdminWithdrawals();

  const cards = [
    {
      id: 'PENDING',
      title: 'Pending Review',
      count: stats.pendingCount,
      countLabel: 'Requests',
      value: `₹${stats.pendingTotalInr.toLocaleString()}`,
      subValue: `${stats.pendingTotalVes.toLocaleString()} VES in queue`,
      icon: Clock,
      cardClass: styles.amberCard,
      iconClass: styles.amberIconWrap,
      badge: 'Action Required',
      badgeClass: styles.amberBadge,
      active: statusFilter === 'PENDING',
    },
    {
      id: 'APPROVED',
      title: 'Approved Payouts',
      count: stats.approvedCount,
      countLabel: 'Processed',
      value: `₹${stats.approvedTotalInr.toLocaleString()}`,
      subValue: `${stats.approvedTotalVes.toLocaleString()} VES disbursed`,
      icon: CheckCircle2,
      cardClass: styles.emeraldCard,
      iconClass: styles.emeraldIconWrap,
      badge: 'Disbursed',
      badgeClass: styles.emeraldBadge,
      active: statusFilter === 'APPROVED',
    },
    {
      id: 'REJECTED',
      title: 'Rejected Requests',
      count: stats.rejectedCount,
      countLabel: 'Declined',
      value: `₹${stats.rejectedTotalInr.toLocaleString()}`,
      subValue: 'Declined submissions',
      icon: XCircle,
      cardClass: styles.roseCard,
      iconClass: styles.roseIconWrap,
      badge: 'Declined',
      badgeClass: styles.roseBadge,
      active: statusFilter === 'REJECTED',
    },
    {
      id: 'ALL',
      title: 'Total Volume Disbursed',
      count: stats.totalRequestsCount,
      countLabel: 'Lifetime Tickets',
      value: `₹${stats.totalProcessedVolumeInr.toLocaleString()}`,
      subValue: 'Disbursed payout volume',
      icon: TrendingUp,
      cardClass: styles.indigoCard,
      iconClass: styles.indigoIconWrap,
      badge: 'Aggregated',
      badgeClass: styles.indigoBadge,
      active: statusFilter === 'ALL',
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            className={`${styles.card} ${card.cardClass} ${card.active ? styles.cardActive : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            onClick={() => onSelectStatus?.(card.id)}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
          >
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrap} ${card.iconClass}`}>
                <Icon size={18} />
              </div>
              <span className={`${styles.badge} ${card.badgeClass}`}>{card.badge}</span>
            </div>

            <div className={styles.cardBody}>
              <span className={styles.cardTitle}>{card.title}</span>
              <div className={styles.primaryRow}>
                <span className={styles.countNumber}>{card.count}</span>
                <span className={styles.countSuffix}>{card.countLabel}</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.fiatRow}>
                <span className={styles.fiatAmount}>{card.value}</span>
                <span className={styles.inrTag}>INR</span>
              </div>
              <span className={styles.subDetail}>{card.subValue}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
