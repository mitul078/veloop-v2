import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './Toast.module.css';

function Toast({ message, show, type = 'success' }) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  const toastClass = `${styles.toast} ${type === 'error' ? styles.error : ''}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={toastClass}
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 16, x: '-50%' }}
          transition={{ duration: 0.3 }}
        >
          <Icon size={16} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;