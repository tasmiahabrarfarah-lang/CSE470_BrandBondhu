import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { user, updateProfile, deactivateAccount, deleteAccount } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');

  // Business states
  const [businessName, setBusinessName] = useState(user?.businessInfo?.businessName || '');
  const [industry, setIndustry] = useState(user?.businessInfo?.industry || '');
  const [website, setWebsite] = useState(user?.businessInfo?.website || '');
  const [fbPageUrl, setFbPageUrl] = useState(user?.businessInfo?.fbPageUrl || '');

  // Portfolio states
  const [bio, setBio] = useState(user?.portfolioInfo?.bio || '');
  const [skills, setSkills] = useState(user?.portfolioInfo?.skills?.join(', ') || '');
  const [hourlyRate, setHourlyRate] = useState(user?.portfolioInfo?.hourlyRate || 0);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        name,
        phone,
        profilePicture,
      };

      if (user.role === 'seller' || user.role === 'collaborator') {
        payload.businessInfo = {
          businessName,
          industry,
          website,
          fbPageUrl,
        };
      }

      if (user.role === 'designer') {
        payload.portfolioInfo = {
          bio,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          hourlyRate: parseFloat(hourlyRate) || 0,
        };
      }

      await updateProfile(payload);
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate your account? You will be logged out.')) {
      try {
        await deactivateAccount();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('WARNING: THIS IS PERMANENT. Are you sure you want to delete your account? All subscriptions, transactions, and user profiles will be erased.')) {
      try {
        await deleteAccount();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>👤 Profile Settings</h2>
      <p style={styles.pageSubtitle}>Update your personal identity, company profiles, or delete your credentials</p>

      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}

      <div style={styles.layout}>
        {/* Settings Form */}
        <form onSubmit={handleSave} className="glass card" style={styles.formCard}>
          <h3 style={styles.sectionHeader}>Personal Information</h3>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Phone</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Profile Picture URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://images.unsplash.com/photo-X"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
            />
          </div>

          {/* Seller details */}
          {(user?.role === 'seller' || user?.role === 'collaborator') && (
            <div style={styles.roleFields}>
              <h3 style={styles.sectionHeader}>Business Details</h3>
              
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Industry Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://myshop.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Facebook Page URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://facebook.com/myshop"
                  value={fbPageUrl}
                  onChange={(e) => setFbPageUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Designer details */}
          {user?.role === 'designer' && (
            <div style={styles.roleFields}>
              <h3 style={styles.sectionHeader}>Designer Portfolio</h3>
              
              <div className="form-group">
                <label className="form-label">Bio (Experience details)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skills (Comma-separated tags)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Logo Design, Banner Editor, Typography, Copywriting"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hourly Design Rate (BDT)</label>
                <input
                  type="number"
                  className="form-input"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving changes...' : 'Save Settings'}
          </button>
        </form>

        {/* Danger zone controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass card" style={styles.dangerCard}>
            <h3 style={{ ...styles.sectionHeader, color: '#ef4444' }}>⚠️ Account Actions</h3>
            <p style={styles.dangerText}>
              Temporarily deactivate your profile to hide your portfolio or shop, or permanently delete all associated credit history.
            </p>
            <div style={styles.dangerBtnGroup}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDeactivate}>
                Deactivate Profile
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Account
              </button>
            </div>
          </div>
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
  formCard: {
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
  roleFields: {
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  saveBtn: {
    marginTop: '16px',
    width: '100%',
  },
  dangerCard: {
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '30px',
  },
  dangerText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  dangerBtnGroup: {
    display: 'flex',
    gap: '12px',
  },
};
export default Profile;
