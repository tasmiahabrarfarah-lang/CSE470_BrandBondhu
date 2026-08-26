import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Layout = ({
    children,
    activeTab,
    onTabChange,
    subscription
}) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const creditsRemaining = subscription?.credits?.current ?? 0;
  const creditsTotal = subscription?.credits?.total ?? 20;
  const isCreditLow = (creditsRemaining / creditsTotal) <= 0.2;

  const handleNotificationClick = (id) => {
    markAsRead(id);
    onTabChange('notifications');
    setShowNotifDropdown(false);
  };

  // Check collaborator permission helper
  const canAccess = (perm) => {
    if (user?.role === 'seller' || user?.role === 'admin') return true;
    if (user?.role === 'collaborator' && user?.permissions?.includes(perm)) return true;
    return false;
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <aside 
        className="glass" 
        style={{ 
          ...styles.sidebar, 
          transform: sidebarCollapsed ? 'translateX(-260px)' : 'none',
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={styles.brandBox}>
          <div style={styles.logoCircle}>B</div>
          <div>
            <h2 style={styles.brandName}>BrandBondhu</h2>
            <span style={styles.roleTag}>{user?.role?.toUpperCase()}</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'dashboard' ? styles.navItemActive : {}) }}
            onClick={() => onTabChange('dashboard')}
          >
            📊 Dashboard
          </button>

          {/* AI Brand Identity Navigation (Sellers, Collaborators with 'brand_kit' permission) */}
          {(user?.role === 'seller' || canAccess('brand_kit')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'brandkit' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('brandkit')}
            >
              ✨ AI Brand Identity
            </button>
          )}

          {/* Brand Style Guide Export Navigation (FR-15) */}
          {(user?.role === 'seller' || canAccess('brand_kit')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'styleguide' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('styleguide')}
            >
              📘 Brand Style Guide
            </button>
          )}

          {/* Content Generation & Calendar Navigation (Sellers, Collaborators with 'content' permission) */}
          {(user?.role === 'seller' || canAccess('content')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'content' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('content')}
            >
              📝 Content Calendar
            </button>
          )}

          {/* Hashtag & SEO Suggestion Generator Navigation (FR-14) */}
          {(user?.role === 'seller' || canAccess('content')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'hashtags' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('hashtags')}
            >
              #️⃣ Hashtag & SEO
            </button>
          )}

          {/* Poster & Banner Template Editor Navigation (Sellers, Collaborators with 'content' permission) */}
          {(user?.role === 'seller' || canAccess('content')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'templates' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('templates')}
            >
              🖼️ Banner Editor
            </button>
          )}

          {/* Analytics Navigation (Sellers, Collaborators) */}
          {(user?.role === 'seller' || canAccess('analytics')) && (
            <>
              <button 
                style={{ ...styles.navItem, ...(activeTab === 'analytics' ? styles.navItemActive : {}) }}
                onClick={() => onTabChange('analytics')}
              >
                📈 Analytics & Insights
              </button>
              <button 
                style={{ ...styles.navItem, ...(activeTab === 'faq' ? styles.navItemActive : {}) }}
                onClick={() => onTabChange('faq')}
              >
                🤖 FAQ Assistant
              </button>
            </>
          )}

          {/* Product Catalog Navigation (Sellers, Collaborators with 'products' permission) */}
          {(user?.role === 'seller' || canAccess('products')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'products' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('products')}
            >
              📦 Product Catalog
            </button>
          )}

          {/* Freelance Designer Marketplace Navigation (Sellers, Designers, Collaborators with 'marketplace' permission, Admin) */}
          {(user?.role === 'seller' || user?.role === 'designer' || user?.role === 'admin' || canAccess('marketplace')) && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'marketplace' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('marketplace')}
            >
              🎨 Marketplace
            </button>
          )}
          
          <button 
            style={{ ...styles.navItem, ...(activeTab === 'profile' ? styles.navItemActive : {}) }}
            onClick={() => onTabChange('profile')}
          >
            👤 My Profile
          </button>

          <button 
            style={{ ...styles.navItem, ...(activeTab === 'subscriptions' ? styles.navItemActive : {}) }}
            onClick={() => onTabChange('subscriptions')}
          >
            💳 Subscriptions
          </button>

          {user?.role === 'seller' && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'collaborators' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('collaborators')}
            >
              👥 Team Access
            </button>
          )}

          {user?.role === 'admin' && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'admin' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('admin')}
            >
              🛠️ Admin Panel
            </button>
          )}

          {(user?.role === 'seller' || user?.role === 'collaborator') && (
            <button 
              style={{ ...styles.navItem, ...(activeTab === 'gamification' ? styles.navItemActive : {}) }}
              onClick={() => onTabChange('gamification')}
            >
              🏆 Brand Score
            </button>
          )}

          <button 
            style={{ ...styles.navItem, ...(activeTab === 'notifications' ? styles.navItemActive : {}) }}
            onClick={() => onTabChange('notifications')}
          >
            🔔 Notifications
            {unreadCount > 0 && <span style={styles.sidebarBadge}>{unreadCount}</span>}
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={logout}>
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        style={{ 
          ...styles.mainWrapper, 
          marginLeft: sidebarCollapsed ? '0px' : '260px',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Top Header */}
        <header className="glass" style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '1.2rem',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            >
              {sidebarCollapsed ? '☰' : '◀'}
            </button>
            {user?.role === 'seller' && subscription && (
              <div style={styles.creditStats}>
                <span style={styles.creditLabel}>Credits:</span>
                <span style={{ 
                  ...styles.creditValue, 
                  color: isCreditLow ? '#f87171' : '#34d399',
                  textShadow: isCreditLow ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                }}>
                  {creditsRemaining} / {creditsTotal}
                </span>
                {isCreditLow && (
                  <span style={styles.creditWarning} className="glow-text">⚠️ Credits Low!</span>
                )}
              </div>
            )}
          </div>

          <div style={styles.headerRight}>
            {/* Notification Dropdown Trigger */}
            <div style={{ position: 'relative' }}>
              <button style={styles.iconBtn} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                🔔
                {unreadCount > 0 && <span style={styles.notifBadge}>{unreadCount}</span>}
              </button>

              {showNotifDropdown && (
                <div className="glass" style={styles.notifDropdown}>
                  <div style={styles.dropdownHeader}>
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button style={styles.clearBtn} onClick={markAllAsRead}>Mark all read</button>
                    )}
                  </div>
                  <div style={styles.dropdownList}>
                    {notifications.length === 0 ? (
                      <div style={styles.emptyNotif}>No recent alerts</div>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div 
                          key={notif._id} 
                          style={{ 
                            ...styles.notifItem, 
                            backgroundColor: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)'
                          }}
                          onClick={() => handleNotificationClick(notif._id)}
                        >
                          <div style={styles.notifTitleRow}>
                            <span style={styles.notifItemTitle}>{notif.title}</span>
                            {!notif.isRead && <div style={styles.unreadDot}></div>}
                          </div>
                          <p style={styles.notifMsg}>{notif.message}</p>
                          <span style={styles.notifTime}>
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={styles.dropdownFooter}>
                    <button 
                      style={styles.viewAllBtn} 
                      onClick={() => { onTabChange('notifications'); setShowNotifDropdown(false); }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Summary Badge */}
            <div style={styles.profileBadge}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" style={styles.profilePic} />
              ) : (
                <div style={styles.avatarPlaceholder}>{user?.name?.slice(0, 2)?.toUpperCase() || ''}</div>
              )}
              <div>
                <div style={styles.profileName}>{user?.name}</div>
                <div style={styles.profileRole}>{user?.role === 'seller' ? user.businessInfo?.businessName || 'Business Owner' : user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab View */}
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    position: 'relative',
  },
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    borderTop: 'none',
    borderLeft: 'none',
    borderBottom: 'none',
    zIndex: 100,
    borderRadius: 0,
  },
  brandBox: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1.4rem',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },
  brandName: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  roleTag: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: '0.05em',
  },
  nav: {
    flex: 1,
    padding: '24px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '0.925rem',
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    borderLeft: '4px solid transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    outline: 'none',
  },
  navItemActive: {
    color: '#fff',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    boxShadow: 'inset 0 0 10px rgba(99, 102, 241, 0.05)',
    borderLeft: '4px solid #6366f1',
  },
  sidebarBadge: {
    marginLeft: 'auto',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  sidebarFooter: {
    padding: '16px 12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '0.925rem',
    fontWeight: '600',
    color: '#f87171',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mainWrapper: {
    flex: 1,
    marginLeft: '260px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderRadius: 0,
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  creditStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '8px 16px',
    borderRadius: '12px',
  },
  creditLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  creditValue: {
    fontSize: '0.9rem',
    fontWeight: '800',
  },
  creditWarning: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#f59e0b',
    marginLeft: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  iconBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '1.2rem',
    padding: '8px',
    borderRadius: '10px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'background 0.2s',
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '700',
    minWidth: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #12131a',
  },
  notifDropdown: {
    position: 'absolute',
    top: '48px',
    right: 0,
    width: '320px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dropdownList: {
    maxHeight: '280px',
    overflowY: 'auto',
  },
  emptyNotif: {
    padding: '24px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
    transition: 'background 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  notifTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifItemTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#fff',
  },
  unreadDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
  },
  notifMsg: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: '1.3',
  },
  notifTime: {
    fontSize: '0.65rem',
    color: '#64748b',
  },
  dropdownFooter: {
    padding: '8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    padding: '4px 0',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '1px solid rgba(255,255,255,0.05)',
    paddingLeft: '24px',
  },
  profilePic: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1',
  },
  avatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  profileName: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#fff',
  },
  profileRole: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: '32px',
    animation: 'fadeIn 0.3s ease-out forwards',
  },
};

export default Layout;
