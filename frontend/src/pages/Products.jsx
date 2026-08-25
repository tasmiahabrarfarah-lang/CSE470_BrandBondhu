import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAutoPullModal, setShowAutoPullModal] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryInput, setCategoryInput] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [csvText, setCsvText] = useState('');

  // Auto-pull prompt state
  const [autoPullData, setAutoPullData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.products.getAll({ search, category: selectedCategory });
      setProducts(res.data);

      const catRes = await api.products.getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategoryInput('General');
    setImageUrl('');
    setEditingId(null);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!name || !price) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.products.create({
        name,
        description,
        price: Number(price),
        category: categoryInput,
        images: imageUrl ? [imageUrl] : [],
      });

      if (res.success) {
        setSuccessMsg(`Product "${name}" added to catalog!`);
        setShowAddModal(false);
        resetForm();
        loadProducts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (prod) => {
    setEditingId(prod._id);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price);
    setCategoryInput(prod.category || 'General');
    setImageUrl(prod.images && prod.images.length > 0 ? prod.images[0] : '');
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.products.update(editingId, {
        name,
        description,
        price: Number(price),
        category: categoryInput,
        images: imageUrl ? [imageUrl] : [],
      });

      if (res.success) {
        setSuccessMsg(`Product updated successfully!`);
        setShowEditModal(false);
        resetForm();
        loadProducts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, prodName) => {
    if (window.confirm(`Are you sure you want to remove "${prodName}" from your product catalog?`)) {
      try {
        await api.products.delete(id);
        setSuccessMsg(`Product removed.`);
        loadProducts();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to delete product');
      }
    }
  };

  // FR-13.5 Bulk CSV Upload
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Simple CSV parsing: header line expected name,description,price,category,imageUrl
      const lines = csvText.trim().split('\n');
      const parsedProducts = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header if present
        if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('price')) {
          continue;
        }

        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 2) {
          parsedProducts.push({
            name: cols[0] || 'Bulk Product',
            description: cols[1] || '',
            price: Number(cols[2]) || 0,
            category: cols[3] || 'General',
            imageUrl: cols[4] || '',
          });
        }
      }

      if (parsedProducts.length === 0) {
        throw new Error('No valid product rows parsed from CSV text');
      }

      const res = await api.products.bulkUpload(parsedProducts);
      if (res.success) {
        setSuccessMsg(`Successfully imported ${res.data.length} products!`);
        setCsvText('');
        setShowBulkModal(false);
        loadProducts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Bulk upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  // FR-13.4 Auto-pull product data into AI generation prompt
  const handleAutoPull = async (id) => {
    try {
      const res = await api.products.autoPull(id);
      if (res.success) {
        setAutoPullData(res.data);
        setShowAutoPullModal(true);
        setCopied(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to auto-pull product data');
    }
  };

  const copyToClipboard = () => {
    if (autoPullData?.formattedCaptionInput) {
      navigator.clipboard.writeText(autoPullData.formattedCaptionInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header section */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.pageTitle}>📦 Product Catalog Management</h2>
          <p style={styles.pageSubtitle}>Manage your products, collections, bulk import, and auto-pull data for AI captions</p>
        </div>

        <div style={styles.btnGroup}>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            📥 Bulk CSV Upload
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            ➕ Add Product
          </button>
        </div>
      </div>

      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}

      {/* Filter and search bar */}
      <div className="glass card" style={styles.filterCard}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Search products by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.categoryFilter}>
          <label style={styles.filterLabel}>Collection:</label>
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.selectInput}
          >
            <option value="All">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading product catalog...</div>
      ) : products.length === 0 ? (
        <div className="glass card" style={styles.emptyCard}>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>No products found in your catalog.</p>
          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => setShowAddModal(true)}>
            Add Your First Product
          </button>
        </div>
      ) : (
        <div style={styles.productGrid}>
          {products.map((prod) => (
            <div key={prod._id} className="glass card" style={styles.productCard}>
              <div style={styles.imageContainer}>
                {prod.images && prod.images.length > 0 ? (
                  <img src={prod.images[0]} alt={prod.name} style={styles.productImg} />
                ) : (
                  <div style={styles.noImgPlaceholder}>📦 No Image</div>
                )}
                <span className="badge badge-secondary" style={styles.categoryBadge}>
                  {prod.category}
                </span>
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.prodName}>{prod.name}</h3>
                <p style={styles.prodDesc}>
                  {prod.description ? (prod.description.length > 80 ? prod.description.slice(0, 80) + '...' : prod.description) : 'No description provided.'}
                </p>
                
                <div style={styles.priceRow}>
                  <span style={styles.prodPrice}>৳{prod.price}</span>
                </div>

                <div style={styles.cardActions}>
                  <button 
                    className="btn btn-secondary" 
                    style={styles.actionBtn}
                    onClick={() => handleAutoPull(prod._id)}
                    title="Auto-pull data into AI caption prompt"
                  >
                    ✨ Auto-Pull
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={styles.actionBtn}
                    onClick={() => openEditModal(prod)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={styles.actionBtn}
                    onClick={() => handleDeleteProduct(prod._id, prod.name)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>➕ Add New Product</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Handmade Silk Saree"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (BDT ৳) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category / Collection</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Traditional Wear"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Short product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {showEditModal && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>✏️ Edit Product</h3>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProduct} style={styles.modalForm}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (BDT ৳) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category / Collection</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Upload (FR-13.5) */}
      {showBulkModal && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>📥 Bulk Product Upload (CSV)</h3>
              <button style={styles.closeBtn} onClick={() => setShowBulkModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBulkUpload} style={styles.modalForm}>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Paste CSV data below in format: <code>name, description, price, category, imageUrl</code>
              </p>
              
              <div className="form-group">
                <textarea
                  className="form-input"
                  rows="8"
                  placeholder={`name,description,price,category,imageUrl\nWireless Earbuds,Noise cancelling bluetooth earbud,3500,Electronics,https://images.unsplash.com/photo-1590658268037-6bf12165a8df\nLeather Wallet,Genuine hand-stitched leather wallet,1200,Fashion,https://images.unsplash.com/photo-1627123424574-724758594e93`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Importing...' : 'Import Products'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auto-Pull for Content Generation (FR-13.4) */}
      {showAutoPullModal && autoPullData && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>✨ Auto-Pulled Product Data for AI Generation</h3>
              <button style={styles.closeBtn} onClick={() => setShowAutoPullModal(false)}>✕</button>
            </div>
            <div style={styles.modalForm}>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                This product information is formatted for AI Captioning & Content Generation. Copy or auto-populate:
              </p>

              <div style={styles.codeBox}>
                <pre style={styles.preText}>{autoPullData.formattedCaptionInput}</pre>
              </div>

              <div style={styles.modalFooter}>
                <button className="btn btn-primary" onClick={copyToClipboard}>
                  {copied ? '✅ Copied to Clipboard!' : '📋 Copy Product Prompt'}
                </button>
              </div>
            </div>
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
    gap: '16px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
  },
  pageSubtitle: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.85rem',
  },
  filterCard: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '240px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#64748b',
  },
  searchInput: {
    paddingLeft: '36px',
    width: '100%',
  },
  categoryFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  selectInput: {
    minWidth: '160px',
  },
  emptyCard: {
    padding: '40px',
    textAlign: 'center',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  },
  productCard: {
    padding: '0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    height: '160px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImgPlaceholder: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    fontSize: '0.7rem',
  },
  cardContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '10px',
  },
  prodName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
  },
  prodDesc: {
    fontSize: '0.825rem',
    color: '#94a3b8',
    lineHeight: '1.4',
    flex: 1,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  prodPrice: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#38bdf8',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  actionBtn: {
    padding: '6px 10px',
    fontSize: '0.75rem',
    flex: 1,
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    width: '90%',
    maxWidth: '520px',
    padding: '30px',
    backgroundColor: '#12131a',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  codeBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '16px',
  },
  preText: {
    color: '#34d399',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    whiteSpace: 'pre-wrap',
  },
};

export default Products;
