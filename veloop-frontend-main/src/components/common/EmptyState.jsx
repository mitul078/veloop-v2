import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

function EmptyState({
  title = 'No records found',
  description = 'There are no entries to display at this moment.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconCircle}>
        <Icon size={28} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {actionLabel && (
        <button
          type="button"
          className={styles.action}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;