import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guestMode = localStorage.getItem('guestMode');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else if (guestMode) {
      setIsGuest(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.removeItem('guestMode');
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    setIsGuest(false);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.removeItem('guestMode');
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    setIsGuest(false);
    return userData;
  };

  const loginWithGoogle = async (token) => {
    const res = await api.post('/auth/google-login', { token });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.removeItem('guestMode');
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    setIsGuest(false);
    return userData;
  };

  const continueAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsGuest(true);
    setUser(null);
  };

  const clearGuest = () => {
    localStorage.removeItem('guestMode');
    setIsGuest(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('guestMode');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsGuest(false);
    toast.success('Logged out successfully');
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, login, register, loginWithGoogle, continueAsGuest, clearGuest, logout, updateUser, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
