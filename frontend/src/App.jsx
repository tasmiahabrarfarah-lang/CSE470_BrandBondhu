import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { api } from './services/api';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Subscriptions } from './pages/Subscriptions';
import { Collaborators } from './pages/Collaborators';
import { Notifications } from './pages/Notifications';
import { Products } from './pages/Products';
import { Marketplace } from './pages/Marketplace';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { BrandIdentity } from './pages/BrandIdentity';
import { ContentManager } from './pages/ContentManager';
import { BannerEditor } from './pages/BannerEditor';
import { AdminPanel } from './pages/AdminPanel';
import { Gamification } from './pages/Gamification';
import { HashtagGenerator } from './pages/HashtagGenerator';
import { BrandStyleGuide } from './pages/BrandStyleGuide';
import { FAQManager } from './pages/FAQManager';
import { SupportTickets } from './pages/SupportTickets';
import { Referrals } from './pages/Referrals';
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
    window.dispatchEvent(new Event('popstate'));
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
      if (user?.role === 'admin') {
        setActiveTab('admin');
      }
    } else {
      setSubscription(null);
      setActiveTab('dashboard');
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
      <Dashboard subscription={subscription} refreshSub={fetchSubscription} onTabChange={handleDashboardTabChange} />
    ) : (
      <Login onNavigate={navigate} />
    );
  }

  if (currentPath === '/register') {
    return isAuthenticated ? (
      <Dashboard subscription={subscription} refreshSub={fetchSubscription} onTabChange={handleDashboardTabChange} />
    ) : (
      <Register onNavigate={navigate} />
    );
  }

  if (currentPath.startsWith('/verify-otp')) {
    return <VerifyOTP onNavigate={navigate} />;
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPassword onNavigate={navigate} />;
  }

  // Authenticated workspace routes
  if (isAuthenticated) {
    const isAdmin = user?.role === 'admin';
    return (
      <Layout 
        activeTab={activeTab} 
        onTabChange={handleDashboardTabChange}
        subscription={subscription}
      >
        {activeTab === 'dashboard' && !isAdmin && (
          <Dashboard subscription={subscription} refreshSub={fetchSubscription} onTabChange={handleDashboardTabChange} />
        )}
        {activeTab === 'brandkit' && !isAdmin && <BrandIdentity />}
        {activeTab === 'styleguide' && !isAdmin && <BrandStyleGuide />}
        {activeTab === 'content' && !isAdmin && <ContentManager />}
        {activeTab === 'hashtags' && !isAdmin && <HashtagGenerator />}
        {activeTab === 'templates' && !isAdmin && <BannerEditor />}
        {activeTab === 'products' && !isAdmin && <Products />}
        {activeTab === 'marketplace' && !isAdmin && <Marketplace />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'subscriptions' && !isAdmin && (
          <Subscriptions subscription={subscription} refreshSub={fetchSubscription} />
        )}
        {activeTab === 'collaborators' && !isAdmin && <Collaborators />}
        {activeTab === 'tickets' && <SupportTickets />}
        {activeTab === 'referrals' && !isAdmin && <Referrals />}
        {activeTab === 'notifications' && <Notifications />}
        {activeTab === 'analytics' && !isAdmin && <AnalyticsDashboard />}
        {activeTab === 'faq' && !isAdmin && <FAQManager />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
        {activeTab === 'gamification' && !isAdmin && <Gamification />}
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
