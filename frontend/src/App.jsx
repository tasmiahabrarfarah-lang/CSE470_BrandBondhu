import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './services/api';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Subscriptions } from './pages/Subscriptions';
import { Collaborators } from './pages/Collaborators';
import { Notifications } from './pages/Notifications';
import { Layout } from './components/Layout';

// SPA Router Component Container
const InnerApp = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Custom simple router state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
  };

  // Sync subscription details
  const fetchSubscription = async () => {
    if (!isAuthenticated || user?.role === 'admin') return;
    try {
      setSubLoading(true);
      const res = await api.subscriptions.getMySubscription();
      if (res.success) {
        setSubscription(res.data);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err.message);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setSubscription(null);
    }
  }, [isAuthenticated, user]);

  const handleDashboardTabChange = (tabName) => {
    setActiveTab(tabName);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <h3 style={{ marginTop: '16px', color: '#94a3b8' }}>Loading BrandBondhu...</h3>
      </div>
    );
  }

  // Routing Map
  if (currentPath === '/') {
    return <Home onNavigate={navigate} />;
  }

  if (currentPath === '/login') {
    return isAuthenticated ? (
      <Dashboard subscription={subscription} refreshSub={fetchSubscription} />
    ) : (
      <Login onNavigate={navigate} />
    );
  }

  if (currentPath === '/register') {
    return isAuthenticated ? (
      <Dashboard subscription={subscription} refreshSub={fetchSubscription} />
    ) : (
      <Register onNavigate={navigate} />
    );
  }

  if (currentPath.startsWith('/verify-otp')) {
    return <VerifyOTP onNavigate={navigate} />;
  }

  // Authenticated workspace routes
  if (isAuthenticated) {
    return (
      <Layout 
        activeTab={activeTab} 
        onTabChange={handleDashboardTabChange}
        subscription={subscription}
      >
        {activeTab === 'dashboard' && (
          <Dashboard subscription={subscription} refreshSub={fetchSubscription} />
        )}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'subscriptions' && (
          <Subscriptions subscription={subscription} refreshSub={fetchSubscription} />
        )}
        {activeTab === 'collaborators' && <Collaborators />}
        {activeTab === 'notifications' && <Notifications />}
      </Layout>
    );
  }

  // Auth Fallback redirect
  return <Login onNavigate={navigate} />;
};

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    // Trigger popstate event manually to notify listeners
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <AuthProvider navigate={navigate}>
      <NotificationProvider>
        <InnerApp />
      </NotificationProvider>
    </AuthProvider>
  );
};

const styles = {
  loaderContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0b10',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.05)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;
