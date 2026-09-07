import { motion } from 'framer-motion';
import logo from '../../assets/images/logo.png';
import styles from './Loader.module.css';

function Loader({ message = 'Loading...' }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          {/* Subtle outer glowing ring */}
          <motion.div
            className={styles.glowingRing}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Rotating Logo */}
          <motion.img
            src={logo}
            alt="VELoop loading logo"
            className={styles.logo}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
        <motion.p
          className={styles.message}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}

export default Loader;
