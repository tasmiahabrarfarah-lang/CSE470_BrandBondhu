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
