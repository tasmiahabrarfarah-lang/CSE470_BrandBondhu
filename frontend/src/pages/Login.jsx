import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onNavigate }) => {
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      // Backend returns verificationRequired:true when account is pending OTP verification
      if (err.verificationRequired) {
        setError(null);
        onNavigate(`/verify-otp?email=${encodeURIComponent(err.email || email)}`);
      }
      // Other errors are already set in AuthContext via setError
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleMock = () => {
    setError('Google OAuth integration is mock-only in local demo mode.');
  };

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to access your BrandBondhu workstation</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Password</label>
              <button 
                type="button" 
                style={styles.forgotBtn}
                onClick={() => onNavigate('/forgot-password')}
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.dividerBox}>
          <hr style={styles.line} />
          <span style={styles.dividerText}>or continue with</span>
          <hr style={styles.line} />
        </div>

        <button className="btn btn-secondary" style={styles.googleBtn} onClick={handleGoogleMock}>
          Google Account
        </button>

        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account? </span>
          <button style={styles.registerBtn} onClick={() => onNavigate('/register')}>
            Register Now
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
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    borderRadius: '20px',
    padding: '40px 32px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.3s ease-out forwards',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
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
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '10px',
  },
  dividerBox: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  line: {
    flex: 1,
    border: 'none',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    padding: '0 12px',
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  googleBtn: {
    width: '100%',
    padding: '12px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  registerBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
