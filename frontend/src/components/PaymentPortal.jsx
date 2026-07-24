import { useState } from 'react';
import { api } from '../services/api';

export const PaymentPortal = ({ transaction, onSuccess, onClose }) => {
  const [step, setStep] = useState(1); // 1: Number/Details, 2: OTP, 3: PIN, 4: Processing
  const [gateway, setGateway] = useState(transaction.paymentGateway);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Initiating transaction secure line...');

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (gateway === 'card') {
      if (step === 1) {
        if (!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
          setError('Please fill in all card details');
          return;
        }
        setStep(4);
        processConfirm();
      }
    } else {
      if (step === 1) {
        if (!phoneNumber || phoneNumber.length < 11) {
          setError('Please enter a valid mobile number');
          return;
        }
        setProcessingMsg(`Sending OTP to ${phoneNumber}...`);
        setStep(4);
        setTimeout(() => {
          setStep(2);
        }, 1500);
      } else if (step === 2) {
        if (!otp || otp.length < 6) {
          setError('Please enter the 6-digit OTP verification code');
          return;
        }
        setStep(3);
      } else if (step === 3) {
        if (!pin || pin.length < 4) {
          setError('Please enter your secure 4-digit PIN');
          return;
        }
        setStep(4);
        processConfirm();
      }
    }
  };

  const processConfirm = async () => {
    setProcessingMsg('Verifying credentials with billing gateway...');
    try {
      setTimeout(async () => {
        try {
          const res = await api.payments.confirm(transaction.transactionId);
          if (res.success) {
            setProcessingMsg('Success! Finalizing subscription setup...');
            setTimeout(() => {
              onSuccess(res.data);
            }, 1000);
          } else {
            setError(res.message || 'Payment confirmation failed');
            setStep(1);
          }
        } catch (err) {
          setError(err.message || 'Payment confirmation failed');
          setStep(1);
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
      setStep(1);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            {gateway === 'bkash' && (
              <span style={{ ...styles.logoBadge, backgroundColor: '#e2125f', color: '#fff' }}>bKash</span>
            )}
            {gateway === 'nagad' && (
              <span style={{ ...styles.logoBadge, backgroundColor: '#f36e21', color: '#fff' }}>Nagad</span>
            )}
            {gateway === 'card' && (
              <span style={{ ...styles.logoBadge, backgroundColor: '#0284c7', color: '#fff' }}>Secure Card Checkout</span>
            )}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Content Body */}
        <div style={styles.body}>
          <div style={styles.summaryBox}>
            <span style={styles.summaryLabel}>PAYING FOR TIER:</span>
            <span style={styles.summaryTier}>{transaction.subscriptionTier.toUpperCase()}</span>
            <span style={styles.summaryAmount}>{transaction.amount} BDT</span>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          {step === 1 && gateway !== 'card' && (
            <form onSubmit={handleNextStep} style={styles.form}>
              <p style={styles.instruction}>Enter your personal {gateway} account mobile number</p>
              <div className="form-group">
                <label className="form-label">Account Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 017XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                PROCEED TO OTP
              </button>
            </form>
          )}

          {step === 1 && gateway === 'card' && (
            <form onSubmit={handleNextStep} style={styles.form}>
              <p style={styles.instruction}>Enter your credit or debit card details</p>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4000 1234 5678 9010"
                  maxLength="19"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="XXX"
                    maxLength="3"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                PAY NOW SECURELY
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} style={styles.form}>
              <p style={styles.instruction}>A 6-digit verification code has been simulated and sent to your mobile.</p>
              <div className="form-group">
                <label className="form-label">Verification OTP Code (Enter any 6 digits)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 123456"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                VERIFY OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleNextStep} style={styles.form}>
              <p style={styles.instruction}>Enter your secret {gateway} account PIN code.</p>
              <div className="form-group">
                <label className="form-label">Account PIN (Enter any 4-5 digits)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••"
                  maxLength="5"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                CONFIRM DEBIT
              </button>
            </form>
          )}

          {step === 4 && (
            <div style={styles.processing}>
              <div style={styles.spinner}></div>
              <p style={styles.processingText}>{processingMsg}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={styles.footer}>
          <span style={styles.footerSec}>🛡️ SSL 256-bit encrypted secure checkout connection.</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.3s ease-out forwards',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logoBadge: {
    padding: '6px 14px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.8rem',
    cursor: 'pointer',
    padding: '0 4px',
    transition: 'color 0.2s',
  },
  body: {
    padding: '24px',
  },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '700',
  },
  summaryTier: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#818cf8',
  },
  summaryAmount: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#10b981',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    marginBottom: '16px',
  },
  instruction: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '10px',
  },
  processing: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.05)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  processingText: {
    marginTop: '20px',
    fontSize: '0.9rem',
    color: '#94a3b8',
    textAlign: 'center',
  },
  footer: {
    padding: '12px 20px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    textAlign: 'center',
  },
  footerSec: {
    fontSize: '0.7rem',
    color: '#64748b',
  },
};

// Inject spin keyframe rule globally
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
