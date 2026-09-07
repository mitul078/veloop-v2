import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import logo from '../assets/images/logo.png';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './AdminLoginPage.module.css';

function AdminLoginPage({ onError, onShowToast }) {
  const { login, dummyCredentials } = useAdminAuth();
  const demoCreds = dummyCredentials || {
    email: 'test@1.com',
    password: 'testuser',
  };
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      onShowToast?.('Admin authenticated successfully!', 'success');
    } else {
      const errMsg = result.message || 'Authentication failed. Please verify credentials.';
      setApiError(errMsg);
      onError?.(errMsg, 'error');
    }
  };

  const handleFillDemo = () => {
    setValue('email', demoCreds.email);
    setValue('password', demoCreds.password);
    onShowToast?.('Autofilled demo administrator credentials', 'info');
  };

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <div className={styles.logoRing}>
            <motion.img
              src={logo}
              alt="VELoop"
              className={styles.logoImg}
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className={styles.badgeWrap}>
            <span className={styles.adminPortalBadge}>
              <Sparkles size={12} />
              <span>Admin Access Only</span>
            </span>
          </div>
          <h2 className={styles.title}>VELoop Console</h2>
          <p className={styles.subtitle}>
            Sign in with administrator privileges to manage withdrawals & moderation
          </p>
        </div>

        {apiError && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {apiError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          {/* Email Field */}
          <div className={styles.inputGroup}>
            <label htmlFor="admin-email" className={styles.label}>
              Admin Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={17} className={styles.inputIcon} />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@veloop.com"
                className={`${styles.input} ${errors.email ? styles.inputInvalid : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <span className={styles.errorText}>{errors.email.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className={styles.inputGroup}>
            <div className={styles.passwordHeader}>
              <label htmlFor="admin-password" className={styles.label}>
                Password
              </label>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={17} className={styles.inputIcon} />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputInvalid : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 4,
                    message: 'Password must be at least 4 characters',
                  },
                })}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <span className={styles.errorText}>{errors.password.message}</span>
            )}
          </div>

          <motion.button
            type="submit"
            className={styles.submitBtn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
          >
            {loading ? 'Authenticating Admin Session...' : 'Sign In as Admin'}
          </motion.button>
        </form>

        {/* Demo Credentials Autofill Badge */}
        <div className={styles.demoBadge} onClick={handleFillDemo} role="button" tabIndex={0}>
          <div className={styles.demoBadgeTop}>
            <KeyRound size={14} className={styles.keyIcon} />
            <span className={styles.demoLabel}>Demo Admin Account:</span>
          </div>
          <span className={styles.demoCreds}>
            {demoCreds.email} / {demoCreds.password}
          </span>
          <span className={styles.demoHint}>
            (Click to autofill credentials)
          </span>
        </div>

        <div className={styles.footer}>
          <p>Protected by VELoop Cryptographic Role-Based Access Control</p>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminLoginPage;