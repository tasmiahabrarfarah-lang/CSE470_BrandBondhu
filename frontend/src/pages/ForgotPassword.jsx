import { useState } from 'react';
import { api } from '../services/api';

export const ForgotPassword = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Reset Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await api.auth.forgotPassword({ email });
      if (res.success) {
        setSuccessMsg(res.message || 'OTP sent successfully. Check your terminal/email.');
        setStep(2);
      } else {
        setError(res.message || 'Failed to request password reset.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return;

    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await api.auth.resetPassword({ email, otp, newPassword });
      if (res.success) {
        setSuccessMsg('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          onNavigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🔑</div>
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>
            {step === 1 
              ? 'Enter your email to receive a password reset OTP verification code' 
              : 'Enter the code sent to you along with your new password'}
          </p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Request OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div className="form-group">
              <label className="form-label">6-Digit Verification OTP</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 123456"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <button style={styles.backBtn} onClick={() => onNavigate('/login')}>
            ← Back to Login
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
    padding: '40px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '8px',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid #10b981',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '20px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
};
