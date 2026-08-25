import React from 'react';

export const StyleGuidePDF = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const {
    documentId,
    exportedAt,
    title,
    businessInfo,
    brandingAssets,
    rulesAndGuidelines,
    customNotes,
    sectionsIncluded,
    theme,
  } = data;

  const formattedDate = new Date(exportedAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const logo = brandingAssets?.logo || {};
  const palette = brandingAssets?.palette || brandingAssets?.colorPalette || [];
  const typography = brandingAssets?.typography || {};
  const taglines = brandingAssets?.taglines || [];

  return (
    <div style={styles.overlay}>
      <div className="glass" style={styles.modal} id="printable-styleguide">
        {/* Top Control Bar (Hidden on print) */}
        <div style={styles.actionsBar} className="no-print">
          <div>
            <span style={styles.docIdBadge}>Document ID: {documentId || 'SG-EXPORT'}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close Preview</button>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / Save PDF</button>
          </div>
        </div>

        {/* Printable Style Guide Paper Container */}
        <div style={{ ...styles.paper, backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#1e293b' }}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <span style={styles.brandTag}>BrandBondhu • Official Brand Guidelines</span>
              <h1 style={styles.docTitle}>{title || `${businessInfo?.businessName} Brand Style Guide`}</h1>
              <p style={styles.subtitle}>{businessInfo?.businessName} • {businessInfo?.industry}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={styles.metaLabel}>Date Issued:</p>
              <p style={styles.metaValue}>{formattedDate}</p>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Section 1: Logo & Usage Rules */}
          {(!sectionsIncluded || sectionsIncluded.logoRules) && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. Logo Identity & Clear Space Rules</h3>
              <div style={styles.gridTwo}>
                <div style={styles.logoPreviewBox}>
                  {logo.svgCode ? (
                    <div dangerouslySetInnerHTML={{ __html: logo.svgCode }} style={{ width: '120px', height: '120px' }} />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${logo.primaryColor || '#6366f1'}, ${logo.accentColor || '#d946ef'})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                    }}>
                      {businessInfo?.businessName?.charAt(0) || 'B'}
                    </div>
                  )}
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Style: {logo.style || 'Modern Minimalist'}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Primary: {logo.primaryColor || '#6366f1'} | Accent: {logo.accentColor || '#d946ef'}</p>
                  </div>
                </div>

                <div style={styles.rulesList}>
                  <h4 style={styles.subHeader}>Usage Recommendations (Do's):</h4>
                  <ul>
                    {(rulesAndGuidelines?.logoDos || [
                      'Maintain clear padding equal to 50% logo height.',
                      'Use full-color logo on contrasting backgrounds.',
                    ]).map((doItem, idx) => (
                      <li key={idx} style={styles.doItem}>✅ {doItem}</li>
                    ))}
                  </ul>

                  <h4 style={{ ...styles.subHeader, marginTop: '12px' }}>Prohibited Usage (Don'ts):</h4>
                  <ul>
                    {(rulesAndGuidelines?.logoDonts || [
                      'Do not distort or change element colors.',
                      'Do not place on low-contrast patterned backgrounds.',
                    ]).map((dontItem, idx) => (
                      <li key={idx} style={styles.dontItem}>❌ {dontItem}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Color Palette */}
          {(!sectionsIncluded || sectionsIncluded.colorPalette) && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>2. Color Palette & Codes</h3>
              <div style={styles.paletteGrid}>
                {palette.map((color, idx) => (
                  <div key={idx} style={styles.colorCard}>
                    <div style={{ ...styles.swatch, backgroundColor: color.hex }} />
                    <div style={styles.swatchInfo}>
                      <p style={styles.swatchName}>{color.name || `Color ${idx + 1}`}</p>
                      <p style={styles.swatchHex}>{color.hex}</p>
                      <p style={styles.swatchRgb}>{color.rgb || 'rgb(100, 100, 100)'}</p>
                      <span style={styles.swatchType}>{color.type?.toUpperCase() || 'PRIMARY'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Typography */}
          {(!sectionsIncluded || sectionsIncluded.typography) && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>3. Typography System</h3>
              <div style={styles.typoGrid}>
                <div style={styles.typoBox}>
                  <span style={styles.typoLabel}>Heading Font</span>
                  <h2 style={{ fontFamily: typography.headingFont || 'sans-serif', fontSize: '1.4rem', margin: '4px 0' }}>
                    {typography.headingFont || 'Outfit, sans-serif'}
                  </h2>
                  <p style={styles.typoDesc}>Used for main page titles, banners, and major promo headers.</p>
                </div>

                <div style={styles.typoBox}>
                  <span style={styles.typoLabel}>Body Font</span>
                  <p style={{ fontFamily: typography.bodyFont || 'sans-serif', fontSize: '1.1rem', margin: '4px 0', fontWeight: '500' }}>
                    {typography.bodyFont || 'Inter, sans-serif'}
                  </p>
                  <p style={styles.typoDesc}>Used for product descriptions, body copy, and social post text.</p>
                </div>

                <div style={styles.typoBox}>
                  <span style={styles.typoLabel}>Accent Font</span>
                  <p style={{ fontFamily: typography.accentFont || 'serif', fontSize: '1.1rem', margin: '4px 0', fontStyle: 'italic' }}>
                    {typography.accentFont || 'Playfair Display, serif'}
                  </p>
                  <p style={styles.typoDesc}>Used for callouts, taglines, quotes, and highlighted badges.</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Brand Taglines */}
          {(!sectionsIncluded || sectionsIncluded.taglines) && taglines.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>4. Brand Taglines (Bangla & English)</h3>
              <div style={styles.taglinesList}>
                {taglines.map((t, idx) => (
                  <div key={idx} style={styles.taglineRow}>
                    <span style={styles.taglineNum}>0{idx + 1}</span>
                    <div>
                      <p style={styles.taglineEn}>"{t.en}"</p>
                      <p style={styles.taglineBn}>"{t.bn}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Brand Notes & Policy */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Usage Policy & Brand Notes</h3>
            <p style={styles.notesText}>{customNotes || 'This document serves as the official visual identity reference for BrandBondhu sellers and partners.'}</p>
          </div>

          <div style={styles.footer}>
            <p>© {new Date().getFullYear()} {businessInfo?.businessName || 'BrandBondhu'}. Generated with BrandBondhu AI Automation Platform.</p>
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
    maxWidth: '850px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    backgroundColor: '#12131a',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  docIdBadge: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  paper: {
    padding: '40px',
    overflowY: 'auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTag: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6366f1',
    fontWeight: '700',
  },
  docTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    marginTop: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    marginTop: '2px',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: '0.9rem',
    fontWeight: '700',
  },
  divider: {
    margin: '24px 0',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '14px',
    color: '#6366f1',
    borderLeft: '3px solid #6366f1',
    paddingLeft: '10px',
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '20px',
    alignItems: 'center',
  },
  logoPreviewBox: {
    border: '1px dashed rgba(148, 163, 184, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesList: {
    fontSize: '0.85rem',
  },
  subHeader: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '6px',
  },
  doItem: {
    color: '#10b981',
    margin: '4px 0',
  },
  dontItem: {
    color: '#ef4444',
    margin: '4px 0',
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
  },
  colorCard: {
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  swatch: {
    height: '60px',
    width: '100%',
  },
  swatchInfo: {
    padding: '8px',
  },
  swatchName: {
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  swatchHex: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  swatchRgb: {
    fontSize: '0.68rem',
    color: '#64748b',
  },
  swatchType: {
    fontSize: '0.6rem',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#6366f1',
    fontWeight: 'bold',
    display: 'inline-block',
    marginTop: '4px',
  },
  typoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  typoBox: {
    border: '1px solid rgba(148, 163, 184, 0.2)',
    padding: '12px',
    borderRadius: '10px',
  },
  typoLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  typoDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '4px',
  },
  taglinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  taglineRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  taglineNum: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  taglineEn: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  taglineBn: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  notesText: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
  },
  footer: {
    marginTop: '30px',
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
    paddingTop: '16px',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#64748b',
  },
};

// Inject print CSS
if (typeof document !== 'undefined') {
  const printStyle = document.createElement('style');
  printStyle.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-styleguide, #printable-styleguide * {
        visibility: visible;
      }
      #printable-styleguide {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100%;
        box-shadow: none;
        border: none;
        background-color: #fff !important;
      }
      #printable-styleguide * {
        color: #0f172a !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(printStyle);
}
