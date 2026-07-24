export const InvoicePDF = ({ transaction, user, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal} id="printable-invoice">
        {/* Actions bar - hidden during print */}
        <div style={styles.actionsBar} className="no-print">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / Save PDF</button>
        </div>

        {/* Invoice Page Container */}
        <div style={styles.invoicePaper}>
          {/* Top banner */}
          <div style={styles.topSection}>
            <div>
              <h1 style={styles.companyName}>BrandBondhu</h1>
              <p style={styles.companySubtitle}>AI Branding & Marketing Automation</p>
              <p style={styles.metaText}>Dhaka, Bangladesh</p>
              <p style={styles.metaText}>support@brandbondhu.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={styles.invoiceTitle}>INVOICE</h2>
              <p style={styles.invoiceNo}>{transaction.invoiceNumber}</p>
              <span style={{ 
                ...styles.statusBadge, 
                backgroundColor: transaction.paymentStatus === 'completed' ? '#065f46' : '#991b1b',
                color: '#fff'
              }}>
                {transaction.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Customer & billing meta info */}
          <div style={styles.metaGrid}>
            <div>
              <h4 style={styles.sectionHeader}>Billed To:</h4>
              <p style={styles.boldText}>{user.name}</p>
              {user.businessInfo?.businessName && (
                <p style={styles.metaText}>{user.businessInfo.businessName}</p>
              )}
              <p style={styles.metaText}>Email: {user.email}</p>
              <p style={styles.metaText}>Phone: {user.phone}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={styles.sectionHeader}>Payment Details:</h4>
              <p style={styles.metaText}><span style={styles.mutedText}>Invoice Date:</span> {formattedDate}</p>
              <p style={styles.metaText}><span style={styles.mutedText}>Payment Gateway:</span> {transaction.paymentGateway.toUpperCase()}</p>
              <p style={styles.metaText}><span style={styles.mutedText}>Transaction ID:</span> {transaction.transactionId}</p>
              <p style={styles.metaText}><span style={styles.mutedText}>Currency:</span> {transaction.currency}</p>
            </div>
          </div>

          {/* Invoice Item Table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, textAlign: 'left' }}>Description</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Quantity</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Rate</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.td, textAlign: 'left' }}>
                  <span style={styles.boldText}>BrandBondhu {transaction.subscriptionTier.toUpperCase()} Subscription</span>
                  <br />
                  <span style={styles.subtext}>30-days subscription with credited AI capabilities.</span>
                </td>
                <td style={{ ...styles.td, textAlign: 'right' }}>1</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{transaction.amount}.00 BDT</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{transaction.amount}.00 BDT</td>
              </tr>
            </tbody>
          </table>

          {/* Invoice Summary */}
          <div style={styles.totalBlock}>
            <div style={styles.totalRow}>
              <span style={styles.metaText}>Subtotal:</span>
              <span style={styles.metaText}>{transaction.amount}.00 BDT</span>
            </div>
            <div style={styles.totalRow}>
              <span style={styles.metaText}>VAT (0%):</span>
              <span style={styles.metaText}>0.00 BDT</span>
            </div>
            <hr style={styles.subDivider} />
            <div style={styles.grandTotalRow}>
              <span style={styles.boldText}>Amount Paid:</span>
              <span style={styles.grandTotalAmount}>{transaction.amount}.00 BDT</span>
            </div>
          </div>

          <div style={styles.footerNote}>
            <p style={styles.footerHeading}>Thank you for your business!</p>
            <p style={styles.metaText}>If you have any questions about this invoice, please reach out to our billing desk.</p>
          </div>
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
    overflowY: 'auto',
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '700px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#12131a',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  invoicePaper: {
    padding: '40px',
    backgroundColor: '#fff',
    color: '#1e293b',
    fontFamily: 'sans-serif',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#4f46e5',
    letterSpacing: '-0.025em',
  },
  companySubtitle: {
    fontSize: '0.85rem',
    color: '#475569',
    fontWeight: '600',
  },
  invoiceTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '0.05em',
  },
  invoiceNo: {
    fontSize: '0.9rem',
    color: '#475569',
    margin: '4px 0 8px',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
    display: 'inline-block',
  },
  divider: {
    margin: '24px 0',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
  },
  metaGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '40px',
    marginBottom: '32px',
  },
  sectionHeader: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    fontWeight: '700',
  },
  boldText: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  metaText: {
    fontSize: '0.85rem',
    color: '#334155',
    lineHeight: '1.4',
  },
  mutedText: {
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '32px',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #cbd5e1',
  },
  th: {
    padding: '12px 8px',
    fontSize: '0.8rem',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '700',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '16px 8px',
    fontSize: '0.85rem',
    color: '#334155',
  },
  subtext: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  totalBlock: {
    marginLeft: 'auto',
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '40px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  subDivider: {
    border: 'none',
    borderTop: '1px solid #cbd5e1',
    margin: '4px 0',
  },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  grandTotalAmount: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#4f46e5',
  },
  footerNote: {
    borderTop: '2px solid #cbd5e1',
    paddingTop: '20px',
    textAlign: 'center',
  },
  footerHeading: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
};

// Inject print css rules
if (typeof document !== 'undefined') {
  const printStyle = document.createElement('style');
  printStyle.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-invoice, #printable-invoice * {
        visibility: visible;
      }
      #printable-invoice {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100%;
        box-shadow: none;
        border: none;
        background-color: #fff !important;
      }
      .no-print {
        display: none !important;
      }
      /* Ensure text is dark and background matches white paper */
      #printable-invoice * {
        color: #1e293b !important;
      }
    }
  `;
  document.head.appendChild(printStyle);
}
