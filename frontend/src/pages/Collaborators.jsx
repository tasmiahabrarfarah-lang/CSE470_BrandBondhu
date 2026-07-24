import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Collaborators = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState(['content']);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const res = await api.profile.getCollaborators();
      setCollaborators(res.data);
    } catch (err) {
      console.error('Failed to load collaborators:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, []);

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
        setPermissions(['content']);
        // Reload list
        await loadCollaborators();
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
        await loadCollaborators();
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

  if (loading && collaborators.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading team members...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>👥 Team Collaborator Access</h2>
      <p style={styles.pageSubtitle}>Invite staff members and manage restricted feature access levels (FR-17)</p>

      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}

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
            <label className="form-label">Configure Permissions (Restricted Modules)</label>
            <div style={styles.permList}>
              <label style={styles.permCheckbox}>
                <input
                  type="checkbox"
                  checked={permissions.includes('content')}
                  onChange={() => handlePermissionChange('content')}
                />
                &nbsp;Content Publishing & calendar (FR-3)
              </label>
              <label style={styles.permCheckbox}>
                <input
                  type="checkbox"
                  checked={permissions.includes('analytics')}
                  onChange={() => handlePermissionChange('analytics')}
                />
                &nbsp;Dashboard reports & analytics (FR-9)
              </label>
              <label style={styles.permCheckbox}>
                <input
                  type="checkbox"
                  checked={permissions.includes('marketplace')}
                  onChange={() => handlePermissionChange('marketplace')}
                />
                &nbsp;Design Marketplace access (FR-7)
              </label>
              <label style={styles.permCheckbox}>
                <input
                  type="checkbox"
                  checked={permissions.includes('faq')}
                  onChange={() => handlePermissionChange('faq')}
                />
                &nbsp;FAQ Assistant configurations (FR-18)
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
          {collaborators.length === 0 ? (
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
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginBottom: '24px',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '24px',
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
};
export default Collaborators;
