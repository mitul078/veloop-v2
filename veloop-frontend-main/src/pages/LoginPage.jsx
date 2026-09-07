import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

function LoginPage({ onNavigateToRegister, onError }) {
  const { login } = useAuth();
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

    if (!result.success) {
      const errMsg = result.message || 'Login failed. Please check your credentials.';
      setApiError(errMsg);
      onError?.(errMsg, 'error');
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'demo@veloop.test');
    setValue('password', 'Demo@12345');
  };

  return (
    <div className={styles.container}>
      <div className={styles.meshOverlay} aria-hidden="true" />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.header}>
          <div className={styles.logoRing}>
            <KeyRound size={28} className={styles.logoIcon} />
          </div>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to manage your wallet and payouts</p>
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
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
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
              <label htmlFor="password" className={styles.label}>Password</label>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputInvalid : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {loading ? 'Authenticating...' : 'Sign In'}
          </motion.button>
        </form>

        <div className={styles.demoBadge} onClick={handleFillDemo}>
          <span className={styles.demoLabel}>Demo Account:</span>
          <span className={styles.demoCreds}>demo@veloop.test / Demo@12345</span>
          <span className={styles.demoHint}>(Click to autofill)</span>
        </div>

        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className={styles.linkBtn}
              onClick={onNavigateToRegister}
            >
              Register here
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;