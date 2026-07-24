import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const VerifyOTP = ({ onNavigate }) => {
  const { verifyOTP, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError('Invalid verification redirect. Please go back and signup again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) return;

    setSubmitting(true);
    setError(null);
    try {
      await verifyOTP(email, otp);
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
          <div style={styles.icon}>✉️</div>
          <h2 style={styles.title}>Confirm Your Identity</h2>
          <p style={styles.subtitle}>We sent a simulated 6-digit OTP verification code to:</p>
          <span style={styles.emailBadge}>{email}</span>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Enter 6-Digit OTP</label>
            <input
              type="text"
              className="form-input"
              style={styles.otpInput}
              placeholder="e.g. 123456"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={submitting || !email}
          >
            {submitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="card" style={styles.infoBox}>
          <h4>💡 Developer Local Run Tip</h4>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
            No real email SMTP is required! Since this is running in development mode, the OTP is printed directly in the backend terminal logs. Check your running node console.
          </p>
        </div>

        <div style={styles.footer}>
          <button style={styles.backBtn} onClick={() => onNavigate('/register')}>
            ← Back to Registration
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
    marginBottom: '28px',
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '12px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '6px',
    marginBottom: '8px',
  },
  emailBadge: {
    display: 'inline-block',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
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
  otpInput: {
    textAlign: 'center',
    fontSize: '1.5rem',
    letterSpacing: '0.3em',
    padding: '10px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '10px',
  },
  infoBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '12px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '20px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
