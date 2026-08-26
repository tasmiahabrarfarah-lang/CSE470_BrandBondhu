import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Referrals = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [refData, setRefData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await api.referrals.getMyReferrals();
      if (res.success) {
        setRefData(res.data);
      }

      if (isAdmin) {
        const statsRes = await api.referrals.getStats();
        if (statsRes.success) {
          setAdminStats(statsRes.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load referral details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleCopyLink = () => {
    if (!refData?.referralLink) return;
    navigator.clipboard.writeText(refData.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={styles.loaderBox}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', marginTop: '12px' }}>Loading referral dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Title */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🎁 Referral & Loyalty Program</h1>
          <p style={styles.subtitle}>
            Invite fellow entrepreneurs and designers to BrandBondhu and earn bonus AI credits for every signup!
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button style={styles.closeBannerBtn} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Hero Link Sharing Banner (FR-20.1) */}
      <div className="glass" style={styles.referralHero}>
        <div style={styles.heroLeft}>
          <span style={styles.heroTag}>YOUR UNIQUE REFERRAL LINK</span>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: '6px 0 12px 0' }}>
            Earn 15 Bonus AI Credits Per Referral!
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.4' }}>
            Share your custom referral link or code. When a new user registers using your link, they receive <strong>+10 welcome bonus credits</strong> and you receive <strong>+15 bonus credits</strong>!
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.codeBox}>
            <span style={styles.codeLabel}>YOUR REFERRAL CODE</span>
            <span style={styles.codeText}>{refData?.referralCode}</span>
          </div>

          <div style={styles.linkCopyRow}>
            <input
              type="text"
              readOnly
              value={refData?.referralLink || ''}
              style={styles.linkInput}
            />
            <button style={styles.copyBtn} onClick={handleCopyLink}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Personal Stats Grid (FR-20.3) */}
      <div style={styles.statsGrid}>
        <div className="glass" style={styles.statCard}>
          <div style={styles.statIconBox}>👥</div>
          <div>
            <div style={styles.statNum}>{refData?.stats?.totalReferrals || 0}</div>
            <div style={styles.statLabel}>Total Referred Users</div>
          </div>
        </div>

        <div className="glass" style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>⚡</div>
          <div>
            <div style={{ ...styles.statNum, color: '#34d399' }}>+{refData?.stats?.totalBonusEarned || 0}</div>
            <div style={styles.statLabel}>Total AI Credits Earned</div>
          </div>
        </div>

        <div className="glass" style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>🏆</div>
          <div>
            <div style={{ ...styles.statNum, color: '#fbbf24' }}>
              {(refData?.stats?.totalReferrals || 0) >= 10
                ? 'VIP Ambassador'
                : (refData?.stats?.totalReferrals || 0) >= 3
                ? 'Silver Advocate'
                : 'Starter Promoter'}
            </div>
            <div style={styles.statLabel}>Loyalty Status Tier</div>
          </div>
        </div>
      </div>

      {/* Referral History Table (FR-20.3) */}
      <div className="glass" style={styles.historyContainer}>
        <h3 style={styles.sectionTitle}>📜 Referral Rewards History</h3>

        {refData?.history?.length === 0 ? (
          <div style={styles.emptyHistory}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚀</div>
            <h4 style={{ color: '#fff' }}>No referrals yet</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
              Share your link with friends or on social media to start earning bonus credits!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Referred User</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Date Joined</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Bonus Credits</th>
                </tr>
              </thead>
              <tbody>
                {refData.history.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{item.refereeName}</span>
                    </td>
                    <td style={styles.td}>{item.refereeEmail || '—'}</td>
                    <td style={styles.td}>{new Date(item.joinedAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={styles.completedBadge}>✅ Verified</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: '#34d399', fontWeight: '800' }}>+{item.bonusEarned} Credits</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Platform Metrics Section */}
      {isAdmin && adminStats && (
        <div className="glass" style={styles.adminSection}>
          <h3 style={{ color: '#818cf8', fontSize: '1.1rem', marginBottom: '16px' }}>
            ⚙️ Admin Platform Referral Analytics
          </h3>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={styles.adminStatBox}>
              <span style={styles.adminStatVal}>{adminStats.totalReferrals}</span>
              <span style={styles.adminStatLbl}>Platform Total Referrals</span>
            </div>
            <div style={styles.adminStatBox}>
              <span style={{ ...styles.adminStatVal, color: '#34d399' }}>+{adminStats.totalCreditsIssued}</span>
              <span style={styles.adminStatLbl}>Total Bonus Credits Distributed</span>
            </div>
          </div>

          <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '12px' }}>
            🏆 Top Referring Platform Ambassadors
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {adminStats.topReferrers?.map((top, i) => (
              <div key={i} style={styles.topReferrerRow}>
                <span style={{ fontWeight: '800', color: '#fbbf24', width: '24px' }}>#{i + 1}</span>
                <span style={{ color: '#fff', fontWeight: '600', flex: 1 }}>{top.name} ({top.email})</span>
                <span style={{ color: '#818cf8', fontWeight: '700' }}>{top.count} successful referrals</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBannerBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  loaderBox: {
    textAlign: 'center',
    padding: '48px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
  referralHero: {
    padding: '28px',
    borderRadius: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
  },
  heroLeft: {},
  heroTag: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: '0.05em',
  },
  heroRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  codeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '12px 16px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  codeText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#fbbf24',
    letterSpacing: '0.05em',
  },
  linkCopyRow: {
    display: 'flex',
    gap: '10px',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#0f1117',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  copyBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIconBox: {
    width: '50px',
    height: '50px',
    borderRadius: '14px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
  },
  statNum: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '2px',
  },
  historyContainer: {
    padding: '24px',
    borderRadius: '20px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
  },
  emptyHistory: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#94a3b8',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },
  td: {
    padding: '14px 16px',
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  adminSection: {
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid rgba(129, 140, 248, 0.3)',
  },
  adminStatBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  adminStatVal: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
  },
  adminStatLbl: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  topReferrerRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
};

export default Referrals;
