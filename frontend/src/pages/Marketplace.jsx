import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Marketplace = () => {
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState(user?.role === 'designer' ? 'jobs' : 'browse');
  const [designers, setDesigners] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Browse filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Request Job Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobCategory, setJobCategory] = useState('Logo Design');
  const [jobBudget, setJobBudget] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [refImage, setRefImage] = useState('');

  // Selected Job Details Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [msgText, setMsgText] = useState('');

  // Deliverables form state
  const [delivFileName, setDelivFileName] = useState('');
  const [delivFileUrl, setDelivFileUrl] = useState('');
  const [delivNotes, setDelivNotes] = useState('');

  // Revision notes state
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  // Rating review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Dispute state
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [adminResolution, setAdminResolution] = useState('');
  const [adminAction, setAdminAction] = useState('release');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeSubTab === 'browse') {
        const res = await api.marketplace.getDesigners({ search, category: selectedCategory });
        setDesigners(res.data);
      } else {
        const res = await api.marketplace.getJobs();
        setJobs(res.data);
      }
    } catch (err) {
      console.error('Failed to load marketplace data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab, search, selectedCategory]);

  const openRequestModal = (designer) => {
    setSelectedDesigner(designer);
    setJobBudget(designer.portfolioInfo?.hourlyRate ? designer.portfolioInfo.hourlyRate * 5 : 2000);
    setShowRequestModal(true);
  };

  const handleRequestJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc || !jobBudget || !selectedDesigner) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.marketplace.requestJob({
        designerId: selectedDesigner._id,
        title: jobTitle,
        description: jobDesc,
        category: jobCategory,
        budget: Number(jobBudget),
        deadline: jobDeadline,
        referenceImages: refImage ? [refImage] : [],
      });

      if (res.success) {
        setSuccessMsg(`Job request "${jobTitle}" submitted and payment held in Escrow!`);
        setShowRequestModal(false);
        // Reset form
        setJobTitle('');
        setJobDesc('');
        setRefImage('');
        setActiveSubTab('jobs');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Job request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openJobModal = async (jobId) => {
    try {
      const res = await api.marketplace.getJobById(jobId);
      if (res.success) {
        setSelectedJob(res.data);
        setShowJobModal(true);
        setShowRevisionInput(false);
        setShowDisputeInput(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to open job');
    }
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedJob) return;

    try {
      const res = await api.marketplace.postMessage(selectedJob._id, { text: msgText });
      if (res.success) {
        setSelectedJob({ ...selectedJob, messages: res.data });
        setMsgText('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send message');
    }
  };

  const handleAcceptJob = async (jobId) => {
    try {
      const res = await api.marketplace.acceptJob(jobId);
      if (res.success) {
        setSuccessMsg('Job accepted successfully!');
        openJobModal(jobId);
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept job');
    }
  };

  const handleSubmitDeliverables = async (e) => {
    e.preventDefault();
    if (!delivFileName || !delivFileUrl || !selectedJob) return;

    setSubmitting(true);
    try {
      const res = await api.marketplace.submitDeliverables(selectedJob._id, {
        fileName: delivFileName,
        fileUrl: delivFileUrl,
        notes: delivNotes,
      });

      if (res.success) {
        setSuccessMsg('Deliverables submitted for seller review!');
        setSelectedJob(res.data);
        setDelivFileName('');
        setDelivFileUrl('');
        setDelivNotes('');
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit deliverables');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDeliverables = async (jobId) => {
    if (window.confirm('Are you sure you want to approve deliverables? This will release the escrow funds to the designer.')) {
      try {
        const res = await api.marketplace.approveDeliverables(jobId);
        if (res.success) {
          setSuccessMsg('Deliverables approved! Escrow payment released to designer.');
          setSelectedJob(res.data);
          loadData();
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to approve deliverables');
      }
    }
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await api.marketplace.requestRevision(selectedJob._id, revisionNotes);
      if (res.success) {
        setSuccessMsg('Revision request sent to designer.');
        setSelectedJob(res.data);
        setShowRevisionInput(false);
        setRevisionNotes('');
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request revision');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      const res = await api.marketplace.submitReview(selectedJob._id, {
        rating: Number(rating),
        comment: reviewComment,
      });

      if (res.success) {
        setSuccessMsg('Review submitted successfully!');
        setSelectedJob(res.data);
        setReviewComment('');
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review');
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!selectedJob || !disputeReason) return;

    try {
      const res = await api.marketplace.raiseDispute(selectedJob._id, disputeReason);
      if (res.success) {
        setSuccessMsg('Dispute submitted for Admin review.');
        setSelectedJob(res.data);
        setShowDisputeInput(false);
        setDisputeReason('');
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit dispute');
    }
  };

  const handleAdminResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedJob || !adminResolution) return;

    try {
      const res = await api.marketplace.resolveDispute(selectedJob._id, {
        resolution: adminResolution,
        action: adminAction,
      });

      if (res.success) {
        setSuccessMsg(`Dispute resolved by Admin (${adminAction.toUpperCase()}).`);
        setSelectedJob(res.data);
        setAdminResolution('');
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resolve dispute');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Requested':
        return <span className="badge badge-warning">Requested</span>;
      case 'Accepted':
      case 'In Progress':
        return <span className="badge badge-secondary">In Progress</span>;
      case 'Submitted':
        return <span className="badge badge-info" style={{ backgroundColor: '#0284c7' }}>Submitted</span>;
      case 'Approved':
      case 'Closed':
        return <span className="badge badge-success" style={{ backgroundColor: '#10b981' }}>Approved</span>;
      case 'Disputed':
        return <span className="badge badge-danger">Disputed</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.pageTitle}>🎨 Freelance Designer Marketplace</h2>
          <p style={styles.pageSubtitle}>Connect with verified Bangladeshi designers, request custom branding, escrow payments (FR-7)</p>
        </div>
      </div>

      {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}
      {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}

      {/* Navigation Sub-Tabs */}
      <div style={styles.tabContainer}>
        {user?.role !== 'designer' && (
          <button
            style={{ ...styles.tabBtn, ...(activeSubTab === 'browse' ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveSubTab('browse')}
          >
            🔍 Browse Designers
          </button>
        )}
        <button
          style={{ ...styles.tabBtn, ...(activeSubTab === 'jobs' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveSubTab('jobs')}
        >
          💼 {user?.role === 'designer' ? 'My Assigned Design Jobs' : 'My Design Requests'}
        </button>
      </div>

      {/* View 1: Browse Designers Directory */}
      {activeSubTab === 'browse' && (
        <>
          <div className="glass card" style={styles.filterCard}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className="form-input"
                placeholder="Search designers by name, skills (e.g. Logo, Banner, Bangla Typography)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading freelance designers...</div>
          ) : designers.length === 0 ? (
            <div className="glass card" style={styles.emptyCard}>
              <p style={{ color: '#94a3b8' }}>No designers matched your search parameters.</p>
            </div>
          ) : (
            <div style={styles.designerGrid}>
              {designers.map((des) => (
                <div key={des._id} className="glass card" style={styles.designerCard}>
                  <div style={styles.cardHeader}>
                    {des.profilePicture ? (
                      <img src={des.profilePicture} alt={des.name} style={styles.avatarImg} />
                    ) : (
                      <div style={styles.avatarCircle}>{des.name.substring(0, 2).toUpperCase()}</div>
                    )}
                    <div>
                      <h3 style={styles.designerName}>{des.name}</h3>
                      <div style={styles.ratingRow}>
                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>⭐ {des.rating}</span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({des.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p style={styles.bioText}>
                    {des.portfolioInfo?.bio || 'Experienced freelance visual designer specializing in brand identity.'}
                  </p>

                  <div style={styles.skillsRow}>
                    {des.portfolioInfo?.skills?.map((skill, idx) => (
                      <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div style={styles.rateRow}>
                    <span style={styles.rateLabel}>Hourly Rate:</span>
                    <span style={styles.rateValue}>৳{des.portfolioInfo?.hourlyRate || 500}/hr</span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '8px' }}
                    onClick={() => openRequestModal(des)}
                  >
                    🎨 Hire / Request Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* View 2: Design Jobs Workspace */}
      {activeSubTab === 'jobs' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="glass card" style={styles.emptyCard}>
              <p style={{ color: '#94a3b8' }}>No design jobs found in your history.</p>
            </div>
          ) : (
            <div style={styles.jobsList}>
              {jobs.map((j) => (
                <div key={j._id} className="glass card" style={styles.jobItemCard}>
                  <div style={styles.jobHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={styles.jobTitle}>{j.title}</h3>
                        {renderStatusBadge(j.status)}
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          🔒 Escrow: {j.escrowStatus}
                        </span>
                      </div>
                      <span style={styles.jobMeta}>
                        Category: {j.category} | Budget: ৳{j.budget} | Requested by:{' '}
                        {j.sellerId?.businessInfo?.businessName || j.sellerId?.name}
                      </span>
                    </div>

                    <button className="btn btn-secondary" onClick={() => openJobModal(j._id)}>
                      💬 Open Workspace Thread
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal 1: Request Custom Design Job (FR-7.3, FR-7.7) */}
      {showRequestModal && selectedDesigner && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>🎨 Request Custom Design from {selectedDesigner.name}</h3>
              <button style={styles.closeBtn} onClick={() => setShowRequestModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRequestJob} style={styles.modalForm}>
              <div style={styles.escrowNotice}>
                🔒 <strong>Escrow Guarantee:</strong> Payment of ৳{jobBudget || 0} will be held safely in escrow and only released to the designer after you approve the final deliverable.
              </div>

              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Modern Minimalist Logo for Bakery"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                >
                  <option value="Logo Design">Logo Design</option>
                  <option value="Poster / Banner">Poster / Banner</option>
                  <option value="Packaging & Label">Packaging & Label</option>
                  <option value="Social Media Graphics">Social Media Graphics</option>
                  <option value="Other Branding Asset">Other Branding Asset</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Budget (BDT ৳) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={jobBudget}
                  onChange={(e) => setJobBudget(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={jobDeadline}
                  onChange={(e) => setJobDeadline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reference Image / Inspiration Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/reference-design.png"
                  value={refImage}
                  onChange={(e) => setRefImage(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Requirements & Description *</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Provide details on brand colors, slogan, preferred style, etc."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  required
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting & Funding Escrow...' : 'Submit Request & Fund Escrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Job Workspace Thread & Actions */}
      {showJobModal && selectedJob && (
        <div style={styles.modalBackdrop}>
          <div className="glass card" style={{ ...styles.modalContent, maxWidth: '780px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>💼 {selectedJob.title}</h3>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {renderStatusBadge(selectedJob.status)}
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                    🔒 Escrow: {selectedJob.escrowStatus} (৳{selectedJob.budget})
                  </span>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowJobModal(false)}>✕</button>
            </div>

            {/* Action Bar based on role and job status */}
            <div style={styles.actionSection}>
              {user?.role === 'designer' && selectedJob.status === 'Requested' && (
                <button className="btn btn-primary" onClick={() => handleAcceptJob(selectedJob._id)}>
                  ✅ Accept Job Request
                </button>
              )}

              {user?.role !== 'designer' && selectedJob.status === 'Submitted' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={() => handleApproveDeliverables(selectedJob._id)}>
                    🎉 Approve Deliverables & Release Escrow
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowRevisionInput(!showRevisionInput)}>
                    🔄 Request Revision
                  </button>
                  <button className="btn btn-danger" onClick={() => setShowDisputeInput(!showDisputeInput)}>
                    ⚠️ Raise Dispute
                  </button>
                </div>
              )}
            </div>

            {/* Revision input form */}
            {showRevisionInput && (
              <form onSubmit={handleRevisionRequest} style={styles.subFormCard}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem' }}>Specify Revision Requirements:</h4>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Explain what changes are needed..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary" style={{ marginTop: '8px' }}>Send Revision Feedback</button>
              </form>
            )}

            {/* Dispute input form */}
            {showDisputeInput && (
              <form onSubmit={handleRaiseDispute} style={styles.subFormCard}>
                <h4 style={{ color: '#f87171', fontSize: '0.9rem' }}>Raise Job Dispute for Admin Resolution:</h4>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Explain why you are disputing this job..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-danger" style={{ marginTop: '8px' }}>Submit Dispute to Admin</button>
              </form>
            )}

            {/* Admin Dispute Moderation Form (FR-12.2) */}
            {user?.role === 'admin' && selectedJob.status === 'Disputed' && (
              <form onSubmit={handleAdminResolveDispute} style={{ ...styles.subFormCard, border: '1px solid #ef4444' }}>
                <h4 style={{ color: '#f87171', fontSize: '0.9rem' }}>⚖️ Admin Dispute Moderation Center</h4>
                <div className="form-group">
                  <label className="form-label">Decision Action:</label>
                  <select
                    className="form-input"
                    value={adminAction}
                    onChange={(e) => setAdminAction(e.target.value)}
                  >
                    <option value="release">Release Escrow (৳{selectedJob.budget}) to Designer</option>
                    <option value="refund">Refund Escrow (৳{selectedJob.budget}) to Seller</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Resolution Details / Statement:</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={adminResolution}
                    onChange={(e) => setAdminResolution(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Execute Admin Resolution</button>
              </form>
            )}

            {/* Deliverables Section (FR-7.5) */}
            <div style={styles.workspaceBlock}>
              <h4 style={styles.blockTitle}>📁 Deliverable Files</h4>
              {selectedJob.deliverableFiles?.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No deliverable files uploaded yet.</p>
              ) : (
                <div style={styles.filesList}>
                  {selectedJob.deliverableFiles.map((file, idx) => (
                    <div key={idx} style={styles.fileItem}>
                      <div>
                        <a href={file.fileUrl} target="_blank" rel="noreferrer" style={styles.fileNameLink}>
                          📄 {file.fileName}
                        </a>
                        {file.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{file.notes}</div>}
                      </div>
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.7rem' }}>
                        Download File
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Form for Designer */}
              {user?.role === 'designer' && (selectedJob.status === 'Accepted' || selectedJob.status === 'In Progress') && (
                <form onSubmit={handleSubmitDeliverables} style={{ ...styles.subFormCard, marginTop: '12px' }}>
                  <h5 style={{ color: '#fff', fontSize: '0.85rem' }}>Upload Deliverable File:</h5>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="File Name (e.g. FinalLogo.png)"
                      value={delivFileName}
                      onChange={(e) => setDelivFileName(e.target.value)}
                      required
                    />
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Deliverable File URL"
                      value={delivFileUrl}
                      onChange={(e) => setDelivFileUrl(e.target.value)}
                      required
                    />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Optional submission notes..."
                    value={delivNotes}
                    onChange={(e) => setDelivNotes(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', fontSize: '0.8rem' }} disabled={submitting}>
                    Submit Deliverables
                  </button>
                </form>
              )}
            </div>

            {/* In-platform Messaging Thread (FR-7.4) */}
            <div style={styles.workspaceBlock}>
              <h4 style={styles.blockTitle}>💬 Job Messaging Thread</h4>
              <div style={styles.chatBox}>
                {selectedJob.messages?.map((msg, idx) => (
                  <div key={idx} style={styles.chatMsg}>
                    <div style={styles.msgHeader}>
                      <span style={{ fontWeight: '700', color: '#6366f1', fontSize: '0.85rem' }}>{msg.senderName} ({msg.senderRole})</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' }}>{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handlePostMessage} style={styles.msgForm}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type a message to discuss project details..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
            </div>

            {/* 2-Way Rating & Review System (FR-7.6) */}
            {(selectedJob.status === 'Approved' || selectedJob.status === 'Closed') && (
              <div style={styles.workspaceBlock}>
                <h4 style={styles.blockTitle}>⭐ Ratings & Reviews</h4>
                {selectedJob.sellerReview && (
                  <div style={styles.reviewBox}>
                    <strong style={{ color: '#fff' }}>Seller's Review:</strong> ⭐ {selectedJob.sellerReview.rating}/5
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>"{selectedJob.sellerReview.comment}"</p>
                  </div>
                )}

                {selectedJob.designerReview && (
                  <div style={styles.reviewBox}>
                    <strong style={{ color: '#fff' }}>Designer's Review:</strong> ⭐ {selectedJob.designerReview.rating}/5
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>"{selectedJob.designerReview.comment}"</p>
                  </div>
                )}

                {/* Show review submission form if user hasn't reviewed yet */}
                {((user?.role !== 'designer' && !selectedJob.sellerReview) || (user?.role === 'designer' && !selectedJob.designerReview)) && (
                  <form onSubmit={handleSubmitReview} style={{ ...styles.subFormCard, marginTop: '12px' }}>
                    <h5 style={{ color: '#fff', fontSize: '0.85rem' }}>Leave Rating & Feedback:</h5>
                    <div className="form-group">
                      <label className="form-label">Rating Stars (1-5):</label>
                      <select
                        className="form-input"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
                        <option value="3">⭐⭐⭐ (3 - Average)</option>
                        <option value="2">⭐⭐ (2 - Poor)</option>
                        <option value="1">⭐ (1 - Terrible)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Review Comment:</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Post Review</button>
                  </form>
                )}
              </div>
            )}
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
  tabContainer: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
  },
  tabBtnActive: {
    color: '#fff',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  filterCard: {
    padding: '16px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
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
  emptyCard: {
    padding: '40px',
    textAlign: 'center',
  },
  designerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  designerCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatarImg: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1',
  },
  avatarCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: '#818cf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1rem',
  },
  designerName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
  },
  bioText: {
    fontSize: '0.825rem',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  skillsRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  rateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  rateLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  rateValue: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#38bdf8',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  jobItemCard: {
    padding: '20px',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  jobTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#fff',
  },
  jobMeta: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    width: '90%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '30px',
    backgroundColor: '#12131a',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '12px',
    marginBottom: '16px',
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
    gap: '12px',
  },
  escrowNotice: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: '#818cf8',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '0.825rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  actionSection: {
    marginBottom: '16px',
  },
  subFormCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  workspaceBlock: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '16px',
    marginTop: '16px',
  },
  blockTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '12px',
  },
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  fileNameLink: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  chatBox: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '12px',
  },
  chatMsg: {
    display: 'flex',
    flexDirection: 'column',
  },
  msgHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  msgForm: {
    display: 'flex',
    gap: '8px',
  },
  reviewBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
  },
};

export default Marketplace;
