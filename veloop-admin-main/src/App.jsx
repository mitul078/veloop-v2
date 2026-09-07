import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminWithdrawalProvider } from './context/AdminWithdrawalContext';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminNavbar from './components/common/AdminNavbar';
import Loader from './components/common/Loader';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

function AdminAppContent() {
  const { isAuthenticated, loading } = useAdminAuth();

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type });
    }, 4500);
  };

  if (loading) {
    return <Loader message="Verifying administrative access..." />;
  }

  // Unauthenticated Flow: Show Admin Login
  if (!isAuthenticated) {
    return (
      <>
        <AdminLoginPage
          onError={(msg) => showToast(msg, 'error')}
          onShowToast={showToast}
        />
        <Toast show={toast.show} message={toast.message} type={toast.type} />
      </>
    );
  }

  // Authenticated Flow: Show Admin Dashboard
  return (
    <AdminWithdrawalProvider>
      <AdminNavbar onShowToast={showToast} />
      <main>
        <AdminDashboardPage onShowToast={showToast} />
      </main>
      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </AdminWithdrawalProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <AdminAppContent />
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
