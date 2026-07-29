import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const BrandIdentity = () => {
  const { user } = useAuth();
  const [brandKits, setBrandKits] = useState([]);
  const [activeKit, setActiveKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Questionnaire form state
  const [formData, setFormData] = useState({
    businessName: user?.businessInfo?.businessName || '',
    industry: user?.businessInfo?.industry || 'Technology & E-Commerce',
    tone: 'Professional & Friendly',
    targetAudience: 'Small Business Sellers & Consumers in BD',
    colorPreference: 'Modern & Vibrantly Colored',
    versionName: '',
  });

  // Manual Adjustment Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKit, setEditingKit] = useState(null);

  const fetchBrandKits = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.brandKit.getAll();
      if (res.success) {
        setBrandKits(res.data);
        const currentActive = res.data.find((k) => k.isActive) || res.data[0] || null;
        setActiveKit(currentActive);
      }
    } catch (err) {
      setError(err.message || 'Failed to load Brand Kits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandKits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.businessName || !formData.industry) {
      setError('Please provide Business Name and Industry');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccessMsg('');
      const res = await api.brandKit.generate(formData);
      if (res.success) {
        setSuccessMsg(`Brand Kit "${res.data.versionName}" generated successfully!`);
        await fetchBrandKits();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate Brand Kit');
    } finally {
      setGenerating(false);
    }
  };

  const handleSetActive = async (kitId) => {
    try {
      setError('');
      const res = await api.brandKit.setActive(kitId);
      if (res.success) {
        setSuccessMsg('Active Brand Kit updated!');
        await fetchBrandKits();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegenerateAsset = async (kitId, assetType) => {
    try {
      setRegenerating(true);
      setError('');
      const res = await api.brandKit.regenerateAsset(kitId, assetType);
      if (res.success) {
        setSuccessMsg(`Regenerated ${assetType} successfully!`);
        await fetchBrandKits();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteKit = async (kitId) => {
    if (!window.confirm('Are you sure you want to delete this Brand Kit version?')) return;
    try {
      setError('');
      const res = await api.brandKit.delete(kitId);
      if (res.success) {
        setSuccessMsg('Brand Kit version deleted');
        await fetchBrandKits();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveAdjustments = async (e) => {
    e.preventDefault();
    if (!editingKit) return;
    try {
      setError('');
      const res = await api.brandKit.update(editingKit._id, editingKit);
      if (res.success) {
        setSuccessMsg('Brand Kit adjustments saved!');
        setShowEditModal(false);
        await fetchBrandKits();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg(`Copied "${text}" to clipboard!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const downloadSVGLogo = (kit) => {
    if (!kit?.logo?.svgCode) return;
    const blob = new Blob([kit.logo.svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kit.questionnaire.businessName}_logo.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading Brand Identity Engine...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div className="glass" style={styles.headerBox}>
        <div>
          <h1 style={styles.pageTitle}>✨ AI Brand Identity Generator</h1>
          <p style={styles.pageSubtitle}>
            Answer a few questions about your business to generate custom AI logos, color palettes, fonts, and taglines in Bangla & English.
          </p>
        </div>
      </div>

      {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

      <div style={styles.mainGrid}>
        {/* Left Column: Brand Questionnaire Form */}
        <div className="glass" style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Brand Questionnaire (FR-2.1)</h2>
          <p style={styles.cardSub}>Provide details to shape your unique brand identity.</p>

          <form onSubmit={handleGenerate} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="e.g. Priyo Fashion House"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Industry / Niche *</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g. Clothing & Accessories"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Brand Tone</label>
              <select name="tone" value={formData.tone} onChange={handleInputChange} style={styles.select}>
                <option value="Professional & Friendly">Professional & Friendly</option>
                <option value="Casual & Playful">Casual & Playful</option>
                <option value="Luxury & Elegant">Luxury & Elegant</option>
                <option value="Urgent & Promotional">Urgent & Promotional</option>
                <option value="Authentic & Traditional (Bangla Focus)">Authentic & Traditional (Bangla Focus)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Target Audience</label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                placeholder="e.g. Young adults and women in Dhaka"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Color Preference</label>
              <select
                name="colorPreference"
                value={formData.colorPreference}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="Modern & Vibrantly Colored">Modern & Vibrantly Colored</option>
                <option value="Warm & Traditional (Bangladeshi Vibe)">Warm & Traditional (Bangladeshi Vibe)</option>
                <option value="Cool Corporate & Professional">Cool Corporate & Professional</option>
                <option value="Minimalist & Elegant">Minimalist & Elegant</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Version Name (Optional)</label>
              <input
                type="text"
                name="versionName"
                value={formData.versionName}
                onChange={handleInputChange}
                placeholder="e.g. Eid Campaign V1"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={generating} style={styles.primaryBtn} className="glow-effect">
              {generating ? '🎨 Generating AI Brand Kit...' : '🪄 Generate Brand Kit (1 Credit)'}
            </button>
          </form>
        </div>

        {/* Right Column: Active Brand Kit Preview & Versions */}
        <div style={styles.rightCol}>
          {/* Active Brand Kit Card */}
          {activeKit ? (
            <div className="glass" style={styles.activeKitCard}>
              <div style={styles.kitCardHeader}>
                <div>
                  <div style={styles.activeBadge}>
                    🟢 Active Brand Kit ({activeKit.versionName})
                  </div>
                  <h2 style={styles.kitBusinessTitle}>{activeKit.questionnaire.businessName}</h2>
                  <span style={styles.kitIndustryTag}>{activeKit.questionnaire.industry} • {activeKit.questionnaire.tone}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={styles.secondaryBtn}
                    onClick={() => {
                      setEditingKit(JSON.parse(JSON.stringify(activeKit)));
                      setShowEditModal(true);
                    }}
                  >
                    ✏️ Adjust Assets
                  </button>
                </div>
              </div>

              {/* Logo Section */}
              <div style={styles.assetSection}>
                <div style={styles.sectionHeaderRow}>
                  <h3 style={styles.assetTitle}>🖼️ AI Generated Logo (FR-2.2)</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={styles.miniBtn}
                      onClick={() => handleRegenerateAsset(activeKit._id, 'logo')}
                      disabled={regenerating}
                    >
                      🔄 Regenerate Logo
                    </button>
                    <button style={styles.miniBtn} onClick={() => downloadSVGLogo(activeKit)}>
                      ⬇️ Download SVG
                    </button>
                  </div>
                </div>
                <div style={styles.logoDisplayBox}>
                  <div dangerouslySetInnerHTML={{ __html: activeKit.logo.svgCode }} style={styles.logoContainer} />
                </div>
              </div>

              {/* Color Palette Section */}
              <div style={styles.assetSection}>
                <div style={styles.sectionHeaderRow}>
                  <h3 style={styles.assetTitle}>🎨 Color Palette (FR-2.3)</h3>
                  <button
                    style={styles.miniBtn}
                    onClick={() => handleRegenerateAsset(activeKit._id, 'colors')}
                    disabled={regenerating}
                  >
                    🔄 New Colors
                  </button>
                </div>
                <div style={styles.paletteGrid}>
                  {activeKit.colorPalette.map((col, idx) => (
                    <div
                      key={idx}
                      style={{ ...styles.colorCard, backgroundColor: col.hex }}
                      onClick={() => copyToClipboard(col.hex)}
                      title="Click to copy Hex code"
                    >
                      <span style={styles.colorHex}>{col.hex}</span>
                      <span style={styles.colorName}>{col.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography Section */}
              <div style={styles.assetSection}>
                <h3 style={styles.assetTitle}>✍️ Typography Suggestions (FR-2.3)</h3>
                <div style={styles.typoBox}>
                  <div>
                    <span style={styles.typoLabel}>Heading Font:</span>
                    <span style={{ ...styles.typoVal, fontFamily: activeKit.typography.headingFont }}>
                      {activeKit.typography.headingFont}
                    </span>
                  </div>
                  <div>
                    <span style={styles.typoLabel}>Body Font:</span>
                    <span style={{ ...styles.typoVal, fontFamily: activeKit.typography.bodyFont }}>
                      {activeKit.typography.bodyFont}
                    </span>
                  </div>
                </div>
              </div>

              {/* Taglines Section */}
              <div style={styles.assetSection}>
                <div style={styles.sectionHeaderRow}>
                  <h3 style={styles.assetTitle}>💬 Taglines (Bangla & English) (FR-2.4)</h3>
                  <button
                    style={styles.miniBtn}
                    onClick={() => handleRegenerateAsset(activeKit._id, 'taglines')}
                    disabled={regenerating}
                  >
                    🔄 New Taglines
                  </button>
                </div>
                <div style={styles.taglinesList}>
                  {activeKit.taglines.map((tag, idx) => (
                    <div key={idx} style={styles.taglineCard}>
                      <div>
                        <div style={styles.taglineBn}>🇧🇩 {tag.bn}</div>
                        <div style={styles.taglineEn}>🇬🇧 {tag.en}</div>
                      </div>
                      <button style={styles.copyBtn} onClick={() => copyToClipboard(`${tag.bn} | ${tag.en}`)}>
                        📋 Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass" style={styles.emptyState}>
              <div style={{ fontSize: '3rem' }}>🎨</div>
              <h3>No Brand Kit Created Yet</h3>
              <p>Fill out the Brand Questionnaire on the left to generate your first AI Brand Kit!</p>
            </div>
          )}

          {/* Saved Brand Kits History List (FR-2.6) */}
          {brandKits.length > 0 && (
            <div className="glass" style={styles.historyCard}>
              <h3 style={styles.cardTitle}>📁 Saved Brand Kit Versions ({brandKits.length})</h3>
              <div style={styles.historyList}>
                {brandKits.map((kit) => (
                  <div
                    key={kit._id}
                    style={{
                      ...styles.historyItem,
                      borderLeft: kit.isActive ? '4px solid #34d399' : '4px solid transparent',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>
                        {kit.versionName} {kit.isActive && <span style={styles.activeTag}>[ACTIVE]</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Created {new Date(kit.createdAt).toLocaleDateString()} • {kit.questionnaire.colorPreference}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!kit.isActive && (
                        <button style={styles.miniActiveBtn} onClick={() => handleSetActive(kit._id)}>
                          Set Active
                        </button>
                      )}
                      <button style={styles.miniDeleteBtn} onClick={() => handleDeleteKit(kit._id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Adjustment Modal (FR-2.5) */}
      {showEditModal && editingKit && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2>✏️ Adjust Brand Assets ({editingKit.versionName})</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAdjustments} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Version Name</label>
                <input
                  type="text"
                  value={editingKit.versionName}
                  onChange={(e) => setEditingKit({ ...editingKit, versionName: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Logo Primary Color (Hex)</label>
                <input
                  type="color"
                  value={editingKit.logo?.primaryColor || '#6366f1'}
                  onChange={(e) =>
                    setEditingKit({
                      ...editingKit,
                      logo: { ...editingKit.logo, primaryColor: e.target.value },
                    })
                  }
                  style={styles.colorPickerInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Logo Accent Color (Hex)</label>
                <input
                  type="color"
                  value={editingKit.logo?.accentColor || '#d946ef'}
                  onChange={(e) =>
                    setEditingKit({
                      ...editingKit,
                      logo: { ...editingKit.logo, accentColor: e.target.value },
                    })
                  }
                  style={styles.colorPickerInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Heading Font</label>
                <input
                  type="text"
                  value={editingKit.typography?.headingFont || 'Outfit, sans-serif'}
                  onChange={(e) =>
                    setEditingKit({
                      ...editingKit,
                      typography: { ...editingKit.typography, headingFont: e.target.value },
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  loaderContainer: {
    height: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  headerBox: {
    padding: '24px 32px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  pageSubtitle: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#f87171',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '0.9rem',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid #10b981',
    color: '#34d399',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '0.9rem',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  card: {
    padding: '24px',
    borderRadius: '16px',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#fff',
  },
  cardSub: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  },
  select: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontWeight: '700',
    fontSize: '0.925rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginTop: '8px',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#fff',
    borderRadius: '8px',
    padding: '8px 14px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  activeKitCard: {
    padding: '28px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kitCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '16px',
  },
  activeBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  kitBusinessTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#fff',
  },
  kitIndustryTag: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  assetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
  },
  miniBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#818cf8',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  logoDisplayBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '160px',
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '12px',
  },
  colorCard: {
    height: '80px',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
  },
  colorHex: {
    fontWeight: '800',
    fontSize: '0.8rem',
    color: '#fff',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  },
  colorName: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.8)',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  },
  typoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  typoLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginRight: '8px',
  },
  typoVal: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
  },
  taglinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  taglineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taglineBn: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#34d399',
    marginBottom: '2px',
  },
  taglineEn: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    borderRadius: '16px',
    color: '#94a3b8',
  },
  historyCard: {
    padding: '24px',
    borderRadius: '16px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTag: {
    color: '#34d399',
    fontSize: '0.75rem',
    marginLeft: '6px',
  },
  miniActiveBtn: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    color: '#34d399',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  miniDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: 'none',
    color: '#f87171',
    borderRadius: '6px',
    padding: '4px 8px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: '16px',
    padding: '28px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  colorPickerInput: {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
};
