import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import styles from './Toast.module.css';

function Toast({ message, show, type = 'success' }) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  const toastClass = `${styles.toast} ${
    type === 'error' ? styles.error : type === 'info' ? styles.info : styles.success
  }`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={toastClass}
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.25 }}
        >
          {getIcon()}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
