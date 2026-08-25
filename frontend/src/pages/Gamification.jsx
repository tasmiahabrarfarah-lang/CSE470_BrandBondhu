import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Gamification = () => {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('score'); // 'score', 'leaderboard', 'badges'
  const [optInStatus, setOptInStatus] = useState(false);
  const [industry, setIndustry] = useState('');
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.gamification.getProfile();
      if (res.success) {
        setProfile(res.data);
        setOptInStatus(res.data.optInLeaderboard);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!optInStatus) return;
    try {
      setLeaderboardLoading(true);
      const res = await api.gamification.getLeaderboard();
      if (res.success) {
        setLeaderboard(res.data);
        setIndustry(res.industry);
      }
    } catch (err) {
      console.log('Leaderboard load blocked:', err.message);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, optInStatus]);

  const handleToggleLeaderboard = async () => {
    try {
      const nextVal = !optInStatus;
      const res = await api.gamification.toggleLeaderboard(nextVal);
      if (res.success) {
        setOptInStatus(res.optInLeaderboard);
        triggerToast(`Leaderboard status updated: now ${res.optInLeaderboard ? 'Opted In' : 'Opted Out'}`);
        if (!res.optInLeaderboard) {
          setLeaderboard([]);
        }
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const badgeDefinitions = [
    { name: 'Brand Complete', description: 'Your brand identity questionnaire, logo, and palette are fully configured.', hint: 'Configure active brand kit with logo, color palette, typography and tagline' },
    { name: '7-Day Streak', description: 'You successfully published posts on 7 consecutive days.', hint: 'Schedule and publish social posts on 7 consecutive days' },
    { name: 'Consistent Creator', description: 'You published 10 or more social media posts.', hint: 'Successfully publish at least 10 posts' },
    { name: 'Engagement Guru', description: 'You received 5 or more positive comments from customers.', hint: 'Get 5 positive customer comment sentiments' }
  ];

  const getBadgeStatus = (badgeName) => {
    if (!profile || !profile.badges) return false;
    return profile.badges.some(b => b.name === badgeName);
  };

  return (
    <div style={styles.container}>
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981'
        }}>
          {toast.message}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>🏆 Branding Score</h1>
        <p style={styles.subtitle}>Build consistency, complete your active brand assets, engage with customers, and climb the leaderboard.</p>
      </div>

      <div style={styles.tabsRow}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'score' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('score')}
        >
          📊 My Score
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'badges' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('badges')}
        >
          🏅 Achievements
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'leaderboard' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('leaderboard')}
        >
          ⚔️ Industry Leaderboard
        </button>
      </div>

      {profileLoading ? (
        <div style={styles.loader}>Calculating your Brand Score...</div>
      ) : !profile ? (
        <div style={styles.emptyState}>Failed to load score data.</div>
      ) : (
        <div style={styles.mainGrid}>

          {/* TAB 1: SCORE DETAILS */}
          {activeTab === 'score' && (
            <div style={styles.tabContentGrid}>
              <div className="glass" style={styles.scoreSummaryCard}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Overall Branding Score</h3>
                <div style={styles.scoreWheelWrapper}>
                  <div style={styles.scoreWheelInner}>
                    <div style={styles.scoreValue}>{profile.brandingScore}</div>
                    <div style={styles.scoreLabel}>out of 100</div>
                  </div>
                </div>

                <div style={styles.streakIndicator}>
                  <span style={styles.streakFlame}>🔥</span>
                  <div>
                    <div style={styles.streakCount}>{profile.streakDays}-Day Posting Streak</div>
                    <div style={styles.streakSub}>Keep scheduling content to maintain your streak!</div>
                  </div>
                </div>
              </div>

              <div style={styles.breakdownList}>
                <div className="glass" style={styles.breakdownCard}>
                  <div style={styles.breakdownCardHeader}>
                    <h4>✨ Brand Kit Completeness</h4>
                    <span style={styles.pointsText}>{profile.breakdown?.brandKitPoints} / 30 pts</span>
                  </div>
                  <p style={styles.breakdownDesc}>Scores depend on having active logos, taglines, color palettes, and styling preferences.</p>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${(profile.breakdown?.brandKitPoints / 30) * 100}%`, backgroundColor: '#6366f1' }}></div>
                  </div>
                  <div style={styles.criteriaRow}>
                    <span style={profile.breakdown?.details?.isKitComplete ? styles.criteriaPassed : styles.criteriaLocked}>
                      {profile.breakdown?.details?.isKitComplete ? '✓ Brand kit is fully customized' : '⚡ Complete questionnaire, logo, palette, and styles'}
                    </span>
                  </div>
                </div>

                <div className="glass" style={styles.breakdownCard}>
                  <div style={styles.breakdownCardHeader}>
                    <h4>📅 Posting Consistency</h4>
                    <span style={styles.pointsText}>{profile.breakdown?.postingPoints} / 40 pts</span>
                  </div>
                  <p style={styles.breakdownDesc}>Points are awarded for the volume of published posts in the last 30 days and your consecutive streak.</p>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${(profile.breakdown?.postingPoints / 40) * 100}%`, backgroundColor: '#10b981' }}></div>
                  </div>
                  <div style={styles.criteriaRow}>
                    <span style={styles.criteriaPassed}>✓ Published social posts: {profile.breakdown?.details?.publishedCount}</span>
                    <span style={{ marginLeft: '16px', ...styles.criteriaPassed }}>✓ Current Streak: {profile.streakDays} days</span>
                  </div>
                </div>

                <div className="glass" style={styles.breakdownCard}>
                  <div style={styles.breakdownCardHeader}>
                    <h4>💬 Customer Engagement</h4>
                    <span style={styles.pointsText}>{profile.breakdown?.engagementPoints} / 30 pts</span>
                  </div>
                  <p style={styles.breakdownDesc}>Analyzes customer comment sentiments. Positive comments grant 5 points each, neutral comments grant 2 points.</p>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${(profile.breakdown?.engagementPoints / 30) * 100}%`, backgroundColor: '#f59e0b' }}></div>
                  </div>
                  <div style={styles.criteriaRow}>
                    <span style={styles.criteriaPassed}>✓ Positive Comments: {profile.breakdown?.details?.positiveCount}</span>
                    <span style={{ marginLeft: '16px', ...styles.criteriaPassed }}>✓ Neutral Comments: {profile.breakdown?.details?.neutralCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACHIEVEMENTS */}
          {activeTab === 'badges' && (
            <div>
              <div style={styles.badgesGrid}>
                {badgeDefinitions.map((b, idx) => {
                  const unlocked = getBadgeStatus(b.name);
                  return (
                    <div
                      key={idx}
                      className="glass"
                      style={{
                        ...styles.badgeCard,
                        opacity: unlocked ? 1 : 0.45,
                      }}
                    >
                      <div style={{
                        ...styles.badgeIconBox,
                        backgroundColor: unlocked ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: unlocked ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                        filter: unlocked ? 'none' : 'grayscale(100%)'
                      }}>
                        {b.name === 'Brand Complete' && '🎨'}
                        {b.name === '7-Day Streak' && '🔥'}
                        {b.name === 'Consistent Creator' && '🚀'}
                        {b.name === 'Engagement Guru' && '💬'}
                      </div>
                      <h4 style={{ margin: '12px 0 4px 0', color: '#fff', fontSize: '1.05rem' }}>{b.name}</h4>
                      <p style={styles.badgeDesc}>{b.description}</p>
                      {!unlocked && (
                        <div style={styles.badgeHintRow}>
                          <span style={styles.badgeHintLabel}>Unlock Requirement:</span>
                          <span style={styles.badgeHintVal}>{b.hint}</span>
                        </div>
                      )}
                      {unlocked && (
                        <span style={styles.unlockedTag}>✓ UNLOCKED</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div style={styles.leaderboardSection}>
              <div className="glass" style={styles.optInHeaderCard}>
                <div style={styles.optInLeft}>
                  <h3>Opt-In for Similar Industry Competitions</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                    Opt-in to share your Branding Score and compare with business owners in the same industry. You can opt-out at any time.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleToggleLeaderboard}
                    style={{
                      ...styles.primaryBtn,
                      backgroundColor: optInStatus ? '#dc2626' : '#6366f1'
                    }}
                  >
                    {optInStatus ? 'Opt Out & Hide' : 'Opt In & Share'}
                  </button>
                </div>
              </div>

              {!optInStatus ? (
                <div style={styles.selectPrompt}>You must opt into the leaderboard to view rankings.</div>
              ) : leaderboardLoading ? (
                <div style={styles.loader}>Searching same industry sellers...</div>
              ) : leaderboard.length === 0 ? (
                <div style={styles.emptyState}>No other competitors opted in for industry "{industry}" yet.</div>
              ) : (
                <div style={styles.ranksWrapper}>
                  <h3 style={{ marginBottom: '16px', color: '#6366f1' }}>Industry Rank Board: {industry}</h3>
                  <div style={styles.ranksList}>
                    {leaderboard.map((item, idx) => {
                      const isMe = item._id === profile._id || (profile && item.name === profile.name);
                      return (
                        <div
                          key={item._id}
                          style={{
                            ...styles.rankRow,
                            border: isMe ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.03)',
                            backgroundColor: isMe ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)'
                          }}
                        >
                          <div style={styles.rankNumCol}>
                            <span style={{
                              ...styles.rankNumText,
                              color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#64748b'
                            }}>
                              #{idx + 1}
                            </span>
                          </div>

                          <div style={styles.rankAvatarCol}>
                            {item.profilePicture ? (
                              <img src={item.profilePicture} alt="Avatar" style={styles.rankPic} />
                            ) : (
                              <div style={styles.rankPlaceholder}>{item.name.slice(0,2).toUpperCase()}</div>
                            )}
                          </div>

                          <div style={styles.rankDetailsCol}>
                            <div style={styles.rankNameRow}>
                              <span style={styles.rankNameText}>{item.name}</span>
                              {isMe && <span style={styles.meBadge}>YOU</span>}
                            </div>
                            <span style={styles.rankBusinessText}>🏢 {item.businessInfo?.businessName || 'Business Owner'}</span>
                          </div>

                          <div style={styles.rankStreakCol}>
                            <span>🔥 {item.streakDays}d Streak</span>
                          </div>

                          <div style={styles.rankScoreCol}>
                            <span style={styles.rankScoreVal}>{item.brandingScore}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '8px 0',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.975rem',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '12px 24px',
    borderRadius: '12px',
    color: '#fff',
    zIndex: 1000,
    fontWeight: '700',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '8px',
  },
  tabBtn: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    color: '#fff',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderBottom: '2px solid #6366f1',
  },
  mainGrid: {
    marginTop: '12px',
  },
  loader: {
    textAlign: 'center',
    padding: '48px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b',
  },
  tabContentGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
  },
  scoreSummaryCard: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreWheelWrapper: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'conic-gradient(#6366f1 0% 75%, rgba(255,255,255,0.05) 75% 100%)',
    margin: '24px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreWheelInner: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: '#12131a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  streakIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
    width: '100%',
    boxSizing: 'border-box',
  },
  streakFlame: {
    fontSize: '1.75rem',
  },
  streakCount: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: '0.9rem',
  },
  streakSub: {
    fontSize: '0.7rem',
    color: '#64748b',
    marginTop: '2px',
  },
  breakdownList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  breakdownCard: {
    padding: '20px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  breakdownCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  breakdownDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '16px',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
  },
  criteriaRow: {
    display: 'flex',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  criteriaPassed: {
    color: '#10b981',
  },
  criteriaLocked: {
    color: '#64748b',
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
  },
  badgeCard: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.2s',
  },
  badgeIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  },
  badgeDesc: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.4',
    marginBottom: '16px',
    flex: 1,
  },
  badgeHintRow: {
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '12px',
    width: '100%',
    textAlign: 'left',
  },
  badgeHintLabel: {
    display: 'block',
    fontSize: '0.65rem',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  badgeHintVal: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#cbd5e1',
    marginTop: '2px',
  },
  unlockedTag: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  leaderboardSection: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  optInHeaderCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  optInLeft: {
    flex: 1,
    paddingRight: '20px',
  },
  primaryBtn: {
    padding: '10px 24px',
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  selectPrompt: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontWeight: '600',
  },
  ranksWrapper: {
    marginTop: '16px',
  },
  ranksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rankRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    borderRadius: '14px',
    transition: 'all 0.2s',
  },
  rankNumCol: {
    width: '40px',
  },
  rankNumText: {
    fontSize: '1.25rem',
    fontWeight: '800',
  },
  rankAvatarCol: {
    width: '50px',
  },
  rankPic: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1',
  },
  rankPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
  },
  rankDetailsCol: {
    flex: 1,
  },
  rankNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  rankNameText: {
    fontWeight: '700',
    color: '#fff',
  },
  meBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    backgroundColor: '#6366f1',
    color: '#fff',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  rankBusinessText: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '2px',
  },
  rankStreakCol: {
    marginRight: '24px',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  rankScoreCol: {
    textAlign: 'right',
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },
  rankScoreVal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#10b981',
  },
};
