import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Register = ({ onNavigate }) => {
  const { register, error, setError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seller');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await register({
        name,
        email,
        phone,
        password,
        role,
        businessName: role === 'seller' ? businessName : undefined,
        industry: role === 'seller' ? industry : undefined,
      });

      if (res.success) {
        onNavigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Join BrandBondhu</h2>
          <p style={styles.subtitle}>Start automating your brand and catalog content</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shakib Al Hasan"
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
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
            <label className="form-label">Account Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Register As</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="seller">Seller (Business Owner)</option>
              <option value="designer">Designer (Freelancer)</option>
            </select>
          </div>

          {role === 'seller' && (
            <div style={styles.businessSection} className="animate-fade-in">
              <div className="form-group">
                <label className="form-label">Business / Shop Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Royal Craft Dhaka"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required={role === 'seller'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Industry Sector</label>
                <select
                  className="form-select"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required={role === 'seller'}
                >
                  <option value="">Select industry...</option>
                  <option value="F-Commerce">F-Commerce (Facebook Shop)</option>
                  <option value="Clothing & Apparel">Clothing & Apparel</option>
                  <option value="Food & Grocery">Food & Grocery</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Handicrafts">Handicrafts</option>
                  <option value="Services">Other Services</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Complete Register'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account? </span>
          <button style={styles.loginBtn} onClick={() => onNavigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: '20px',
    padding: '40px 32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.3s ease-out forwards',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '6px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  businessSection: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '20px',
    marginTop: '10px',
    marginBottom: '10px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '16px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  loginBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
