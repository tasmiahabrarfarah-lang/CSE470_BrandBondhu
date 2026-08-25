import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StyleGuidePDF } from '../components/StyleGuidePDF';

export const BrandStyleGuide = () => {
  const [loading, setLoading] = useState(true);
  const [styleGuideData, setStyleGuideData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Customization controls (FR-15.2)
  const [layoutPreset, setLayoutPreset] = useState('Modern Grid');
  const [theme, setTheme] = useState('brand');
  const [title, setTitle] = useState('');
  const [includedSections, setIncludedSections] = useState({
    logoRules: true,
    colorPalette: true,
    typography: true,
    taglines: true,
    brandVoice: true,
    seoKeywords: true,
  });

  const [logoDosText, setLogoDosText] = useState('');
  const [logoDontsText, setLogoDontsText] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // PDF Modal trigger (FR-15.3)
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfExportData, setPdfExportData] = useState(null);

  useEffect(() => {
    loadStyleGuide();
  }, []);

  const loadStyleGuide = async (brandKitId = '') => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.styleGuide.get(brandKitId);
      if (res.success && res.data) {
        setStyleGuideData(res.data);
        const cfg = res.data.config || {};
        setLayoutPreset(cfg.layoutPreset || 'Modern Grid');
        setTheme(cfg.theme || 'brand');
        setTitle(cfg.title || `${res.data.brandKit?.questionnaire?.businessName} Brand Style Guide`);
        if (cfg.includedSections) setIncludedSections(cfg.includedSections);
        if (cfg.customRules) {
          setLogoDosText((cfg.customRules.logoDos || []).join('\n'));
          setLogoDontsText((cfg.customRules.logoDonts || []).join('\n'));
        }
        if (cfg.customNotes) setCustomNotes(cfg.customNotes);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load Brand Style Guide');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomization = async (e) => {
    e.preventDefault();
    if (!styleGuideData?.brandKit?._id) return;

    setSavingConfig(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const logoDos = logoDosText.split('\n').filter(line => line.trim().length > 0);
      const logoDonts = logoDontsText.split('\n').filter(line => line.trim().length > 0);

      const res = await api.styleGuide.updateConfig(styleGuideData.brandKit._id, {
        title,
        layoutPreset,
        theme,
        includedSections,
        customRules: { logoDos, logoDonts },
        customNotes,
      });

      if (res.success) {
        setSuccessMsg('Style guide customization preferences saved successfully!');
        loadStyleGuide(styleGuideData.brandKit._id);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save customization settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportPDF = async () => {
    if (!styleGuideData?.brandKit?._id) return;
    try {
      setLoading(true);
      const res = await api.styleGuide.exportPDF(styleGuideData.brandKit._id);
      if (res.success && res.data) {
        setPdfExportData(res.data);
        setShowPDFModal(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate PDF export');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !styleGuideData) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <h3>Loading Brand Style Guide...</h3>
        </div>
      </div>
    );
  }

  if (errorMsg && !styleGuideData) {
    return (
      <div style={styles.container}>
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ⚠️ {errorMsg}
        </div>
        <p style={{ color: '#94a3b8' }}>Please make sure you have generated an AI Brand Identity Kit first.</p>
      </div>
    );
  }

  const brandKit = styleGuideData?.brandKit || {};
  const palette = brandKit.colorPalette || [];
  const typography = brandKit.typography || {};
  const taglines = brandKit.taglines || [];
  const logo = brandKit.logo || {};

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📘 Brand Style Guide Export</h1>
          <p style={styles.subtitle}>
            Auto-generate and customize professional brand guidelines containing logo rules, color palettes (HEX & RGB), typography hierarchy, and taglines.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportPDF} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
          📄 Export / Download PDF Style Guide (FR-15.3)
        </button>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {errorMsg}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {successMsg}</div>}

      {/* Main Grid: Customization Controls on Left, Live Document Preview on Right */}
      <div style={styles.mainGrid}>
        {/* Customization Control Panel (FR-15.2) */}
        <div className="glass" style={styles.card}>
          <h3 style={styles.cardTitle}>⚙️ Customize Style Guide Layout</h3>

          <form onSubmit={handleSaveCustomization}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Document Title:</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Style Guide Title"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Layout Preset Layout:</label>
              <select className="form-input" value={layoutPreset} onChange={(e) => setLayoutPreset(e.target.value)}>
                <option value="Modern Grid">Modern Grid Layout</option>
                <option value="Classic Document">Classic Document Layout</option>
                <option value="Compact Cards">Compact Cards Layout</option>
                <option value="Minimalist Slate">Minimalist Slate Layout</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Document Theme:</label>
              <select className="form-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="brand">Brand Colors Theme</option>
                <option value="light">Clean Light Paper Theme</option>
                <option value="dark">Midnight Dark Theme</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Sections to Include:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                {Object.keys(includedSections).map((secKey) => (
                  <label key={secKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: '#cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={includedSections[secKey]}
                      onChange={(e) => setIncludedSections({ ...includedSections, [secKey]: e.target.checked })}
                    />
                    {secKey.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Logo Do's (One per line):</label>
              <textarea
                className="form-input"
                rows={3}
                value={logoDosText}
                onChange={(e) => setLogoDosText(e.target.value)}
                placeholder="e.g. Maintain clear space equal to logo height"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Logo Don'ts (One per line):</label>
              <textarea
                className="form-input"
                rows={3}
                value={logoDontsText}
                onChange={(e) => setLogoDontsText(e.target.value)}
                placeholder="e.g. Do not stretch or distort logo aspect ratio"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Custom Brand Policy / Notes:</label>
              <textarea
                className="form-input"
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Additional notes for designers or partners..."
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }} disabled={savingConfig}>
              {savingConfig ? 'Saving Settings...' : '💾 Save Layout Customizations'}
            </button>
          </form>
        </div>

        {/* Live Document Preview Panel */}
        <div className="glass" style={{ ...styles.card, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase' }}>
              LIVE PREVIEW • PRESET: {layoutPreset}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Version: {brandKit.versionName}</span>
          </div>

          <div style={{ backgroundColor: theme === 'dark' ? '#0f172a' : theme === 'light' ? '#ffffff' : '#12131a', color: theme === 'light' ? '#1e293b' : '#f8fafc', padding: '24px', borderRadius: '12px', transition: 'all 0.3s ease' }}>
            {/* Header section */}
            <div style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{title}</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{brandKit.questionnaire?.businessName} • {brandKit.questionnaire?.industry}</p>
            </div>

            {/* Logo Section */}
            {includedSections.logoRules && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '10px' }}>1. LOGO IDENTITY & ICON</h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px' }}>
                  {logo.svgCode ? (
                    <div dangerouslySetInnerHTML={{ __html: logo.svgCode }} style={{ width: '80px', height: '80px' }} />
                  ) : (
                    <div style={{ width: '70px', height: '70px', borderRadius: '14px', background: `linear-gradient(135deg, ${logo.primaryColor || '#6366f1'}, ${logo.accentColor || '#d946ef'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.8rem', color: '#fff' }}>
                      {brandKit.questionnaire?.businessName?.charAt(0) || 'B'}
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Style: {logo.style}</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Primary Hex: {logo.primaryColor} | Accent: {logo.accentColor}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Color Palette Section */}
            {includedSections.colorPalette && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '10px' }}>2. COLOR PALETTE (HEX & RGB)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                  {palette.map((c, i) => (
                    <div key={i} style={{ border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '40px', backgroundColor: c.hex }} />
                      <div style={{ padding: '6px', fontSize: '0.7rem' }}>
                        <p style={{ fontWeight: 'bold' }}>{c.name}</p>
                        <p style={{ fontFamily: 'monospace' }}>{c.hex}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{c.rgb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Section */}
            {includedSections.typography && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '10px' }}>3. TYPOGRAPHY HIERARCHY</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ padding: '10px', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Heading Font</span>
                    <p style={{ fontFamily: typography.headingFont, fontWeight: 'bold', marginTop: '2px' }}>{typography.headingFont}</p>
                  </div>
                  <div style={{ padding: '10px', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Body Font</span>
                    <p style={{ fontFamily: typography.bodyFont, marginTop: '2px' }}>{typography.bodyFont}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Taglines Section */}
            {includedSections.taglines && taglines.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 'bold', marginBottom: '10px' }}>4. BRAND TAGLINES</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {taglines.map((t, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <p style={{ fontWeight: 'bold' }}>"{t.en}"</p>
                      <p style={{ color: '#94a3b8' }}>"{t.bn}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Export Overlay Modal */}
      {showPDFModal && pdfExportData && (
        <StyleGuidePDF data={pdfExportData} onClose={() => setShowPDFModal(false)} />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
  },
  card: {
    padding: '24px',
    borderRadius: '16px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#f8fafc',
  },
};
