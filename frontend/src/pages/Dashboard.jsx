import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const Dashboard = ({ subscription, refreshSub, onTabChange }) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [simulating, setSimulating] = useState(false);
  const [sandboxResult, setSandboxResult] = useState('');
  const [sandboxError, setSandboxError] = useState('');
  const [scheduledCount, setScheduledCount] = useState(0);

  const fetchScheduledCount = async () => {
    try {
      const res = await api.content.getPosts({ status: 'Scheduled' });
      if (res.success && res.data) {
        setScheduledCount(res.data.length);
      }
    } catch (err) {
      console.error('Failed to load scheduled count:', err.message);
    }
  };

  useEffect(() => {
    if (user?.role === 'seller' || user?.role === 'collaborator') {
      fetchScheduledCount();
    }
  }, [user]);

  const runCreditSandbox = async (cost, operationName) => {
    setSimulating(true);
    setSandboxResult('');
    setSandboxError('');
    try {
      const res = await api.subscriptions.consume(cost);
      if (res.success) {
        setSandboxResult(`Operation '${operationName}' completed! Deducted ${cost} AI credits. New credits: ${res.currentCredits}`);
        await refreshSub(); // Sync credits header
        await fetchNotifications(); // Sync notifications bell
      }
    } catch (err) {
      setSandboxError(err.message || 'Verification failure or insufficient credits.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Welcome Card */}
      <div className="glass card" style={styles.welcomeCard}>
        <div style={styles.welcomeLeft}>
          <h2 style={styles.welcomeTitle}>Welcome back, {user?.name}!</h2>
          <p style={styles.welcomeSub}>
            {user?.role === 'seller' && `Managing F-Commerce branding for ${user.businessInfo?.businessName || 'your startup'}.`}
            {user?.role === 'collaborator' && `Staff collaborator workspace for parent owner ID.`}
            {user?.role === 'designer' && `Design marketplace services workspace.`}
          </p>
          <div style={styles.badgeRow}>
            <span className="badge badge-primary">{user?.role}</span>
            <span className="badge badge-success">Account Active</span>
            {user?.role === 'seller' && (
              <span className="badge badge-secondary">{subscription?.tier?.toUpperCase() || 'FREE'} PLAN</span>
            )}
          </div>
        </div>
        <div style={styles.welcomeRight}>📅 Local system date: {new Date().toLocaleDateString()}</div>
      </div>

      {/* Primary Dashboard layout based on role */}
      {user?.role === 'seller' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Quick Stats Grid */}
          <div className="grid grid-3">
            <div className="card glass glass-hover" style={styles.statCard}>
              <span style={styles.statIcon}>📊</span>
              <div>
                <div style={styles.statNum}>{user?.brandingScore || 0}%</div>
                <div style={styles.statLabel}>Branding Score</div>
              </div>
            </div>
            <div className="card glass glass-hover" style={styles.statCard}>
              <span style={styles.statIcon}>📅</span>
              <div>
                <div style={styles.statNum}>{scheduledCount} Scheduled</div>
                <div style={styles.statLabel}>Active Posts</div>
              </div>
            </div>
            <div className="card glass glass-hover" style={styles.statCard}>
              <span style={styles.statIcon}>💰</span>
              <div>
                <div style={styles.statNum}>{subscription?.credits?.current ?? 0} Credits</div>
                <div style={styles.statLabel}>AI Credits Left</div>
              </div>
            </div>
          </div>

          {/* Interactive AI Sandbox widget */}
          <div className="card glass" style={styles.sandboxCard}>
            <div style={styles.sandboxHeader}>
              <div>
                <h3 style={styles.cardTitle}>🤖 AI Features Credit Sandbox</h3>
                <p style={styles.cardSubtitle}>Deduct credits and trigger automated notification alerts in real-time</p>
              </div>
              <span className="badge badge-primary">Interactive Tool</span>
            </div>

            {sandboxResult && <div style={styles.successBox}>{sandboxResult}</div>}
            {sandboxError && <div style={styles.errorBox}>⚠️ {sandboxError}</div>}

            <div style={styles.sandboxBtnRow}>
              <button 
                className="btn btn-secondary" 
                onClick={() => runCreditSandbox(1, 'Bangla product caption')}
                disabled={simulating}
              >
                ✏️ Simulate Caption Gen (Cost: 1 Credit)
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => runCreditSandbox(3, 'AI Logo Generator')}
                disabled={simulating}
              >
                🎨 Simulate Logo Gen (Cost: 3 Credits)
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => runCreditSandbox(5, 'Brand Questionnaire Analysis')}
                disabled={simulating}
              >
                📊 Simulate Style Guide Gen (Cost: 5 Credits)
              </button>
            </div>
          </div>

          {/* Core Feature Scaffolds */}
          <div className="grid grid-2" style={{ gap: '20px' }}>
            <div className="card glass" style={styles.infoBlock}>
              <h3 style={styles.cardTitle}>🎨 Brand Identity Generation</h3>
              <p style={styles.cardText}>Fill out our questionnaire to generate a dynamic color palette, taglines, and logotypes scoped to your industry.</p>
              <button 
                className="btn btn-primary" 
                style={{ width: 'fit-content' }}
                onClick={() => onTabChange && onTabChange('brandkit')}
              >
                Open Questionnaire
              </button>
            </div>
            <div className="card glass" style={styles.infoBlock}>
              <h3 style={styles.cardTitle}>📘 Brand Style Guide Export (FR-15)</h3>
              <p style={styles.cardText}>Auto-generate and customize printable brand guidelines with logo clear space rules, HEX/RGB palettes, and font guidelines.</p>
              <button 
                className="btn btn-primary" 
                style={{ width: 'fit-content' }}
                onClick={() => onTabChange && onTabChange('styleguide')}
              >
                Export Style Guide PDF
              </button>
            </div>
            <div className="card glass" style={styles.infoBlock}>
              <h3 style={styles.cardTitle}>#️⃣ Hashtag & SEO Generator (FR-14)</h3>
              <p style={styles.cardText}>Generate popularity-ranked Bangla & English hashtags, save templates, and optimize post title/meta descriptions.</p>
              <button 
                className="btn btn-primary" 
                style={{ width: 'fit-content' }}
                onClick={() => onTabChange && onTabChange('hashtags')}
              >
                Generate Hashtags & SEO
              </button>
            </div>
            <div className="card glass" style={styles.infoBlock}>
              <h3 style={styles.cardTitle}>💬 Sentiment Comment Classifier</h3>
              <p style={styles.cardText}>Securely connect your Facebook Business Page API. Automatically categorize comments into positive, neutral, or negative categories.</p>
              <button 
                className="btn btn-accent" 
                style={{ width: 'fit-content' }}
                onClick={() => onTabChange && onTabChange('analytics')}
              >
                Link Page API
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'designer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="grid grid-3">
            <div className="card glass" style={styles.statCard}>
              <span style={styles.statIcon}>⭐</span>
              <div>
                <div style={styles.statNum}>4.9 / 5</div>
                <div style={styles.statLabel}>Designer Rating</div>
              </div>
            </div>
            <div className="card glass" style={styles.statCard}>
              <span style={styles.statIcon}>💼</span>
              <div>
                <div style={styles.statNum}>12 Jobs</div>
                <div style={styles.statLabel}>Completed Orders</div>
              </div>
            </div>
            <div className="card glass" style={styles.statCard}>
              <span style={styles.statIcon}>💸</span>
              <div>
                <div style={styles.statNum}>18,500 BDT</div>
                <div style={styles.statLabel}>Marketplace Earnings</div>
              </div>
            </div>
          </div>

          <div className="card glass" style={styles.infoBlock}>
            <h3 style={styles.cardTitle}>💼 Freelance Marketplace Orders</h3>
            <p style={styles.cardText}>No active orders. Update your portfolio links and rates under the 'My Profile' settings to begin receiving contract proposals.</p>
          </div>
        </div>
      )}

      {user?.role === 'collaborator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card glass" style={styles.infoBlock}>
            <h3 style={styles.cardTitle}>🛡️ Collaborator Workstation</h3>
            <p style={styles.cardText}>
              You have been granted access by the primary Seller. All actions will be logged against your operator ID for audit accountability.
            </p>
            <h4 style={{ color: '#818cf8', marginTop: '16px', fontSize: '0.9rem' }}>Active Workspace Permissions:</h4>
            <ul style={styles.permissionsList}>
              {user?.permissions?.map((perm, idx) => (
                <li key={idx} style={styles.permissionItem}>🔑 {perm.toUpperCase()} ACCESS</li>
              )) || <li>No custom permissions configured</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px 40px',
    flexWrap: 'wrap',
    gap: '24px',
  },
  welcomeLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  welcomeTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  welcomeSub: {
    fontSize: '0.95rem',
    color: '#cbd5e1',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },
  welcomeRight: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
    padding: '24px 30px',
  },
  statIcon: {
    fontSize: '2.5rem',
  },
  statNum: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  sandboxCard: {
    border: '1px solid rgba(99,102,241,0.2)',
    padding: '30px',
  },
  sandboxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  sandboxBtnRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  infoBlock: {
    padding: '28px',
  },
  cardText: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
  },
  permissionsList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  permissionItem: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#06b6d4',
  },
};
