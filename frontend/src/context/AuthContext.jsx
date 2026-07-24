import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, navigate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check for existing token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (res.success) {
          setUser(res.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session restoration failed:', err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        navigate('/dashboard');
        return res;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(userData);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.verifyOTP({ email, otp });
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        navigate('/dashboard');
        return res;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.profile.update(profileData);
      if (res.success) {
        setUser(res.data);
        return res;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.success) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        verifyOTP,
        logout,
        updateProfile,
        refreshUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
