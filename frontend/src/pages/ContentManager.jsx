import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const ContentManager = () => {
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Caption Generator form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customPrompt, setCustomPrompt] = useState({
    productName: '',
    description: '',
    tone: 'Promotional',
    category: '',
    price: '',
  });

  // Generated Caption preview state
  const [generatedCaption, setGeneratedCaption] = useState(null);

  // Post Schedule Modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [postForm, setPostForm] = useState({
    _id: null,
    title: '',
    captionText: '',
    hashtags: '',
    mediaUrl: '',
    tone: 'Promotional',
    platforms: ['Facebook'],
    scheduledAt: '',
    status: 'Scheduled',
  });

  // View state: 'calendar' or 'list'
  const [viewMode, setViewMode] = useState('calendar');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, postsRes] = await Promise.all([
        api.products.getAll(),
        api.content.getPosts(),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (postsRes.success) setPosts(postsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load content data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When a product is chosen from dropdown, auto-fill caption prompt fields (FR-13.4)
  const handleProductSelect = async (prodId) => {
    setSelectedProductId(prodId);
    if (!prodId) {
      setCustomPrompt((prev) => ({ ...prev, productName: '', description: '', price: '', category: '' }));
      return;
    }

    try {
      const res = await api.products.autoPull(prodId);
      if (res.success && res.data.product) {
        const p = res.data.product;
        setCustomPrompt((prev) => ({
          ...prev,
          productName: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
        }));
      }
    } catch (err) {
      setError('Failed to pull product data');
    }
  };

  const handleGenerateCaption = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      setError('');
      setSuccessMsg('');

      const body = {
        productId: selectedProductId || undefined,
        productName: customPrompt.productName,
        description: customPrompt.description,
        tone: customPrompt.tone,
        category: customPrompt.category,
        price: customPrompt.price,
      };

      const res = await api.content.generateCaption(body);
      if (res.success) {
        setGeneratedCaption(res.data);
        setSuccessMsg('AI Caption generated! You can now schedule this post.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate caption');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenScheduleModal = (captionData = null) => {
    if (captionData) {
      setPostForm({
        _id: null,
        title: customPrompt.productName ? `${customPrompt.productName} Post` : 'New Promotional Post',
        captionText: captionData.activeText,
        hashtags: captionData.hashtags.join(' '),
        mediaUrl: '',
        tone: captionData.tone || 'Promotional',
        platforms: ['Facebook', 'Instagram'],
        scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow same time
        status: 'Scheduled',
      });
    } else {
      setPostForm({
        _id: null,
        title: '',
        captionText: '',
        hashtags: '',
        mediaUrl: '',
        tone: 'Promotional',
        platforms: ['Facebook'],
        scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        status: 'Scheduled',
      });
    }
    setShowScheduleModal(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.captionText) {
      setError('Title and caption text are required');
      return;
    }

    try {
      setError('');
      const hashtagsArr = postForm.hashtags
        .split(' ')
        .filter(Boolean)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

      const body = {
        title: postForm.title,
        caption: {
          activeText: postForm.captionText,
        },
        hashtags: hashtagsArr,
        mediaUrl: postForm.mediaUrl,
        tone: postForm.tone,
        platforms: postForm.platforms,
        status: postForm.status,
        scheduledAt: postForm.scheduledAt ? new Date(postForm.scheduledAt) : null,
      };

      if (postForm._id) {
        await api.content.updatePost(postForm._id, body);
        setSuccessMsg('Scheduled post updated!');
      } else {
        await api.content.createPost(body);
        setSuccessMsg('Post scheduled successfully!');
      }

      setShowScheduleModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save post');
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled entry?')) return;
    try {
      setError('');
      await api.content.deletePost(id);
      setSuccessMsg('Post entry deleted');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTriggerReminders = async () => {
    try {
      setError('');
      const res = await api.content.triggerReminders();
      if (res.success) {
        setSuccessMsg(`Checked due posts! ${res.processedCount} reminders/posts processed.`);
        await fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg('Copied caption to clipboard!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading Content Engine...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div className="glass" style={styles.headerBox}>
        <div>
          <h1 style={styles.pageTitle}>📝 Content Generator & Calendar</h1>
          <p style={styles.pageSubtitle}>
            Generate bilingual product captions, choose tones, and schedule social media posts across platforms.
          </p>
        </div>
        <button style={styles.secondaryBtn} onClick={handleTriggerReminders}>
          🔔 Check Due Reminders
        </button>
      </div>

      {error && <div style={styles.errorAlert}>⚠️ {error}</div>}
      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

      <div style={styles.mainGrid}>
        {/* Left Column: Caption Generator */}
        <div className="glass" style={styles.card}>
          <h2 style={styles.cardTitle}>🪄 AI Caption Generator (FR-3.1)</h2>
          <p style={styles.cardSub}>Select a product or enter details to generate captions in Bangla & English.</p>

          <form onSubmit={handleGenerateCaption} style={styles.form}>
            {/* Auto-pull dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Product (Auto-Pull Prompt) (FR-13.4)</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Or enter custom product details --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (৳{p.price})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Product Name</label>
              <input
                type="text"
                value={customPrompt.productName}
                onChange={(e) => setCustomPrompt({ ...customPrompt, productName: e.target.value })}
                placeholder="e.g. Wireless RGB Gaming Headset"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Product Description *</label>
              <textarea
                value={customPrompt.description}
                onChange={(e) => setCustomPrompt({ ...customPrompt, description: e.target.value })}
                placeholder="e.g. High quality surround sound, 20 hours battery life, noise-canceling mic."
                rows={3}
                required
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tone Selection (FR-3.2)</label>
              <select
                value={customPrompt.tone}
                onChange={(e) => setCustomPrompt({ ...customPrompt, tone: e.target.value })}
                style={styles.select}
              >
                <option value="Promotional">🔥 Promotional (Sales & Discount Focus)</option>
                <option value="Casual">👋 Casual & Friendly (Everyday Post)</option>
                <option value="Urgent">⏰ Urgent / Limited Time Offer</option>
                <option value="Storytelling">❤️ Storytelling & Emotional</option>
                <option value="Formal">👔 Formal & Professional</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price (BDT)</label>
                <input
                  type="number"
                  value={customPrompt.price}
                  onChange={(e) => setCustomPrompt({ ...customPrompt, price: e.target.value })}
                  placeholder="e.g. 2500"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <input
                  type="text"
                  value={customPrompt.category}
                  onChange={(e) => setCustomPrompt({ ...customPrompt, category: e.target.value })}
                  placeholder="e.g. Electronics"
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={generating} style={styles.primaryBtn} className="glow-effect">
              {generating ? '✨ Generating Captions...' : '✨ Generate Captions (1 Credit)'}
            </button>
          </form>

          {/* Generated Caption Output */}
          {generatedCaption && (
            <div style={styles.outputBox}>
              <div style={styles.outputHeader}>
                <span style={styles.toneTag}>Tone: {generatedCaption.tone}</span>
                <button style={styles.copyBtn} onClick={() => copyToClipboard(generatedCaption.activeText)}>
                  📋 Copy All
                </button>
              </div>

              <div style={styles.captionSection}>
                <div style={styles.langTitle}>🇧🇩 Bangla Caption</div>
                <p style={styles.captionText}>{generatedCaption.bn}</p>
              </div>

              <div style={styles.captionSection}>
                <div style={styles.langTitle}>🇬🇧 English Caption</div>
                <p style={styles.captionText}>{generatedCaption.en}</p>
              </div>

              <div style={styles.hashtagBox}>
                <span style={styles.hashtagLabel}>Hashtags:</span> {generatedCaption.hashtags.join(' ')}
              </div>

              <button
                style={{ ...styles.primaryBtn, width: '100%', marginTop: '12px' }}
                onClick={() => handleOpenScheduleModal(generatedCaption)}
              >
                📅 Schedule This Post
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Content Calendar & Scheduled Posts */}
        <div style={styles.rightCol}>
          <div className="glass" style={styles.card}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.cardTitle}>📅 Content Calendar & Schedule (FR-3.3)</h2>
                <p style={styles.cardSub}>Manage your upcoming scheduled content and post history.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={viewMode === 'calendar' ? styles.activeTabBtn : styles.tabBtn}
                  onClick={() => setViewMode('calendar')}
                >
                  📆 Calendar View
                </button>
                <button
                  style={viewMode === 'list' ? styles.activeTabBtn : styles.tabBtn}
                  onClick={() => setViewMode('list')}
                >
                  📋 List View
                </button>
                <button style={styles.primaryBtn} onClick={() => handleOpenScheduleModal(null)}>
                  + Schedule Post
                </button>
              </div>
            </div>

            {/* List / Grid View of Posts */}
            {posts.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '3rem' }}>📅</div>
                <h3>No Scheduled Posts Found</h3>
                <p>Use the AI Caption Generator on the left to create and schedule your first post!</p>
              </div>
            ) : (
              <div style={styles.postsList}>
                {posts.map((post) => (
                  <div key={post._id} style={styles.postCard}>
                    <div style={styles.postCardHeader}>
                      <div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              post.status === 'Published'
                                ? 'rgba(52, 211, 153, 0.15)'
                                : post.status === 'Scheduled'
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              post.status === 'Published'
                                ? '#34d399'
                                : post.status === 'Scheduled'
                                ? '#818cf8'
                                : '#94a3b8',
                          }}
                        >
                          ● {post.status}
                        </span>
                        <h4 style={styles.postTitle}>{post.title}</h4>
                      </div>
                      <div style={styles.postMeta}>
                        <div>📅 {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Unscheduled Draft'}</div>
                        <div style={styles.platformTags}>
                          {post.platforms.map((p, idx) => (
                            <span key={idx} style={styles.platformTag}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p style={styles.postCaptionPreview}>{post.caption?.activeText || ''}</p>

                    <div style={styles.postFooter}>
                      <span style={styles.toneTag}>{post.tone}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={styles.miniBtn}
                          onClick={() => {
                            setPostForm({
                              _id: post._id,
                              title: post.title,
                              captionText: post.caption?.activeText || '',
                              hashtags: (post.hashtags || []).join(' '),
                              mediaUrl: post.mediaUrl || '',
                              tone: post.tone || 'Promotional',
                              platforms: post.platforms || ['Facebook'],
                              scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
                              status: post.status || 'Scheduled',
                            });
                            setShowScheduleModal(true);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button style={styles.miniDeleteBtn} onClick={() => handleDeletePost(post._id)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule / Edit Post Modal (FR-3.3, FR-3.5) */}
      {showScheduleModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2>📅 {postForm._id ? 'Edit Scheduled Entry' : 'Schedule Social Media Post'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowScheduleModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Post Title / Label *</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="e.g. Eid Discount Product Post"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Caption Content *</label>
                <textarea
                  value={postForm.captionText}
                  onChange={(e) => setPostForm({ ...postForm, captionText: e.target.value })}
                  rows={4}
                  required
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Schedule Date & Time * (FR-3.3)</label>
                <input
                  type="datetime-local"
                  value={postForm.scheduledAt}
                  onChange={(e) => setPostForm({ ...postForm, scheduledAt: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={postForm.status}
                  onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                  style={styles.select}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {postForm._id ? 'Update Entry' : 'Confirm Schedule'}
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
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  card: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#fff',
  },
  cardSub: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
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
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
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
    padding: '10px 18px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 18px',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  outputBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toneTag: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#fff',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  captionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '10px',
    borderRadius: '8px',
  },
  langTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  captionText: {
    fontSize: '0.85rem',
    color: '#fff',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
  },
  hashtagBox: {
    fontSize: '0.8rem',
    color: '#818cf8',
  },
  hashtagLabel: {
    fontWeight: '700',
    color: '#94a3b8',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 12px',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: '700',
    borderRadius: '8px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  postCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'inline-block',
  },
  postTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fff',
  },
  postMeta: {
    textAlign: 'right',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  platformTags: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  platformTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#cbd5e1',
  },
  postCaptionPreview: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '10px',
  },
  miniBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: 'none',
    color: '#818cf8',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.75rem',
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
    maxWidth: '520px',
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
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
};
