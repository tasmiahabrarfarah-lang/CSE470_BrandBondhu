import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PaymentPortal } from '../components/PaymentPortal';
import { InvoicePDF } from '../components/InvoicePDF';

export const Subscriptions = ({ subscription, refreshSub }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activePaymentTxn, setActivePaymentTxn] = useState(null);
  const [selectedInvoiceTxn, setSelectedInvoiceTxn] = useState(null);

  // Error/Success alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const plansRes = await api.subscriptions.getPlans();
      setPlans(plansRes.data);

      if (user?.role === 'seller') {
        const txnsRes = await api.payments.getHistory();
        setTransactions(txnsRes.data);
      }
    } catch (err) {
      console.error('Failed to load subscription settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCheckoutInit = async (tierName, gateway) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.payments.initiate(tierName, gateway);
      if (res.success) {
        setActivePaymentTxn(res.data);
        setSelectedPlan(null); // Close selection modal
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    }
  };

  const handlePaymentSuccess = async (result) => {
    setActivePaymentTxn(null);
    setSuccessMsg('Thank you! Your subscription was successfully upgraded.');
    await refreshSub();
    await fetchBillingData(); // Reload invoice lists
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading subscription portal...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}>💳 Subscription & Billing</h2>
      <p style={styles.pageSubtitle}>Select plan benefits, verify transactions, and manage billing invoices</p>

      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

      {/* Active plan status overview */}
      <div className="glass card" style={styles.activeCard}>
        <div style={styles.activeDetails}>
          <span style={styles.activeLabel}>CURRENT ACTIVE SERVICE PLAN</span>
          <h2 style={styles.activePlan}>{subscription?.tier?.toUpperCase() || 'FREE'} PLAN</h2>
          <p style={styles.activeText}>
            Status: <span style={{ color: '#10b981', fontWeight: '700' }}>{subscription?.status?.toUpperCase() || 'ACTIVE'}</span>
            &nbsp;|&nbsp;
            Renews/Expires: {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div style={styles.activeMeter}>
          <div style={styles.meterText}>
            <span>AI Operation Credits</span>
            <span>{subscription?.credits?.current ?? 0} / {subscription?.credits?.total ?? 20}</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${Math.min(100, (((subscription?.credits?.current ?? 0) / (subscription?.credits?.total ?? 20)) * 100))}%`
            }} />
          </div>
        </div>
      </div>

      {/* Pricing options list */}
      <h3 style={styles.sectionHeader}>Available Plans</h3>
      <div className="grid grid-3">
        {Object.entries(plans).map(([tierKey, plan]) => {
          if (tierKey === 'free') return null; // Free is default, no buy btn
          const isActive = subscription?.tier === tierKey;

          return (
            <div key={tierKey} className="card glass" style={{
              ...styles.pricingCard,
              borderColor: isActive ? '#6366f1' : 'rgba(255,255,255,0.08)'
            }}>
              {isActive && <div style={styles.activeBadge}>Current Plan</div>}
              <div>
                <h4 style={styles.tierName}>{plan.name}</h4>
                <div style={styles.tierPrice}>{plan.price} BDT<span style={{ fontSize: '0.85rem' }}>/month</span></div>
                <span className="badge badge-primary" style={{ marginTop: '6px' }}>{plan.credits} Credits</span>
              </div>
              
              <ul style={styles.featuresList}>
                {plan.features.map((feat, idx) => (
                  <li key={idx}>✓ {feat}</li>
                ))}
              </ul>

              {user?.role === 'seller' ? (
                <button 
                  className={`btn ${isActive ? 'btn-secondary btn-disabled' : 'btn-primary'}`}
                  onClick={() => !isActive && setSelectedPlan({ key: tierKey, ...plan })}
                  disabled={isActive}
                  style={styles.subscribeBtn}
                >
                  {isActive ? 'Your Plan' : 'Subscribe Now'}
                </button>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                  Restricted to Seller accounts
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Transaction billing log table (Only for Sellers) */}
      {user?.role === 'seller' && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={styles.sectionHeader}>Billing History & Invoices</h3>
          <div className="glass" style={styles.tableWrapper}>
            {transactions.length === 0 ? (
              <p style={styles.emptyTableText}>No payments logged yet.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeader}>
                    <th style={styles.th}>Invoice Date</th>
                    <th style={styles.th}>Invoice Number</th>
                    <th style={styles.th}>Purchased Plan</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Gateway</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn._id} style={styles.tr}>
                      <td style={styles.td}>{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td style={styles.td}>{txn.invoiceNumber}</td>
                      <td style={styles.td}>{txn.subscriptionTier.toUpperCase()}</td>
                      <td style={styles.td}>{txn.amount} BDT</td>
                      <td style={styles.td}>{txn.paymentGateway.toUpperCase()}</td>
                      <td style={styles.td}>
                        <span className={`badge ${txn.paymentStatus === 'completed' ? 'badge-success' : 'badge-danger'}`}>
                          {txn.paymentStatus}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {txn.paymentStatus === 'completed' && (
                          <button 
                            className="btn btn-secondary" 
                            style={styles.invoiceBtn}
                            onClick={() => setSelectedInvoiceTxn(txn)}
                          >
                            PDF Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Select payment gateway (bKash / Nagad / Card) */}
      {selectedPlan && (
        <div style={styles.modalOverlay}>
          <div className="glass card animate-fade-in" style={styles.gatewayModal}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Choose Payment Method</h3>
              <button style={styles.closeBtn} onClick={() => setSelectedPlan(null)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px' }}>
              Confirm your checkout selection for {selectedPlan.name} ({selectedPlan.price} BDT)
            </p>
            <div style={styles.gatewayRow}>
              <button 
                style={{ ...styles.gatewayCard, borderLeft: '6px solid #e2125f' }}
                onClick={() => handleCheckoutInit(selectedPlan.key, 'bkash')}
              >
                💥 bKash Mobile Wallet
              </button>
              <button 
                style={{ ...styles.gatewayCard, borderLeft: '6px solid #f36e21' }}
                onClick={() => handleCheckoutInit(selectedPlan.key, 'nagad')}
              >
                🔥 Nagad Mobile Wallet
              </button>
              <button 
                style={{ ...styles.gatewayCard, borderLeft: '6px solid #0284c7' }}
                onClick={() => handleCheckoutInit(selectedPlan.key, 'card')}
              >
                💳 Credit / Debit Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Active Payment Portal Wizard */}
      {activePaymentTxn && (
        <PaymentPortal 
          transaction={activePaymentTxn}
          onSuccess={handlePaymentSuccess}
          onClose={() => setActivePaymentTxn(null)}
        />
      )}

      {/* Modal 3: View Invoice PDF */}
      {selectedInvoiceTxn && (
        <InvoicePDF 
          transaction={selectedInvoiceTxn}
          user={user}
          onClose={() => setSelectedInvoiceTxn(null)}
        />
      )}
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
    marginBottom: '28px',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '28px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    marginBottom: '28px',
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '30px 40px',
    flexWrap: 'wrap',
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(217, 70, 239, 0.03) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    marginBottom: '32px',
  },
  activeDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  activeLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: '0.05em',
  },
  activePlan: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  activeText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  activeMeter: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  meterText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    height: '8px',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: '9999px',
  },
  sectionHeader: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '20px',
  },
  pricingCard: {
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'space-between',
    backgroundColor: '#12131a',
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  tierName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#fff',
  },
  tierPrice: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    marginTop: '6px',
  },
  featuresList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    margin: '10px 0',
  },
  subscribeBtn: {
    width: '100%',
  },
  tableWrapper: {
    padding: '12px',
    borderRadius: '14px',
    overflowX: 'auto',
  },
  emptyTableText: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    textAlign: 'left',
  },
  trHeader: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    padding: '12px 16px',
    color: '#64748b',
    fontWeight: '700',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  td: {
    padding: '16px',
    color: '#cbd5e1',
  },
  invoiceBtn: {
    padding: '6px 12px',
    fontSize: '0.75rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
    backdropFilter: 'blur(8px)',
  },
  gatewayModal: {
    width: '100%',
    maxWidth: '440px',
    padding: '30px',
    backgroundColor: '#12131a',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.6rem',
    cursor: 'pointer',
  },
  gatewayRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  gatewayCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '16px',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
};
