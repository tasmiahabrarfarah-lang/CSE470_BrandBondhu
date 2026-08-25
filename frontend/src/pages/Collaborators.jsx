import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Collaborators = () => {
  const [activeTab, setActiveTab] = useState('team');
  const [collaborators, setCollaborators] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState(['content', 'products']);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'team') {
        const res = await api.profile.getCollaborators();
        setCollaborators(res.data);
      } else if (activeTab === 'audit') {
        const res = await api.profile.getAuditLogs();
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load collaborator/audit data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.profile.inviteCollaborator({
        name,
        email,
        phone,
        password,
        permissions,
      });

      if (res.success) {
        setSuccessMsg('Staff collaborator invited and registered successfully!');
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setPermissions(['content', 'products']);
        // Reload list
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invitation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to revoke access for this collaborator? They will be signed out immediately.')) {
      try {
        await api.profile.removeCollaborator(id);
        setSuccessMsg('Collaborator access successfully revoked.');
        await loadData();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to remove collaborator.');
      }
    }
  };

  const handlePermissionChange = (perm) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>👥 Team Collaborator Access Management</h2>
      <p style={styles.pageSubtitle}>Invite staff members, assign restricted feature permissions, and track action audit logs</p>

      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}

      {/* Navigation Sub-Tabs */}
      <div style={styles.tabContainer}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'team' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('team')}
        >
          👥 Active Staff Members
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'audit' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('audit')}
        >
          📜 Team Action Audit Log
        </button>
      </div>

      {activeTab === 'team' && (
        <div style={styles.layout}>
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="glass card" style={styles.inviteCard}>
            <h3 style={styles.sectionHeader}>Invite New Staff Operator</h3>
            
            <div className="form-group">
              <label className="form-label">Staff Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Asif Mahmud"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="operator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Permissions selectors */}
            <div className="form-group">
              <label className="form-label">Configure Feature Permissions</label>
              <div style={styles.permList}>
                <label style={styles.permCheckbox}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('products')}
                    onChange={() => handlePermissionChange('products')}
                  />
                  &nbsp;Product Catalog Management
                </label>
                <label style={styles.permCheckbox}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('marketplace')}
                    onChange={() => handlePermissionChange('marketplace')}
                  />
                  &nbsp;Design Marketplace access
                </label>
                <label style={styles.permCheckbox}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('content')}
                    onChange={() => handlePermissionChange('content')}
                  />
                  &nbsp;Content Publishing & calendar
                </label>
                <label style={styles.permCheckbox}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('analytics')}
                    onChange={() => handlePermissionChange('analytics')}
                  />
                  &nbsp;Dashboard reports & analytics
                </label>
                <label style={styles.permCheckbox}>
                  <input
                    type="checkbox"
                    checked={permissions.includes('faq')}
                    onChange={() => handlePermissionChange('faq')}
                  />
                  &nbsp;FAQ Assistant configurations
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Registering Staff...' : 'Create Staff Member'}
            </button>
          </form>

          {/* Collaborators List */}
          <div className="glass card" style={styles.listCard}>
            <h3 style={styles.sectionHeader}>Active Business Collaborators</h3>
            {loading ? (
              <p style={styles.emptyText}>Loading staff list...</p>
            ) : collaborators.length === 0 ? (
              <p style={styles.emptyText}>No staff members added to this business profile yet.</p>
            ) : (
              <div style={styles.collList}>
                {collaborators.map((coll) => (
                  <div key={coll._id} style={styles.collItem}>
                    <div style={styles.collMeta}>
                      <span style={styles.collName}>{coll.name}</span>
                      <span style={styles.collContacts}>{coll.email} | {coll.phone}</span>
                      
                      <div style={styles.badgesRow}>
                        {coll.permissions.map((perm, idx) => (
                          <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.6rem' }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger" 
                      style={styles.revokeBtn}
                      onClick={() => handleRemove(coll._id)}
                    >
                      Revoke Access
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Audit Log Timeline (FR-17.3) */}
      {activeTab === 'audit' && (
        <div className="glass card" style={styles.auditCard}>
          <h3 style={styles.sectionHeader}>📜 Team Activity & Action Audit Log</h3>
          {loading ? (
            <p style={styles.emptyText}>Loading audit logs...</p>
          ) : auditLogs.length === 0 ? (
            <p style={styles.emptyText}>No collaborator activities recorded yet.</p>
          ) : (
            <div style={styles.auditTimeline}>
              {auditLogs.map((log) => (
                <div key={log._id} style={styles.auditItem}>
                  <div style={styles.auditTime}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                  <div style={styles.auditBody}>
                    <span style={styles.auditPerformer}>
                      👤 {log.performerName} ({log.performerRole})
                    </span>
                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                      {log.action}
                    </span>
                    <p style={styles.auditDetails}>{log.details}</p>
                    {log.targetResource && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Resource: {log.targetResource}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginBottom: '8px',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px',
    marginBottom: '16px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
  },
  tabBtnActive: {
    color: '#fff',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    alignItems: 'flex-start',
  },
  inviteCard: {
    padding: '30px',
  },
  sectionHeader: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '8px',
    marginBottom: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  permList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px',
  },
  permCheckbox: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    marginTop: '16px',
  },
  listCard: {
    padding: '30px',
    backgroundColor: '#12131a',
  },
  auditCard: {
    padding: '30px',
  },
  emptyText: {
    padding: '24px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  collList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  collItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '16px',
    borderRadius: '12px',
  },
  collMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  collName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#fff',
  },
  collContacts: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  badgesRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  revokeBtn: {
    padding: '6px 12px',
    fontSize: '0.75rem',
  },
  auditTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  auditItem: {
    display: 'flex',
    gap: '16px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '12px 16px',
    borderRadius: '8px',
    alignItems: 'flex-start',
  },
  auditTime: {
    fontSize: '0.75rem',
    color: '#64748b',
    minWidth: '150px',
  },
  auditBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  auditPerformer: {
    fontWeight: '700',
    color: '#38bdf8',
    fontSize: '0.85rem',
  },
  auditDetails: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
};

export default Collaborators;
