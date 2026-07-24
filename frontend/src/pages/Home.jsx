import { useAuth } from '../context/AuthContext';

export const Home = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      onNavigate('/dashboard');
    } else {
      onNavigate('/register');
    }
  };

  return (
    <div style={styles.container}>
      {/* Landing Navbar */}
      <nav className="glass" style={styles.nav}>
        <div style={styles.logo}>BrandBondhu</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {isAuthenticated ? (
            <button className="btn btn-primary" onClick={() => onNavigate('/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => onNavigate('/login')}>
                Sign In
              </button>
              <button className="btn btn-primary" onClick={() => onNavigate('/register')}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.badge} className="glow-text">🇧🇩 MADE FOR BANGLADESHI SELLERS & FREELANCERS</div>
        <h1 style={styles.heroTitle}>
          Power Your Business Brand <br />
          <span className="text-gradient-rainbow">With AI Marketing Automation</span>
        </h1>
        <p style={styles.heroSub}>
          Generate stunning logos, captions, banner templates in Bangla and English, and schedule posts.
          Connect with professional designers and optimize engagement using intelligent sentiment tracking.
        </p>
        <div style={styles.ctaRow}>
          <button className="btn btn-primary" style={styles.heroCta} onClick={handleStart}>
            Start Branding Free
          </button>
          <a href="#pricing" className="btn btn-secondary" style={styles.heroCta}>
            View Subscription Plans
          </a>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>What does BrandBondhu offer?</h2>
        <div className="grid grid-3">
          <div className="card glass glass-hover" style={styles.featureCard}>
            <div style={styles.featureIcon}>🎨</div>
            <h3 style={styles.featureName}>AI Brand Identity</h3>
            <p style={styles.featureDesc}>Instantly create customized color palettes, typography, taglines, and professional logos adjusted to your industry.</p>
          </div>
          <div className="card glass glass-hover" style={styles.featureCard}>
            <div style={styles.featureIcon}>📅</div>
            <h3 style={styles.featureName}>Calendar Scheduling</h3>
            <p style={styles.featureDesc}>Generate posts captions in Bangla and English, and schedule content publishing across social networks automatically.</p>
          </div>
          <div className="card glass glass-hover" style={styles.featureCard}>
            <div style={styles.featureIcon}>💬</div>
            <h3 style={styles.featureName}>Sentiment Tracker</h3>
            <p style={styles.featureDesc}>Link Facebook pages to parse comment trends. Flag angry customer feedback and auto-generate AI response drafts instantly.</p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" style={styles.pricingSection}>
        <h2 style={styles.sectionTitle}>Simple, Growth-Driven Pricing</h2>
        <p style={styles.sectionSub}>No hidden fees. Select the plan that fits your business scale.</p>
        
        <div className="grid grid-4" style={{ marginTop: '40px' }}>
          {/* Free Plan */}
          <div className="card glass" style={styles.priceCard}>
            <h3 style={styles.tierName}>Free Starter</h3>
            <div style={styles.priceVal}>0 <span style={{ fontSize: '1rem' }}>BDT / mo</span></div>
            <p style={styles.tierDesc}>Ideal for testing out automated copy generation features.</p>
            <ul style={styles.featuresList}>
              <li>✨ 20 AI credits monthly</li>
              <li>✍️ AI Bangla Caption Generator</li>
              <li>📅 Basic posting logs</li>
              <li>🔒 Secure email auth</li>
            </ul>
            <button className="btn btn-secondary" style={styles.tierCta} onClick={handleStart}>
              {isAuthenticated ? 'Active Tier' : 'Get Started'}
            </button>
          </div>

          {/* Basic Plan */}
          <div className="card glass" style={styles.priceCard}>
            <h3 style={styles.tierName}>Basic Brand</h3>
            <div style={styles.priceVal}>999 <span style={{ fontSize: '1rem' }}>BDT / mo</span></div>
            <p style={styles.tierDesc}>Perfect for early home businesses and Facebook pages.</p>
            <ul style={styles.featuresList}>
              <li>✨ 100 AI credits monthly</li>
              <li>✍️ Captions & Bangla Taglines</li>
              <li>📂 1 Saved active Brand Kit</li>
              <li>🛡️ bKash/Nagad checkout gateway</li>
            </ul>
            <button className="btn btn-secondary" style={styles.tierCta} onClick={handleStart}>
              Upgrade Now
            </button>
          </div>

          {/* Premium Plan (Recommended) */}
          <div className="card glass" style={{ ...styles.priceCard, border: '2px solid #6366f1', position: 'relative' }}>
            <div style={styles.popularBadge}>POPULAR</div>
            <h3 style={styles.tierName}>Premium Growth</h3>
            <div style={styles.priceVal}>2,499 <span style={{ fontSize: '1rem' }}>BDT / mo</span></div>
            <p style={styles.tierDesc}>For scaling companies needing collaborator support.</p>
            <ul style={styles.featuresList}>
              <li>✨ 300 AI credits monthly</li>
              <li>🎨 Active Brand Logo variations</li>
              <li>👥 Up to 3 Collaborator invites</li>
              <li>📂 5 Saved active Brand Kits</li>
              <li>🚀 Priority alert notifications</li>
            </ul>
            <button className="btn btn-primary" style={styles.tierCta} onClick={handleStart}>
              Go Premium
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="card glass" style={styles.priceCard}>
            <h3 style={styles.tierName}>Enterprise Scale</h3>
            <div style={styles.priceVal}>4,999 <span style={{ fontSize: '1rem' }}>BDT / mo</span></div>
            <p style={styles.tierDesc}>For commercial storefronts and marketing agencies.</p>
            <ul style={styles.featuresList}>
              <li>✨ 1,000 AI credits monthly</li>
              <li>👥 Unlimited Collaborator invites</li>
              <li>📁 Unlimited Brand Kits</li>
              <li>📊 Full competitor analytics</li>
              <li>📞 Dedicated account manager</li>
            </ul>
            <button className="btn btn-secondary" style={styles.tierCta} onClick={handleStart}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 BrandBondhu. Made with ❤️ in Bangladesh. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 5%',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderRadius: 0,
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
    -webkit-background-clip: 'text',
    -webkit-text-fill-color: 'transparent',
    letterSpacing: '-0.025em',
  },
  hero: {
    padding: '120px 5% 80px',
    textAlign: 'center',
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#06b6d4',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    padding: '6px 16px',
    borderRadius: '9999px',
    marginBottom: '24px',
    letterSpacing: '0.05em',
  },
  heroTitle: {
    fontSize: '3.5rem',
    lineHeight: '1.2',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
    marginBottom: '24px',
  },
  heroSub: {
    fontSize: '1.15rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  ctaRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroCta: {
    padding: '14px 28px',
    fontSize: '1rem',
  },
  section: {
    padding: '80px 5%',
    maxWidth: '1200px',
    margin: '0 auto w',
    width: '100%',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '16px',
    letterSpacing: '-0.025em',
  },
  sectionSub: {
    fontSize: '1rem',
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  },
  featureCard: {
    alignItems: 'center',
    textAlign: 'center',
    padding: '36px 24px',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '16px',
  },
  featureName: {
    fontSize: '1.25rem',
    color: '#fff',
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  pricingSection: {
    padding: '80px 5%',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  priceCard: {
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'space-between',
    backgroundColor: '#12131a',
  },
  tierName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#fff',
  },
  priceVal: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#fff',
  },
  tierDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    lineHeight: '1.4',
  },
  featuresList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontSize: '0.9rem',
    color: '#cbd5e1',
    margin: '10px 0',
  },
  tierCta: {
    width: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '4px 12px',
    borderRadius: '9999px',
    letterSpacing: '0.05em',
  },
  footer: {
    padding: '40px 5%',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    color: '#64748b',
    fontSize: '0.85rem',
    marginTop: 'auto',
  },
};
