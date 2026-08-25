import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const HashtagGenerator = () => {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'templates'
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Generated state
  const [generatedData, setGeneratedData] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState('General');
  const [templateNotes, setTemplateNotes] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  useEffect(() => {
    loadProducts();
    loadTemplates();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.products.getAll();
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err.message);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await api.hashtags.getTemplates();
      if (res.success) {
        setTemplates(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load hashtag templates:', err.message);
    }
  };

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    if (pId) {
      const prod = products.find(p => p._id === pId);
      if (prod) {
        setProductName(prod.name);
        setDescription(prod.description);
        setCategory(prod.category || '');
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!productName && !description) {
      setErrorMsg('Please enter a product name or description');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedData(null);

    try {
      const res = await api.hashtags.generate({
        productId: selectedProductId || undefined,
        productName,
        description,
        category,
        targetAudience,
      });

      if (res.success) {
        setGeneratedData(res.data);
        setActiveTags(res.data.hashtags || []);
        setSuccessMsg('Hashtags and SEO suggestions generated successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tagObj) => {
    if (activeTags.some(t => t.tag === tagObj.tag)) {
      setActiveTags(activeTags.filter(t => t.tag !== tagObj.tag));
    } else {
      setActiveTags([...activeTags, tagObj]);
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (!customTagInput.trim()) return;
    const cleanTag = customTagInput.trim().startsWith('#') ? customTagInput.trim() : `#${customTagInput.trim()}`;
    if (!activeTags.some(t => t.tag === cleanTag)) {
      setActiveTags([...activeTags, { tag: cleanTag, reach: 'Medium', popularityScore: 75 }]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagString) => {
    setActiveTags(activeTags.filter(t => t.tag !== tagString));
  };

  const handleCopyTags = () => {
    const text = activeTags.map(t => t.tag).join(' ');
    navigator.clipboard.writeText(text);
    setSuccessMsg('Hashtags copied to clipboard!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateTitle.trim()) {
      setErrorMsg('Please enter a title for the hashtag template');
      return;
    }
    if (activeTags.length === 0) {
      setErrorMsg('No hashtags selected to save');
      return;
    }

    setSavingTemplate(true);
    setErrorMsg('');

    try {
      let res;
      if (editingTemplateId) {
        res = await api.hashtags.updateTemplate(editingTemplateId, {
          title: templateTitle,
          category: templateCategory,
          hashtags: activeTags,
          notes: templateNotes,
        });
      } else {
        res = await api.hashtags.saveTemplate({
          title: templateTitle,
          category: templateCategory,
          hashtags: activeTags,
          notes: templateNotes,
        });
      }

      if (res.success) {
        setSuccessMsg(editingTemplateId ? 'Template updated successfully!' : 'Hashtag template saved successfully!');
        setTemplateTitle('');
        setTemplateNotes('');
        setEditingTemplateId(null);
        loadTemplates();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setActiveTags(tmpl.hashtags || []);
    setActiveTab('generator');
    setSuccessMsg(`Applied template "${tmpl.title}" with ${tmpl.hashtags.length} hashtags!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await api.hashtags.deleteTemplate(id);
      if (res.success) {
        setSuccessMsg('Template deleted successfully');
        loadTemplates();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete template');
    }
  };

  const getReachBadge = (reach) => {
    if (reach === 'High') return { label: 'High Reach 🔥', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' };
    if (reach === 'Medium') return { label: 'Medium Reach 📈', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
    return { label: 'Niche / Targeted 🎯', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>#️⃣ Hashtag & SEO Suggestion Generator</h1>
          <p style={styles.subtitle}>
            Boost visibility on Facebook & Instagram with AI-ranked Bangla & English hashtags and search-engine optimized keywords.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'generator' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('generator')}
          >
            ⚡ Generator & Insights
          </button>
          <button
            style={{ ...styles.tabBtn, ...(activeTab === 'templates' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab('templates')}
          >
            📁 Saved Templates ({templates.length})
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {errorMsg}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {successMsg}</div>}

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div style={styles.gridTwo}>
          {/* Left Form Box */}
          <div className="glass" style={styles.card}>
            <h3 style={styles.cardTitle}>📦 Product & Content Details</h3>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Auto-pull from Catalog (Optional):</label>
              <select className="form-input" value={selectedProductId} onChange={handleProductSelect}>
                <option value="">-- Select Product from Catalog --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.category || 'Uncategorized'})</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Product Name / Title:*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Handmade Silk Saree or Gaming Mouse"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Product Description:*</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Describe your product features, material, style, or Bangladeshi target audience..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Category:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fashion, Electronics"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Audience:</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Women, Gamers"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '🔄 Generating Hashtags & SEO...' : '✨ Generate Hashtags & SEO'}
              </button>
            </form>
          </div>

          {/* Right Results & Interactive Editor Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {generatedData ? (
              <>
                {/* Active Hashtag Chips & Editor */}
                <div className="glass" style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={styles.cardTitle}>🏷️ Suggested Hashtags ({activeTags.length})</h3>
                    <button className="btn btn-secondary" onClick={handleCopyTags} style={{ fontSize: '0.8rem' }}>
                      📋 Copy All Selected
                    </button>
                  </div>

                  {/* Tag adding form */}
                  <form onSubmit={handleAddCustomTag} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add custom hashtag (e.g. #WinterSale)"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>+ Add</button>
                  </form>

                  {/* Hashtags Chips Display categorized by Reach */}
                  {['High', 'Medium', 'Niche'].map((reachCategory) => {
                    const tagsInCat = (generatedData.categorized[reachCategory.toLowerCase()] || []);
                    if (tagsInCat.length === 0) return null;
                    const badge = getReachBadge(reachCategory);

                    return (
                      <div key={reachCategory} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated Popularity</span>
                        </div>
                        <div style={styles.chipContainer}>
                          {tagsInCat.map((item, idx) => {
                            const isSelected = activeTags.some(t => t.tag === item.tag);
                            return (
                              <button
                                key={idx}
                                style={{
                                  ...styles.tagChip,
                                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                  borderColor: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.1)',
                                  color: isSelected ? '#a5b4fc' : '#cbd5e1',
                                }}
                                onClick={() => handleToggleTag(item)}
                              >
                                {item.tag}
                                {isSelected ? ' ✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Save as Template Modal / Box inside Card */}
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>💾 Save Current Set as Template</h4>
                  <form onSubmit={handleSaveTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Template Name (e.g. Saree Campaign Set)"
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Category"
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        style={{ width: '130px' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary" disabled={savingTemplate}>
                      {savingTemplate ? 'Saving...' : '💾 Save Template Set'}
                    </button>
                  </form>
                </div>

                {/* SEO Insights Panel */}
                <div className="glass" style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={styles.cardTitle}>🎯 SEO & Keyword Recommendations</h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                      SEO Score: {generatedData.seo?.seoScore || 88}/100 🟢
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={styles.seoBox}>
                      <span style={styles.seoLabel}>Recommended Title (EN):</span>
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{generatedData.seo?.titleEn}</p>
                    </div>

                    <div style={styles.seoBox}>
                      <span style={styles.seoLabel}>Recommended Title (Bangla):</span>
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{generatedData.seo?.titleBn}</p>
                    </div>

                    <div style={styles.seoBox}>
                      <span style={styles.seoLabel}>Meta Description (EN & BN):</span>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '4px' }}>{generatedData.seo?.metaDescEn}</p>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{generatedData.seo?.metaDescBn}</p>
                    </div>

                    <div style={styles.seoBox}>
                      <span style={styles.seoLabel}>High-Intent Search Terms:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        {(generatedData.seo?.searchTerms || []).map((st, i) => (
                          <span key={i} style={styles.searchTermChip}>
                            🔍 {st.term} ({st.intent})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass" style={{ ...styles.card, textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>#️⃣</div>
                <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>No Hashtags Generated Yet</h3>
                <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                  Fill out the product information on the left and click <strong>Generate Hashtags & SEO</strong> to receive AI-curated hashtags and search ranking insights.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="glass" style={styles.card}>
          <h3 style={styles.cardTitle}>📁 Saved Hashtag Templates</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
            Quickly apply saved hashtag collections to your scheduled posts or social campaigns.
          </p>

          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <p>No saved hashtag templates found. Generate hashtags and save them as templates to use here!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {templates.map((tmpl) => (
                <div key={tmpl._id} style={styles.templateCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{tmpl.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                        {tmpl.category}
                      </span>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                      onClick={() => handleDeleteTemplate(tmpl._id)}
                      title="Delete Template"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
                    {(tmpl.hashtags || []).map((t, idx) => (
                      <span key={idx} style={styles.templateTag}>
                        {typeof t === 'string' ? t : t.tag}
                      </span>
                    ))}
                  </div>

                  {tmpl.notes && <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>{tmpl.notes}</p>}

                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => handleApplyTemplate(tmpl)}>
                    ⚡ Apply Hashtags to Editor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
  tabBar: {
    display: 'flex',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '4px',
    borderRadius: '10px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  tabBtnActive: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
  },
  gridTwo: {
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
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagChip: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  seoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '12px',
  },
  seoLabel: {
    fontSize: '0.75rem',
    color: '#6366f1',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '4px',
  },
  searchTermChip: {
    fontSize: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: '#cbd5e1',
  },
  templateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  templateTag: {
    fontSize: '0.75rem',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    padding: '3px 8px',
    borderRadius: '4px',
  },
};
