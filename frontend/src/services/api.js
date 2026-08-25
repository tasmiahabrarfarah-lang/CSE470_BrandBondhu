const BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api');

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Authentication
  auth: {
    register: (body) => 
      fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    verifyOTP: (body) => 
      fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    login: (body) => 
      fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    getMe: () => 
      fetch(`${BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    forgotPassword: (body) => 
      fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    resetPassword: (body) => 
      fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    deactivate: () => 
      fetch(`${BASE_URL}/auth/deactivate`, {
        method: 'POST',
        headers: getHeaders()
      }).then(handleResponse),

    delete: () => 
      fetch(`${BASE_URL}/auth/delete`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Profiles and Collaborators (FR-1 & FR-17)
  profile: {
    update: (body) => 
      fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    getCollaborators: () => 
      fetch(`${BASE_URL}/profile/collaborators`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    inviteCollaborator: (body) => 
      fetch(`${BASE_URL}/profile/collaborators`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    updateCollaboratorPermissions: (id, permissions) => 
      fetch(`${BASE_URL}/profile/collaborators/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ permissions })
      }).then(handleResponse),

    removeCollaborator: (id) => 
      fetch(`${BASE_URL}/profile/collaborators/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),

    getAuditLogs: () =>
      fetch(`${BASE_URL}/profile/audit-logs`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Product Catalog Management (FR-13)
  products: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/products${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },

    getById: (id) => 
      fetch(`${BASE_URL}/products/${id}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    create: (body) => 
      fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    update: (id, body) => 
      fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    delete: (id) => 
      fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),

    bulkUpload: (products) => 
      fetch(`${BASE_URL}/products/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ products })
      }).then(handleResponse),

    getCategories: () => 
      fetch(`${BASE_URL}/products/categories`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    autoPull: (id) => 
      fetch(`${BASE_URL}/products/${id}/auto-pull`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Freelance Designer Marketplace (FR-7)
  marketplace: {
    getDesigners: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/marketplace/designers${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },

    getDesignerProfile: (id) => 
      fetch(`${BASE_URL}/marketplace/designers/${id}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    requestJob: (body) => 
      fetch(`${BASE_URL}/marketplace/jobs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    getJobs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/marketplace/jobs${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },

    getJobById: (id) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    acceptJob: (id) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/accept`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),

    submitDeliverables: (id, body) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/deliver`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    approveDeliverables: (id) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),

    requestRevision: (id, revisionNotes) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/revision`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ revisionNotes })
      }).then(handleResponse),

    postMessage: (id, body) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    submitReview: (id, body) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/review`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    raiseDispute: (id, reason) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/dispute`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason })
      }).then(handleResponse),

    resolveDispute: (id, body) => 
      fetch(`${BASE_URL}/marketplace/jobs/${id}/resolve-dispute`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
  },

  // Subscriptions (FR-10)
  subscriptions: {
    getPlans: () => 
      fetch(`${BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    getMySubscription: () => 
      fetch(`${BASE_URL}/subscriptions/my`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    consume: (amount = 1) => 
      fetch(`${BASE_URL}/subscriptions/consume`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ amount })
      }).then(handleResponse),
  },

  // Payments (FR-10)
  payments: {
    initiate: (tier, gateway) => 
      fetch(`${BASE_URL}/payments/initiate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tier, gateway })
      }).then(handleResponse),

    confirm: (transactionId) => 
      fetch(`${BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ transactionId })
      }).then(handleResponse),

    getHistory: () => 
      fetch(`${BASE_URL}/payments/history`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Notifications (FR-11)
  notifications: {
    get: () => 
      fetch(`${BASE_URL}/notifications`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    markRead: (id) => 
      fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),

    markAllRead: () => 
      fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Analytics, Sentiment & Competitors (FR-5, FR-6, FR-9)
  analytics: {
    getDashboardStats: () => 
      fetch(`${BASE_URL}/analytics/dashboard`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    getSentimentAnalysis: () => 
      fetch(`${BASE_URL}/analytics/sentiment`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    syncSentimentComments: () => 
      fetch(`${BASE_URL}/analytics/sentiment/sync`, {
        method: 'POST',
        headers: getHeaders()
      }).then(handleResponse),

    getCompetitors: () => 
      fetch(`${BASE_URL}/analytics/competitors`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    addCompetitor: (body) => 
      fetch(`${BASE_URL}/analytics/competitors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
  },

  // AI Brand Identity Generation (FR-2)
  brandKit: {
    generate: (body) =>
      fetch(`${BASE_URL}/brand-kit/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    getAll: () =>
      fetch(`${BASE_URL}/brand-kit`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    getActive: () =>
      fetch(`${BASE_URL}/brand-kit/active`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    setActive: (id) =>
      fetch(`${BASE_URL}/brand-kit/${id}/set-active`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),

    update: (id, body) =>
      fetch(`${BASE_URL}/brand-kit/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    delete: (id) =>
      fetch(`${BASE_URL}/brand-kit/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),

    regenerateAsset: (id, assetType) =>
      fetch(`${BASE_URL}/brand-kit/${id}/regenerate-asset`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ assetType })
      }).then(handleResponse),
  },

  // Content Generation & Scheduling (FR-3)
  content: {
    generateCaption: (body) =>
      fetch(`${BASE_URL}/content/generate-caption`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    createPost: (body) =>
      fetch(`${BASE_URL}/content/posts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    getPosts: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/content/posts${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },

    getPostById: (id) =>
      fetch(`${BASE_URL}/content/posts/${id}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    updatePost: (id, body) =>
      fetch(`${BASE_URL}/content/posts/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    deletePost: (id) =>
      fetch(`${BASE_URL}/content/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),

    triggerReminders: () =>
      fetch(`${BASE_URL}/content/posts/trigger-reminders`, {
        method: 'POST',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Poster/Banner Template Editor (FR-4)
  templates: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/templates${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },

    getById: (id) =>
      fetch(`${BASE_URL}/templates/${id}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),

    createCustom: (body) =>
      fetch(`${BASE_URL}/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    updateCustom: (id, body) =>
      fetch(`${BASE_URL}/templates/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),

    deleteCustom: (id) =>
      fetch(`${BASE_URL}/templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Admin Control Panel (FR-12)
  admin: {
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetch(`${BASE_URL}/admin/users${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse);
    },
    suspendUser: (id) =>
      fetch(`${BASE_URL}/admin/users/${id}/suspend`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),
    unsuspendUser: (id) =>
      fetch(`${BASE_URL}/admin/users/${id}/unsuspend`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),
    deleteUser: (id) =>
      fetch(`${BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),
    getDisputes: () =>
      fetch(`${BASE_URL}/admin/disputes`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    resolveDispute: (id, body) =>
      fetch(`${BASE_URL}/admin/disputes/${id}/resolve`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    getAnalytics: () =>
      fetch(`${BASE_URL}/admin/analytics`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    updatePricingTier: (id, body) =>
      fetch(`${BASE_URL}/admin/pricing-tiers/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
  },

  // Gamification (Branding Score) (FR-8)
  gamification: {
    getProfile: () =>
      fetch(`${BASE_URL}/gamification/profile`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    toggleLeaderboard: (optIn) =>
      fetch(`${BASE_URL}/gamification/leaderboard/toggle`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ optIn })
      }).then(handleResponse),
    getLeaderboard: () =>
      fetch(`${BASE_URL}/gamification/leaderboard`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Hashtag & SEO Suggestion Generator (FR-14)
  hashtags: {
    generate: (body) =>
      fetch(`${BASE_URL}/hashtags/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    getTemplates: () =>
      fetch(`${BASE_URL}/hashtags/templates`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    saveTemplate: (body) =>
      fetch(`${BASE_URL}/hashtags/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    updateTemplate: (id, body) =>
      fetch(`${BASE_URL}/hashtags/templates/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    deleteTemplate: (id) =>
      fetch(`${BASE_URL}/hashtags/templates/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // FAQ Manager (FR-Group 2)
  faq: {
    getAll: () =>
      fetch(`${BASE_URL}/faq`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    create: (body) =>
      fetch(`${BASE_URL}/faq`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    update: (id, body) =>
      fetch(`${BASE_URL}/faq/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    delete: (id) =>
      fetch(`${BASE_URL}/faq/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse),
  },

  // Brand Style Guide Export (FR-15)
  styleGuide: {
    get: (brandKitId) =>
      fetch(`${BASE_URL}/style-guide${brandKitId ? `/${brandKitId}` : ''}`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
    updateConfig: (brandKitId, body) =>
      fetch(`${BASE_URL}/style-guide/${brandKitId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse),
    exportPDF: (brandKitId) =>
      fetch(`${BASE_URL}/style-guide/${brandKitId}/export`, {
        method: 'GET',
        headers: getHeaders()
      }).then(handleResponse),
  },
};
