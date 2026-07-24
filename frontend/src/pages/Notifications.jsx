import { useNotifications } from '../context/NotificationContext';

export const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotifIcon = (type) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'alert':
        return '⚠️';
      case 'mention':
        return '💬';
      default:
        return '⚙️';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>🔔 Notifications Center</h2>
          <p style={styles.pageSubtitle}>Review active system alerts, transaction completions, and credit metrics (FR-11)</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllAsRead}>
            ✓ Mark All As Read
          </button>
        )}
      </div>

      <div className="glass" style={styles.listWrapper}>
        {notifications.length === 0 ? (
          <div style={styles.emptyContainer}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>📭</span>
            <p style={{ fontWeight: '700', color: '#fff' }}>All caught up!</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>No notifications are registered on your account.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {notifications.map((notif) => {
              const formattedDate = new Date(notif.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div 
                  key={notif._id} 
                  style={{ 
                    ...styles.notifItem, 
                    borderLeft: notif.isRead ? '4px solid transparent' : '4px solid #6366f1',
                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.03)'
                  }}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <span style={styles.icon}>{getNotifIcon(notif.type)}</span>
                  <div style={styles.body}>
                    <div style={styles.titleRow}>
                      <span style={{ ...styles.notifTitle, fontWeight: notif.isRead ? '600' : '800' }}>{notif.title}</span>
                      <span style={styles.time}>{formattedDate}</span>
                    </div>
                    <p style={styles.msg}>{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <button 
                      style={styles.markReadBtn} 
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
  },
  listWrapper: {
    borderRadius: '16px',
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  notifItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  icon: {
    fontSize: '1.5rem',
    padding: '8px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '16px',
  },
  notifTitle: {
    fontSize: '0.95rem',
    color: '#fff',
  },
  time: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  msg: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  markReadBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    alignSelf: 'center',
    transition: 'all 0.2s',
  },
};
export default Notifications;
