import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const FAQManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const res = await api.faq.getAll();
      if (res.success) {
        setFaqs(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const kwArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      const payload = { question, answer, keywords: kwArray };
      
      if (editingId) {
        await api.faq.update(editingId, payload);
      } else {
        await api.faq.create(payload);
      }
      
      await fetchFAQs();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (faq) => {
    setEditingId(faq._id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setKeywords(faq.keywords.join(', '));
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.faq.delete(id);
      await fetchFAQs();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setKeywords('');
    setShowForm(false);
  };

  if (loading && faqs.length === 0) return <div style={styles.loader}>Loading FAQs...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Automated Customer FAQ Assistant</h1>
          <p style={styles.subtitle}>Define keywords and answers to automatically reply to comments.</p>
        </div>
        {!showForm && (
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            + Add New FAQ
          </button>
        )}
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {showForm && (
        <form style={styles.formCard} onSubmit={handleSave} className="glass">
          <h3>{editingId ? 'Edit FAQ' : 'Create New FAQ'}</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Question / Topic Name</label>
            <input 
              style={styles.input} 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="e.g., Delivery Time"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Keywords (comma separated)</label>
            <input 
              style={styles.input} 
              value={keywords} 
              onChange={e => setKeywords(e.target.value)} 
              placeholder="e.g., delivery, late, when will i get"
              required 
            />
            <small style={styles.helpText}>If a comment contains any of these keywords, the bot will auto-reply.</small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Automated Answer</label>
            <textarea 
              style={styles.textarea} 
              value={answer} 
              onChange={e => setAnswer(e.target.value)} 
              placeholder="Our delivery takes 3-5 business days."
              required 
              rows={4}
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
            <button type="submit" style={styles.saveBtn}>{editingId ? 'Update' : 'Save'} FAQ</button>
          </div>
        </form>
      )}

      <div style={styles.grid}>
        {faqs.map(faq => (
          <div key={faq._id} style={styles.faqCard} className="glass">
            <h3 style={styles.faqTitle}>{faq.question}</h3>
            <div style={styles.keywordsList}>
              {faq.keywords.map((kw, i) => (
                <span key={i} style={styles.keywordBadge}>{kw}</span>
              ))}
            </div>
            <p style={styles.faqAnswer}>{faq.answer}</p>
            <div style={styles.cardActions}>
              <button style={styles.editBtn} onClick={() => handleEdit(faq)}>Edit</button>
              <button style={styles.deleteBtn} onClick={() => handleDelete(faq._id)}>Delete</button>
            </div>
          </div>
        ))}
        {!loading && faqs.length === 0 && !showForm && (
          <div style={styles.emptyState}>
            No FAQs defined yet. Click "Add New FAQ" to create your first automated response!
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    animation: 'fadeIn 0.4s ease-out'
  },
  loader: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: '40px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '4px'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.95rem'
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  formCard: {
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#cbd5e1',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: '0.95rem'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: '0.95rem',
    resize: 'vertical'
  },
  helpText: {
    display: 'block',
    marginTop: '4px',
    color: '#64748b',
    fontSize: '0.8rem'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  cancelBtn: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px'
  },
  faqCard: {
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  faqTitle: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#fff'
  },
  keywordsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  keywordBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  faqAnswer: {
    margin: 0,
    color: '#cbd5e1',
    lineHeight: '1.5'
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '12px'
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px dashed rgba(255,255,255,0.1)'
  }
};
