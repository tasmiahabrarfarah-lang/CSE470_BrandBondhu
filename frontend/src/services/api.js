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
};
