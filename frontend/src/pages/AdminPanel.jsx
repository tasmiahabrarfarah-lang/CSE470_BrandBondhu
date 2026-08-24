import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AdminPanel = () => {
  const [activeSubTab, setActiveSubTab] = useState('users');
  
  // States
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  const [disputes, setDisputes] = useState([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [disputeMessageText, setDisputeMessageText] = useState('');

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [plans, setPlans] = useState({});
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlanKey, setEditingPlanKey] = useState(null);
  const [editingPlanForm, setEditingPlanForm] = useState({ name: '', price: 0, credits: 0, features: '' });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userSearch) params.search = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;
      if (userStatusFilter) params.status = userStatusFilter;

      const res = await api.admin.getUsers(params);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Disputes
  const fetchDisputes = async () => {
    try {
      setDisputesLoading(true);
      const res = await api.admin.getDisputes();
      if (res.success) {
        setDisputes(res.data);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setDisputesLoading(false);
    }
  };

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await api.subscriptions.getPlans();
      if (res.success) {
        setPlans(res.data);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setPlansLoading(false);
    }
  };

  // Fetch Platform Analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await api.admin.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchUsers();
    } else if (activeSubTab === 'disputes') {
      fetchDisputes();
      setSelectedDispute(null);
    } else if (activeSubTab === 'plans') {
      fetchPlans();
    } else if (activeSubTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeSubTab, userRoleFilter, userStatusFilter]);

  // Suspend user action
  const handleSuspend = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user? They will be locked out immediately.')) return;
    try {
      const res = await api.admin.suspendUser(userId);
      if (res.success) {
        triggerToast('User account suspended successfully');
        fetchUsers();
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Unsuspend user action
  const handleUnsuspend = async (userId) => {
    try {
      const res = await api.admin.unsuspendUser(userId);
      if (res.success) {
        triggerToast('User account unsuspended successfully');
        fetchUsers();
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Delete user action
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Permanently delete this account and subscription details? This is irreversible.')) return;
    try {
      const res = await api.admin.deleteUser(userId);
      if (res.success) {
        triggerToast('User deleted permanently');
        fetchUsers();
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (resolveTo) => {
    if (!resolutionNote.trim()) {
      alert('Please add explanation text for the dispute resolution.');
      return;
    }
    try {
      const res = await api.admin.resolveDispute(selectedDispute._id, {
        resolution: resolutionNote,
        resolveTo
      });
      if (res.success) {
        triggerToast(`Dispute resolved in favor of the ${resolveTo}`);
        fetchDisputes();
        setSelectedDispute(null);
        setResolutionNote('');
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Manage Pricing Plan Click
  const startEditPlan = (planKey, plan) => {
    setEditingPlanKey(planKey);
    setEditingPlanForm({
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      features: plan.features.join('\n')
    });
  };

  // Save Pricing Plan Changes
  const handleSavePlan = async () => {
    try {
      const updatedFeatures = editingPlanForm.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const res = await api.admin.updatePricingTier(editingPlanForm._id, {
        name: editingPlanForm.name,
        price: Number(editingPlanForm.price),
        credits: Number(editingPlanForm.credits),
        features: updatedFeatures
      });

      if (res.success) {
        triggerToast('Subscription plan updated successfully!');
        setEditingPlanKey(null);
        fetchPlans();
      }
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  return (
    <div style={styles.container}>
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981'
        }}>
          {toast.message}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.title}>🛠️ Admin Control Panel</h1>
        <p style={styles.subtitle}>Moderate user accounts, designer disputes, subscription rates, and view overall metrics.</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <button
          style={{ ...styles.tabBtn, ...(activeSubTab === 'users' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveSubTab('users')}
        >
          👤 User Accounts
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeSubTab === 'disputes' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveSubTab('disputes')}
        >
          ⚖️ Marketplace Disputes
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeSubTab === 'plans' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveSubTab('plans')}
        >
          💳 Subscription Plans
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeSubTab === 'analytics' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveSubTab('analytics')}
        >
          📈 Revenue & Metrics
        </button>
      </div>

      {/* View Sections */}
      <div className="glass" style={styles.sectionBody}>

        {/* 1. USERS LIST */}
        {activeSubTab === 'users' && (
          <div>
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={styles.searchInput}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={styles.selectInput}
              >
                <option value="">All Roles</option>
                <option value="seller">Seller</option>
                <option value="designer">Designer</option>
                <option value="collaborator">Collaborator</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                style={styles.selectInput}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <button onClick={fetchUsers} style={styles.primaryBtn}>Search</button>
            </div>

            {usersLoading ? (
              <div style={styles.loader}>Loading accounts...</div>
            ) : users.length === 0 ? (
              <div style={styles.emptyState}>No user records matching the filter.</div>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email / Phone</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.userNameText}>{u.name}</div>
                          {u.businessInfo?.businessName && (
                            <span style={styles.userSubtitle}>🏢 {u.businessInfo.businessName} ({u.businessInfo.industry})</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div>{u.email}</div>
                          <div style={styles.userSubtitle}>{u.phone}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: u.role === 'admin' ? '#ef4444' : u.role === 'designer' ? '#10b981' : '#3b82f6'
                          }}>{u.role.toUpperCase()}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: u.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : u.status === 'suspended' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: u.status === 'active' ? '#10b981' : u.status === 'suspended' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${u.status === 'active' ? '#10b981' : u.status === 'suspended' ? '#ef4444' : '#f59e0b'}`
                          }}>{u.status}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionsCell}>
                            {u.role !== 'admin' && u.status !== 'suspended' && (
                              <button onClick={() => handleSuspend(u._id)} style={styles.suspendBtn}>Suspend</button>
                            )}
                            {u.status === 'suspended' && (
                              <button onClick={() => handleUnsuspend(u._id)} style={styles.activateBtn}>Unsuspend</button>
                            )}
                            {u.role !== 'admin' && (
                              <button onClick={() => handleDeleteUser(u._id)} style={styles.deleteBtn}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. DISPUTE MODERATION */}
        {activeSubTab === 'disputes' && (
          <div style={styles.disputeGrid}>
            <div style={styles.disputesSide}>
              <h3>Open Dispute Tickets</h3>
              {disputesLoading ? (
                <div>Loading disputes...</div>
              ) : disputes.length === 0 ? (
                <div style={styles.emptyState}>No open designer disputes.</div>
              ) : (
                disputes.map(d => (
                  <div
                    key={d._id}
                    style={{
                      ...styles.disputeCard,
                      border: selectedDispute?._id === d._id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.05)'
                    }}
                    onClick={() => {
                      setSelectedDispute(d);
                      setResolutionNote('');
                    }}
                  >
                    <div style={styles.disputeCardTitle}>{d.title}</div>
                    <div style={styles.disputeCardSubtitle}>Budget: ৳{d.budget}</div>
                    <div style={styles.disputeReasonBadge}>Reason: {d.disputeDetails?.reason || 'Not specified'}</div>
                  </div>
                ))
              )}
            </div>

            <div style={styles.disputeDetails}>
              {selectedDispute ? (
                <div>
                  <h2 style={styles.disputeHeadline}>{selectedDispute.title}</h2>
                  <div style={styles.disputeMetaGrid}>
                    <div>
                      <span style={styles.label}>Seller (Client)</span>
                      <p>{selectedDispute.sellerId?.name || 'Seller'} ({selectedDispute.sellerId?.email})</p>
                    </div>
                    <div>
                      <span style={styles.label}>Designer (Freelancer)</span>
                      <p>{selectedDispute.designerId?.name || 'Designer'} ({selectedDispute.designerId?.email})</p>
                    </div>
                    <div>
                      <span style={styles.label}>Budget Escrow Status</span>
                      <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>৳{selectedDispute.budget} - {selectedDispute.escrowStatus}</p>
                    </div>
                  </div>

                  <div style={styles.conversationLog}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>Project Messaging Log</h3>
                    <div style={styles.messagesBox}>
                      {selectedDispute.messages && selectedDispute.messages.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '16px' }}>No conversation logged inside the project.</div>
                      ) : (
                        selectedDispute.messages.map((m, idx) => (
                          <div key={idx} style={styles.msgLine}>
                            <strong style={{ color: m.senderRole === 'designer' ? '#10b981' : '#3b82f6' }}>{m.senderName} ({m.senderRole}):</strong>
                            <span style={{ marginLeft: '8px', color: '#cbd5e1' }}>{m.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={styles.deliverablesSection}>
                    <h3 style={{ color: '#fff' }}>Submitted Deliverables</h3>
                    {selectedDispute.deliverableFiles && selectedDispute.deliverableFiles.length === 0 ? (
                      <p style={{ color: '#64748b' }}>No files uploaded by designer.</p>
                    ) : (
                      selectedDispute.deliverableFiles.map((file, idx) => (
                        <div key={idx} style={styles.fileLink}>
                          <span>📄 {file.fileName}</span>
                          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.downloadBtnLink}>Download</a>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={styles.resolutionForm}>
                    <h3>Resolution Settlement</h3>
                    <textarea
                      placeholder="Explain the final judgment/resolution detail to both parties..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      style={styles.textarea}
                      rows={4}
                    />

                    <div style={styles.btnGroup}>
                      <button
                        onClick={() => handleResolveDispute('seller')}
                        style={{ ...styles.primaryBtn, backgroundColor: '#dc2626' }}
                      >
                        Refund Seller (Escrow Back)
                      </button>
                      <button
                        onClick={() => handleResolveDispute('designer')}
                        style={{ ...styles.primaryBtn, backgroundColor: '#059669' }}
                      >
                        Release to Designer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.selectPrompt}>Select a dispute ticket from the sidebar to moderate.</div>
              )}
            </div>
          </div>
        )}

        {/* 3. SUBSCRIPTION TIERS */}
        {activeSubTab === 'plans' && (
          <div>
            <h3>Subscription Plan Pricing Manager</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Edits are saved to the database and will refresh pricing rates for all users.</p>
            {plansLoading ? (
              <div>Loading Plans...</div>
            ) : (
              <div style={styles.plansGrid}>
                {Object.keys(plans).map(key => {
                  const plan = plans[key];
                  const isEditing = editingPlanKey === key;
                  return (
                    <div key={key} className="glass" style={styles.planCard}>
                      {isEditing ? (
                        <div style={styles.planEditForm}>
                          <label style={styles.label}>Plan Display Name</label>
                          <input
                            type="text"
                            value={editingPlanForm.name}
                            onChange={(e) => setEditingPlanForm({ ...editingPlanForm, name: e.target.value })}
                            style={styles.textInput}
                          />

                          <label style={styles.label}>Price (BDT / month)</label>
                          <input
                            type="number"
                            value={editingPlanForm.price}
                            onChange={(e) => setEditingPlanForm({ ...editingPlanForm, price: e.target.value })}
                            style={styles.textInput}
                          />

                          <label style={styles.label}>Monthly Credits Granted</label>
                          <input
                            type="number"
                            value={editingPlanForm.credits}
                            onChange={(e) => setEditingPlanForm({ ...editingPlanForm, credits: e.target.value })}
                            style={styles.textInput}
                          />

                          <label style={styles.label}>Features (One per line)</label>
                          <textarea
                            value={editingPlanForm.features}
                            onChange={(e) => setEditingPlanForm({ ...editingPlanForm, features: e.target.value })}
                            style={styles.textarea}
                            rows={5}
                          />

                          <div style={styles.btnGroup}>
                            <button onClick={handleSavePlan} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setEditingPlanKey(null)} style={styles.cancelBtn}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={styles.planHeaderRow}>
                            <span style={styles.planNameTitle}>{plan.name}</span>
                            <span style={styles.planTagText}>({key})</span>
                          </div>
                          <div style={styles.planPriceText}>৳{plan.price} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/ month</span></div>
                          <div style={styles.planCreditsCount}>{plan.credits} credits / month</div>
                          <ul style={styles.featuresList}>
                            {plan.features.map((feat, idx) => (
                              <li key={idx} style={styles.featureItem}>✓ {feat}</li>
                            ))}
                          </ul>
                          <button onClick={() => startEditPlan(key, plan)} style={styles.editPlanBtn}>Edit Pricing & Limits</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. METRICS & REVENUE */}
        {activeSubTab === 'analytics' && (
          <div>
            {analyticsLoading || !analytics ? (
              <div style={styles.loader}>Calculating platform-wide metrics...</div>
            ) : (
              <div>
                {/* Scorecards */}
                <div style={styles.analyticsGrid}>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Total Accumulated Revenue</div>
                    <div style={styles.metricValue}>৳{analytics.revenue.totalRevenue}</div>
                    <div style={styles.metricSub}>{analytics.revenue.transactionCount} completed orders</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Platform Registration Count</div>
                    <div style={styles.metricValue}>{analytics.users.total}</div>
                    <div style={styles.metricSub}>Sellers: {analytics.users.sellers} | Designers: {analytics.users.designers}</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.metricLabel}>Active / Suspended</div>
                    <div style={styles.metricValue}>{analytics.users.active} <span style={{ fontSize: '1rem', color: '#dc2626' }}>/ {analytics.users.suspended}</span></div>
                    <div style={styles.metricSub}>Suspensions block API and logins</div>
                  </div>
                </div>

                <div style={styles.analysisRow}>
                  {/* Subscriptions Tier Distribution */}
                  <div className="glass" style={styles.chartPanel}>
                    <h3>Active Subscription Packages</h3>
                    <div style={styles.analyticsList}>
                      <div style={styles.analyticsListItem}>
                        <span>Free Starter Tiers:</span>
                        <strong>{analytics.subscriptions.free} accounts</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Basic Brand Tiers:</span>
                        <strong>{analytics.subscriptions.basic} accounts</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Premium Growth Tiers:</span>
                        <strong>{analytics.subscriptions.premium} accounts</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Enterprise Scale Tiers:</span>
                        <strong>{analytics.subscriptions.enterprise} accounts</strong>
                      </div>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="glass" style={styles.chartPanel}>
                    <h3>System Resources Utilized</h3>
                    <div style={styles.analyticsList}>
                      <div style={styles.analyticsListItem}>
                        <span>AI Brand Identity Kits Generated:</span>
                        <strong>{analytics.usage.brandKits}</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Social Posts Scheduled:</span>
                        <strong>{analytics.usage.scheduledPosts}</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Posts Successfully Published:</span>
                        <strong>{analytics.usage.publishedPosts}</strong>
                      </div>
                      <div style={styles.analyticsListItem}>
                        <span>Freelance Design Jobs Opened:</span>
                        <strong>{analytics.usage.designJobs}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '8px 0',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.975rem',
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '12px 24px',
    borderRadius: '12px',
    color: '#fff',
    zIndex: 1000,
    fontWeight: '700',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease-out',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '8px',
  },
  tabBtn: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    color: '#fff',
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderBottom: '2px solid #6366f1',
  },
  sectionBody: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(17,18,25,0.4)',
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
  },
  selectInput: {
    padding: '10px 16px',
    backgroundColor: '#161720',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer',
  },
  primaryBtn: {
    padding: '10px 24px',
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '16px',
    color: '#e2e8f0',
  },
  userNameText: {
    fontWeight: 'bold',
  },
  userSubtitle: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '4px',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  actionsCell: {
    display: 'flex',
    gap: '8px',
  },
  suspendBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  activateBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  deleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    color: '#fb7185',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  loader: {
    textAlign: 'center',
    padding: '48px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b',
  },
  disputeGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px',
  },
  disputesSide: {
    borderRight: '1px solid rgba(255,255,255,0.06)',
    paddingRight: '20px',
  },
  disputeCard: {
    padding: '16px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  disputeCardTitle: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px',
  },
  disputeCardSubtitle: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  disputeReasonBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    marginTop: '8px',
  },
  disputeDetails: {
    paddingLeft: '12px',
  },
  disputeHeadline: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
  },
  disputeMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '16px',
    borderRadius: '10px',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  conversationLog: {
    marginBottom: '24px',
  },
  messagesBox: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#0a0a0f',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  msgLine: {
    marginBottom: '12px',
    fontSize: '0.85rem',
  },
  deliverablesSection: {
    marginBottom: '24px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '16px',
    borderRadius: '10px',
  },
  fileLink: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    marginTop: '8px',
  },
  downloadBtnLink: {
    color: '#818cf8',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  resolutionForm: {
    backgroundColor: 'rgba(99, 102, 241, 0.03)',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    padding: '20px',
    borderRadius: '12px',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    backgroundColor: '#0a0a0f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
    marginTop: '12px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  selectPrompt: {
    height: '250px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontWeight: '600',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginTop: '16px',
  },
  planCard: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  planHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  planNameTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  planTagText: {
    fontSize: '0.75rem',
    color: '#6366f1',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  planPriceText: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
  },
  planCreditsCount: {
    fontSize: '0.9rem',
    color: '#10b981',
    fontWeight: '700',
    marginBottom: '20px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  featureItem: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  editPlanBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  planEditForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textInput: {
    padding: '10px',
    backgroundColor: '#0a0a0f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.9rem',
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '28px',
  },
  metricCard: {
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
  },
  metricSub: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  analysisRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  chartPanel: {
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  analyticsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  analyticsListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '8px',
    fontSize: '0.9rem',
    color: '#cbd5e1',
  },
};
