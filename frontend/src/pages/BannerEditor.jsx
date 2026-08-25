import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export const BannerEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [activeBrandKit, setActiveBrandKit] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Canvas State for editing
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [canvasBgColor, setCanvasBgColor] = useState('#0f172a');
  const [canvasGradient, setCanvasGradient] = useState('linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)');
  const [canvasTitle, setCanvasTitle] = useState('My Custom Poster');
  const [dragState, setDragState] = useState(null); // { id, startX, startY, initialX, initialY }

  const canvasRef = useRef(null);

  const targetWidth = selectedTemplate?.dimensions?.width || 1080;
  const targetHeight = selectedTemplate?.dimensions?.height || 1080;
  const maxDisplaySize = 560;

  const scale = targetWidth >= targetHeight 
    ? maxDisplaySize / targetWidth 
    : maxDisplaySize / targetHeight;

  const displayWidth = targetWidth * scale;
  const displayHeight = targetHeight * scale;

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tmplRes, brandRes] = await Promise.all([
        api.templates.getAll(),
        api.brandKit.getActive(),
      ]);

      if (tmplRes.success) {
        setTemplates(tmplRes.data);
        if (tmplRes.data.length > 0) {
          loadTemplateIntoCanvas(tmplRes.data[0]);
        }
      }

      if (brandRes.success && brandRes.data) {
        setActiveBrandKit(brandRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle dragging elements on canvas (mouse and touch support)
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e) => {
      if (e.cancelable && e.touches) {
        e.preventDefault();
      }
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const dx = (clientX - dragState.startX) / scale;
      const dy = (clientY - dragState.startY) / scale;

      handleUpdateElement(dragState.id, {
        x: Math.round(dragState.initialX + dx),
        y: Math.round(dragState.initialY + dy),
      });
    };

    const handleEnd = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragState, scale]);

  const loadTemplateIntoCanvas = (tmpl) => {
    setSelectedTemplate(tmpl);
    setCanvasTitle(tmpl.title);
    setCanvasBgColor(tmpl.backgroundColor || '#0f172a');
    setCanvasGradient(tmpl.gradient || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)');
    setCanvasElements(JSON.parse(JSON.stringify(tmpl.elements || [])));
    setSelectedElementId(null);
  };

  // Auto-populate active brand kit assets into canvas elements (FR-4.3)
  const handleAutoPopulateBrandKit = () => {
    if (!activeBrandKit) {
      setError('No active Brand Kit found. Generate a Brand Kit first in AI Brand Identity!');
      return;
    }

    const primaryColor = activeBrandKit.colorPalette?.find((c) => c.type === 'primary')?.hex || '#6366f1';
    const secondaryColor = activeBrandKit.colorPalette?.find((c) => c.type === 'secondary')?.hex || '#d946ef';
    const businessName = activeBrandKit.questionnaire?.businessName || 'Business Name';
    const tagline = activeBrandKit.taglines?.[0]?.bn || activeBrandKit.taglines?.[0]?.en || '';

    const updatedElements = canvasElements.map((el) => {
      if (el.brandField === 'businessName') {
        return { ...el, content: businessName, color: primaryColor };
      }
      if (el.brandField === 'tagline') {
        return { ...el, content: tagline };
      }
      if (el.brandField === 'primaryColor') {
        return { ...el, color: primaryColor };
      }
      if (el.brandField === 'secondaryColor') {
        return { ...el, backgroundColor: secondaryColor };
      }
      if (el.brandField === 'logo' || el.type === 'logo') {
        return { ...el, content: `🏷️ ${businessName}` };
      }
      return el;
    });

    setCanvasElements(updatedElements);
    setSuccessMsg('Auto-populated Active Brand Kit details (Logo, Colors, Name & Tagline) into template!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateElement = (id, fields) => {
    setCanvasElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...fields } : el))
    );
  };

  const handleAddTextElement = () => {
    const newId = `text-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'text',
      content: 'New Editable Text',
      x: 100,
      y: 100,
      width: 400,
      height: 60,
      color: '#ffffff',
      fontSize: 28,
      fontWeight: 'bold',
      brandField: 'none',
    };
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newId);
  };

  const handleAddBadgeElement = () => {
    const newId = `badge-${Date.now()}`;
    const newElement = {
      id: newId,
      type: 'badge',
      content: '🏷️ DISCOUNT OFFER',
      x: 100,
      y: 200,
      width: 300,
      height: 50,
      color: '#ffffff',
      backgroundColor: '#6366f1',
      fontSize: 20,
      fontWeight: 'bold',
      brandField: 'none',
    };
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newId);
  };

  const handleDeleteElement = (id) => {
    setCanvasElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Export Design as PNG / Image Snapshot (FR-4.4)
  const handleExportPNG = () => {
    const node = canvasRef.current;
    if (!node) return;

    const canvas = document.createElement('canvas');
    const width = selectedTemplate?.dimensions?.width || 1080;
    const height = selectedTemplate?.dimensions?.height || 1080;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw Background
    ctx.fillStyle = canvasBgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw Elements
    canvasElements.forEach((el) => {
      // Draw background if badge
      if (el.type === 'badge' && el.backgroundColor && el.backgroundColor !== 'transparent') {
        ctx.fillStyle = el.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius || 12);
        ctx.fill();
      }

      // Draw Text
      ctx.fillStyle = el.color || '#ffffff';
      ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize || 24}px sans-serif`;
      ctx.textAlign = el.textAlign || 'center';
      ctx.textBaseline = 'middle';

      const textX = el.x + el.width / 2;
      const textY = el.y + el.height / 2;
      ctx.fillText(el.content, textX, textY);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${canvasTitle.replace(/\s+/g, '_')}_poster.png`;
    link.href = dataUrl;
    link.click();

    setSuccessMsg('Poster exported as PNG!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Save Custom Template for reuse (FR-4.5)
  const handleSaveCustomTemplate = async () => {
    try {
      setSaving(true);
      setError('');
      const body = {
        title: `${canvasTitle} (Custom)`,
        category: 'Custom',
        dimensions: { width: 1080, height: 1080 },
        backgroundColor: canvasBgColor,
        gradient: canvasGradient,
        elements: canvasElements,
      };

      const res = await api.templates.createCustom(body);
      if (res.success) {
        setSuccessMsg('Custom template saved to your template gallery!');
        const updated = await api.templates.getAll();
        if (updated.success) setTemplates(updated.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save custom template');
    } finally {
      setSaving(false);
    }
  };

  const selectedElement = canvasElements.find((el) => el.id === selectedElementId);

  const categories = ['All', 'Festive & Eid', 'Discount & Sale', 'New Arrival', 'Custom'];
  const filteredTemplates =
    selectedCategory === 'All'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading Banner & Template Engine...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div className="glass" style={styles.headerBox}>
        <div>
          <h1 style={styles.pageTitle}>🎨 Poster & Banner Template Editor</h1>
          <p style={styles.pageSubtitle}>
            Choose pre-built templates, auto-populate your active brand kit, edit layers, and export high-res PNG designs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={styles.secondaryBtn} onClick={handleAutoPopulateBrandKit}>
            ✨ Auto-Populate Brand Kit
          </button>
          <button style={styles.primaryBtn} onClick={handleExportPNG} className="glow-effect">
            ⬇️ Export Design PNG
          </button>
        </div>
      </div>

      {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ ...styles.mainLayout, minWidth: '1200px' }}>
        {/* Left Column: Template Gallery */}
        <div className="glass" style={styles.galleryCard}>
          <h3 style={styles.cardTitle}>📁 Template Gallery</h3>
          <div style={styles.categoryFilter}>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                style={selectedCategory === cat ? styles.activeCatBtn : styles.catBtn}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.templateGrid}>
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl._id}
                style={{
                  ...styles.templateCard,
                  border: selectedTemplate?._id === tmpl._id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => loadTemplateIntoCanvas(tmpl)}
              >
                <div style={{ ...styles.templatePreviewBox, background: tmpl.gradient }}>
                  <div style={styles.tmplTitlePreview}>{tmpl.title}</div>
                  <div style={styles.tmplCatBadge}>{tmpl.category}</div>
                </div>
                <div style={styles.tmplMeta}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>{tmpl.title}</span>
                  {tmpl.isPrebuilt ? (
                    <span style={styles.badgePrebuilt}>Prebuilt</span>
                  ) : (
                    <span style={styles.badgeCustom}>Custom</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Interactive Canvas */}
        <div style={styles.canvasCol}>
          <div className="glass" style={styles.canvasContainerCard}>
            <div style={styles.canvasToolbar}>
              <input
                type="text"
                value={canvasTitle}
                onChange={(e) => setCanvasTitle(e.target.value)}
                style={styles.canvasTitleInput}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.miniBtn} onClick={handleAddTextElement}>
                  + Add Text
                </button>
                <button style={styles.miniBtn} onClick={handleAddBadgeElement}>
                  + Add Badge
                </button>
                <button style={styles.secondaryBtn} onClick={handleSaveCustomTemplate} disabled={saving}>
                  💾 Save Custom
                </button>
              </div>
            </div>

            {/* Interactive Canvas Board */}
            <div
              ref={canvasRef}
              style={{ 
                ...styles.interactiveCanvas, 
                width: `${displayWidth}px`, 
                height: `${displayHeight}px`, 
                background: canvasGradient 
              }}
              onClick={() => setSelectedElementId(null)}
            >
              {canvasElements.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    style={{
                      position: 'absolute',
                      left: `${el.x * scale}px`,
                      top: `${el.y * scale}px`,
                      width: `${el.width * scale}px`,
                      height: `${el.height * scale}px`,
                      color: el.color || '#ffffff',
                      backgroundColor: el.backgroundColor || 'transparent',
                      fontSize: `${(el.fontSize || 24) * scale}px`,
                      fontWeight: el.fontWeight || 'normal',
                      fontFamily: el.fontFamily || 'sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: el.textAlign || 'center',
                      borderRadius: `${(el.borderRadius || 10) * scale}px`,
                      border: isSelected ? '2px dashed #38bdf8' : '1px solid transparent',
                      cursor: 'move',
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      padding: '4px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                      setDragState({
                        id: el.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialX: el.x,
                        initialY: el.y,
                      });
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                      setDragState({
                        id: el.id,
                        startX: e.touches[0].clientX,
                        startY: e.touches[0].clientY,
                        initialX: el.x,
                        initialY: el.y,
                      });
                    }}
                  >
                    {el.content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Layer & Element Inspector Panel (FR-4.2) */}
        <div className="glass" style={styles.inspectorCard}>
          <h3 style={styles.cardTitle}>🎛️ Layer Inspector</h3>

          {selectedElement ? (
            <div style={styles.inspectorForm}>
              <div style={styles.inspectorHeader}>
                <span style={styles.inspectorType}>Layer: {selectedElement.type.toUpperCase()}</span>
                <button style={styles.miniDeleteBtn} onClick={() => handleDeleteElement(selectedElement.id)}>
                  🗑️ Remove Layer
                </button>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Content Text</label>
                <input
                  type="text"
                  value={selectedElement.content}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { content: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Position X</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Position Y</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Font Size (px)</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize || 24}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })
                    }
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Font Weight</label>
                  <select
                    value={selectedElement.fontWeight || 'bold'}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { fontWeight: e.target.value })}
                    style={styles.select}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="900">Heavy</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Text Color</label>
                <input
                  type="color"
                  value={selectedElement.color || '#ffffff'}
                  onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })}
                  style={styles.colorPicker}
                />
              </div>

              {selectedElement.type === 'badge' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Background Color</label>
                  <input
                    type="color"
                    value={selectedElement.backgroundColor || '#6366f1'}
                    onChange={(e) => handleUpdateElement(selectedElement.id, { backgroundColor: e.target.value })}
                    style={styles.colorPicker}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyInspector}>
              <div style={{ fontSize: '2rem' }}>👆</div>
              <p>Click on any text or layer on the canvas board to inspect and edit its properties.</p>
            </div>
          )}

          {/* Canvas Background Controls */}
          <div style={styles.bgControlBox}>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px' }}>Canvas Background</h4>
            <input
              type="color"
              value={canvasBgColor}
              onChange={(e) => {
                setCanvasBgColor(e.target.value);
                setCanvasGradient(e.target.value);
              }}
              style={styles.colorPicker}
            />
          </div>
        </div>
      </div>
    </div>
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
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr 300px',
    gap: '20px',
    alignItems: 'start',
  },
  galleryCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
  },
  categoryFilter: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  catBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.75rem',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  activeCatBtn: {
    backgroundColor: '#6366f1',
    border: 'none',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  templateGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  templateCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    transition: 'transform 0.2s',
  },
  templatePreviewBox: {
    height: '140px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  tmplTitlePreview: {
    color: '#fff',
    fontWeight: '800',
    fontSize: '1.1rem',
    textShadow: '0 2px 4px rgba(0,0,0,0.6)',
  },
  tmplCatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#38bdf8',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  tmplMeta: {
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgePrebuilt: {
    fontSize: '0.65rem',
    color: '#34d399',
    fontWeight: '700',
  },
  badgeCustom: {
    fontSize: '0.65rem',
    color: '#c084fc',
    fontWeight: '700',
  },
  canvasCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  canvasContainerCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  canvasToolbar: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canvasTitleInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontWeight: '800',
    fontSize: '1.2rem',
    outline: 'none',
  },
  interactiveCanvas: {
    width: '560px',
    height: '560px',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  inspectorCard: {
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inspectorForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inspectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorType: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#38bdf8',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  colorPicker: {
    width: '100%',
    height: '36px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  emptyInspector: {
    textAlign: 'center',
    padding: '24px 12px',
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  bgControlBox: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '12px',
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
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
  miniBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#818cf8',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  miniDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: 'none',
    color: '#f87171',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
};
