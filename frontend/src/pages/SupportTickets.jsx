import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SupportTickets = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & State
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [adminStats, setAdminStats] = useState(null);

  // New Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Technical Issue',
    priority: 'Medium',
    description: '',
    attachmentUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Selected Ticket Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Rating State
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;

      const res = await api.tickets.getAll(params);
      if (res.success) {
        setTickets(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Stats
  const fetchAdminStats = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.tickets.getStats();
      if (res.success) {
        setAdminStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAdminStats();
  }, [statusFilter, categoryFilter]);

  // Open ticket detail and refresh content
  const handleSelectTicket = async (ticketId) => {
    try {
      const res = await api.tickets.getById(ticketId);
      if (res.success) {
        setSelectedTicket(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    }
  };

  // Handle Create Ticket
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      setError('Please fill in both subject and detailed description');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        description: newTicket.description,
        attachments: newTicket.attachmentUrl ? [newTicket.attachmentUrl] : [],
      };

      const res = await api.tickets.create(payload);
      if (res.success) {
        setSuccessMsg(`Ticket #${res.data.ticketId} created successfully!`);
        setShowCreateModal(false);
        setNewTicket({
          subject: '',
          category: 'Technical Issue',
          priority: 'Medium',
          description: '',
          attachmentUrl: '',
        });
        fetchTickets();
        if (isAdmin) fetchAdminStats();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Response Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const payload = {
        message: replyMessage,
        attachments: replyAttachment ? [replyAttachment] : [],
      };
      const res = await api.tickets.addResponse(selectedTicket._id, payload);
      if (res.success) {
        setSelectedTicket(res.data);
        setReplyMessage('');
        setReplyAttachment('');
        fetchTickets();
      }
    } catch (err) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Update Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await api.tickets.updateStatus(selectedTicket._id, newStatus);
      if (res.success) {
        setSelectedTicket(res.data);
        setSuccessMsg(`Ticket status updated to ${newStatus}`);
        fetchTickets();
        if (isAdmin) fetchAdminStats();
      }
    } catch (err) {
      setError(err.message || 'Failed to update ticket status');
    }
  };

  // Handle Submit Rating (FR-19.4)
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSubmittingRating(true);
      const res = await api.tickets.rate(selectedTicket._id, {
        stars: ratingStars,
        feedback: ratingFeedback,
      });
      if (res.success) {
        setSelectedTicket(res.data);
        setSuccessMsg('Thank you for rating your support experience!');
        fetchTickets();
        if (isAdmin) fetchAdminStats();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Open':
        return { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' };
      case 'In Progress':
        return { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' };
      case 'Resolved':
        return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)' };
      case 'Closed':
        return { backgroundColor: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.4)' };
      case 'Reopened':
        return { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' };
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return { color: '#f87171', fontWeight: '800' };
      case 'High':
        return { color: '#fb923c', fontWeight: '700' };
      case 'Medium':
        return { color: '#facc15', fontWeight: '600' };
      case 'Low':
        return { color: '#4ade80', fontWeight: '500' };
      default:
        return { color: '#94a3b8' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🎧 Support Ticket & Help Desk</h1>
          <p style={styles.subtitle}>
            Submit issues, track resolutions, and get help from platform administrators.
          </p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
          ➕ New Support Ticket
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button style={styles.closeBannerBtn} onClick={() => setError('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div style={styles.successBanner}>
          <span>✅ {successMsg}</span>
          <button style={styles.closeBannerBtn} onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      {/* Admin Performance Overview Card */}
      {isAdmin && adminStats && (
        <div className="glass" style={styles.adminStatsCard}>
          <h3 style={styles.adminStatsTitle}>⚙️ Platform Support Analytics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{adminStats.total}</span>
              <span style={styles.statLabel}>Total Tickets</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNumber, color: '#60a5fa' }}>{adminStats.open}</span>
              <span style={styles.statLabel}>Open</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNumber, color: '#c084fc' }}>{adminStats.inProgress}</span>
              <span style={styles.statLabel}>In Progress</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNumber, color: '#4ade80' }}>{adminStats.resolved}</span>
              <span style={styles.statLabel}>Resolved</span>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statNumber, color: '#facc15' }}>⭐ {adminStats.avgRating} / 5.0</span>
              <span style={styles.statLabel}>Avg Satisfaction</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass" style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status:</span>
          {['All', 'Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'].map((st) => (
            <button
              key={st}
              style={{
                ...styles.filterPill,
                ...(statusFilter === st ? styles.filterPillActive : {}),
              }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Category:</span>
          <select
            style={styles.selectInput}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Billing & Subscriptions">Billing & Subscriptions</option>
            <option value="Marketplace & Escrow">Marketplace & Escrow</option>
            <option value="Account & Security">Account & Security</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>
        </div>
      </div>

      {/* Tickets List Grid */}
      {loading ? (
        <div style={styles.loaderBox}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#94a3b8', marginTop: '12px' }}>Loading support tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass" style={styles.emptyState}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎫</div>
          <h3>No support tickets found</h3>
          <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '8px auto' }}>
            Have a question or running into an issue? Create a new support ticket to connect with our support team.
          </p>
          <button style={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
            Submit First Ticket
          </button>
        </div>
      ) : (
        <div style={styles.ticketGrid}>
          {tickets.map((t) => (
            <div
              key={t._id}
              className="glass card-hover"
              style={styles.ticketCard}
              onClick={() => handleSelectTicket(t._id)}
            >
              <div style={styles.cardHeaderRow}>
                <span style={styles.ticketIdBadge}>{t.ticketId}</span>
                <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(t.status) }}>
                  {t.status}
                </span>
              </div>

              <h3 style={styles.ticketSubject}>{t.subject}</h3>
              <p style={styles.ticketSnippet}>
                {t.description.length > 120 ? `${t.description.substring(0, 120)}...` : t.description}
              </p>

              <div style={styles.cardMetaRow}>
                <span style={styles.categoryPill}>{t.category}</span>
                <span style={getPriorityStyle(t.priority)}>⚡ {t.priority}</span>
              </div>

              <div style={styles.cardFooterRow}>
                <span style={styles.ticketDate}>
                  📅 {new Date(t.createdAt).toLocaleDateString()}
                </span>
                <span style={styles.replyCount}>
                  💬 {t.responses?.length || 0} replies
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h2>🚀 Create Support Ticket</h2>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Subject *</label>
                <input
                  type="text"
                  placeholder="Short title of the issue"
                  style={styles.textInput}
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Category</label>
                  <select
                    style={styles.textInput}
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                    <option value="Marketplace & Escrow">Marketplace & Escrow</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Priority Level</label>
                  <select
                    style={styles.textInput}
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Detailed Description *</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or request in detail..."
                  style={styles.textAreaInput}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Attachment URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/screenshot.png"
                  style={styles.textInput}
                  value={newTicket.attachmentUrl}
                  onChange={(e) => setNewTicket({ ...newTicket, attachmentUrl: e.target.value })}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELECTED TICKET DETAIL & CONVERSATION MODAL */}
      {selectedTicket && (
        <div style={styles.modalOverlay}>
          <div className="glass" style={styles.detailModalBox}>
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={styles.ticketIdBadge}>{selectedTicket.ticketId}</span>
                  <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(selectedTicket.status) }}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h2 style={{ marginTop: '6px', fontSize: '1.25rem', color: '#fff' }}>
                  {selectedTicket.subject}
                </h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            {/* Ticket Info Strip */}
            <div style={styles.infoStrip}>
              <div>
                <span style={styles.infoLabel}>Category:</span>
                <span style={styles.infoVal}>{selectedTicket.category}</span>
              </div>
              <div>
                <span style={styles.infoLabel}>Priority:</span>
                <span style={getPriorityStyle(selectedTicket.priority)}>{selectedTicket.priority}</span>
              </div>
              <div>
                <span style={styles.infoLabel}>Created By:</span>
                <span style={styles.infoVal}>
                  {selectedTicket.userId ? selectedTicket.userId.name : selectedTicket.guestInfo?.name || 'Guest User'}
                </span>
              </div>
              <div>
                <span style={styles.infoLabel}>Date:</span>
                <span style={styles.infoVal}>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Admin Status Controls */}
            {isAdmin && (
              <div style={styles.adminControlBar}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
                  Admin Actions: Change Ticket Status
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                    <button
                      key={st}
                      style={{
                        ...styles.statusBtn,
                        ...(selectedTicket.status === st ? styles.statusBtnActive : {}),
                      }}
                      onClick={() => handleStatusChange(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Description Box */}
            <div style={styles.ticketBodyBox}>
              <h4 style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: '6px' }}>Initial Issue Description</h4>
              <p style={{ color: '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description}
              </p>

              {selectedTicket.attachments?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📎 Attachments: </span>
                  {selectedTicket.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.attachmentLink}
                    >
                      View Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div style={styles.conversationContainer}>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '16px' }}>
                💬 Conversation & Response History ({selectedTicket.responses?.length || 0})
              </h4>

              {selectedTicket.responses?.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No responses yet. Write a message below to join the discussion.
                </p>
              ) : (
                <div style={styles.messageList}>
                  {selectedTicket.responses.map((resp, idx) => {
                    const isMe = resp.senderId?._id === user?.id || resp.senderName === user?.name;
                    const isStaff = resp.senderRole === 'admin';

                    return (
                      <div
                        key={idx}
                        style={{
                          ...styles.msgBubble,
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          backgroundColor: isStaff
                            ? 'rgba(99, 102, 241, 0.15)'
                            : isMe
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderColor: isStaff
                            ? 'rgba(99, 102, 241, 0.3)'
                            : isMe
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div style={styles.msgHeader}>
                          <span style={styles.msgSenderName}>
                            {resp.senderName} {isStaff ? '🛡️ (Admin Staff)' : ''}
                          </span>
                          <span style={styles.msgTime}>
                            {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={styles.msgText}>{resp.message}</p>
                        {resp.attachments?.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            {resp.attachments.map((a, i) => (
                              <a key={i} href={a} target="_blank" rel="noreferrer" style={styles.attachmentLink}>
                                📎 Attachment
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rating Section (FR-19.4) */}
            {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') && (
              <div style={styles.ratingBox}>
                <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', marginBottom: '8px' }}>
                  ⭐ Rate Support Experience (FR-19.4)
                </h4>

                {selectedTicket.rating?.stars ? (
                  <div style={{ color: '#4ade80', fontSize: '0.9rem' }}>
                    <span>You rated this support: </span>
                    <strong style={{ color: '#facc15' }}>
                      {'⭐'.repeat(selectedTicket.rating.stars)} ({selectedTicket.rating.stars}/5)
                    </strong>
                    {selectedTicket.rating.feedback && (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                        "{selectedTicket.rating.feedback}"
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRating} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          style={{
                            fontSize: '1.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: star <= ratingStars ? 1 : 0.3,
                            transition: 'transform 0.1s',
                          }}
                          onClick={() => setRatingStars(star)}
                        >
                          ⭐
                        </button>
                      ))}
                      <span style={{ color: '#fff', fontWeight: '700', marginLeft: '8px' }}>
                        {ratingStars} / 5 Stars
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional feedback comment on how we solved your issue..."
                      style={styles.textInput}
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                    />

                    <button
                      type="submit"
                      style={{ ...styles.primaryBtn, alignSelf: 'flex-start' }}
                      disabled={submittingRating}
                    >
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Reply Input Box */}
            {selectedTicket.status !== 'Closed' && (
              <form onSubmit={handleSendReply} style={styles.replyForm}>
                <textarea
                  rows={2}
                  placeholder="Type your response message here..."
                  style={styles.textAreaInput}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  required
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="url"
                    placeholder="Attachment link (optional)"
                    style={{ ...styles.textInput, width: '60%' }}
                    value={replyAttachment}
                    onChange={(e) => setReplyAttachment(e.target.value)}
                  />
                  <button type="submit" style={styles.primaryBtn} disabled={sendingReply}>
                    {sendingReply ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    transition: 'transform 0.2s',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successBanner: {
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#4ade80',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBannerBtn: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  adminStatsCard: {
    padding: '20px',
    borderRadius: '16px',
  },
  adminStatsTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#818cf8',
    marginBottom: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '4px',
  },
  toolbar: {
    padding: '16px 20px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterPill: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterPillActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366f1',
    color: '#fff',
  },
  selectInput: {
    backgroundColor: '#0f1117',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    outline: 'none',
  },
  loaderBox: {
    textAlign: 'center',
    padding: '48px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    margin: '0 auto',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    borderRadius: '16px',
  },
  ticketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  ticketCard: {
    padding: '20px',
    borderRadius: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketIdBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#818cf8',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  ticketSubject: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#fff',
    lineHeight: '1.3',
  },
  ticketSnippet: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    lineHeight: '1.4',
    flex: 1,
  },
  cardMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  categoryPill: {
    color: '#cbd5e1',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  cardFooterRow: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  ticketDate: {},
  replyCount: {
    fontWeight: '600',
    color: '#818cf8',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalBox: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  detailModalBox: {
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '20px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  textInput: {
    backgroundColor: '#0f1117',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  textAreaInput: {
    backgroundColor: '#0f1117',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  infoStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.8rem',
  },
  infoLabel: {
    color: '#64748b',
    marginRight: '6px',
  },
  infoVal: {
    color: '#fff',
    fontWeight: '600',
  },
  adminControlBar: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    padding: '12px 16px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  statusBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  statusBtnActive: {
    backgroundColor: '#6366f1',
    color: '#fff',
    borderColor: '#6366f1',
  },
  ticketBodyBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '16px',
    borderRadius: '12px',
  },
  attachmentLink: {
    color: '#60a5fa',
    fontSize: '0.8rem',
    textDecoration: 'underline',
    marginRight: '8px',
  },
  conversationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid transparent',
  },
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    gap: '16px',
  },
  msgSenderName: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#fff',
  },
  msgTime: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },
  msgText: {
    fontSize: '0.875rem',
    color: '#e2e8f0',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  ratingBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    padding: '16px',
    borderRadius: '12px',
  },
  replyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
  },
};

export default SupportTickets;
