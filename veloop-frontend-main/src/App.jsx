import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import WalletPage from './pages/WalletPage';
import PayoutPage from './pages/PayoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Navbar from './components/common/Navbar';
import Loader from './components/common/Loader';
import Toast from './components/common/Toast';

function AppContent() {
  const { accessToken, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' | 'payout'

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type });
    }, 5000);
  };

  if (loading) {
    return <Loader message="Verifying session..." />;
  }

  // Unauthenticated Flow
  if (!accessToken) {
    return (
      <>
        {authScreen === 'register' ? (
          <RegisterPage
            onNavigateToLogin={() => setAuthScreen('login')}
            onError={showToast}
          />
        ) : (
          <LoginPage
            onNavigateToRegister={() => setAuthScreen('register')}
            onError={showToast}
          />
        )}
        <Toast show={toast.show} message={toast.message} type={toast.type} />
      </>
    );
  }

  // Authenticated Flow (Wallet & Payouts)
  return (
    <WalletProvider>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === 'wallet' ? (
          <WalletPage onNavigateToPayout={() => setActiveTab('payout')} />
        ) : (
          <PayoutPage
            onNavigateToWallet={() => setActiveTab('wallet')}
            onShowToast={showToast}
          />
        )}
      </main>
      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </WalletProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;