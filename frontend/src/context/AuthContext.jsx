import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMyProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('taskflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Fetch / verify session on initial mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('taskflow_token');
      if (savedToken) {
        try {
          const res = await getMyProfile();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('taskflow_user', JSON.stringify(res.user));
          }
        } catch {
          // Token invalid/expired
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();

    const handleAuthExpired = () => {
      logout();
      showToast('Your session has expired. Please sign in again.', 'error');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [showToast]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('taskflow_token', res.token);
      localStorage.setItem('taskflow_user', JSON.stringify(res.user));
      showToast(`Welcome back, ${res.user.name}!`);
      return res.user;
    }
    throw new Error('Invalid response from server.');
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('taskflow_token', res.token);
      localStorage.setItem('taskflow_user', JSON.stringify(res.user));
      showToast('Account created successfully!');
      return res.user;
    }
    throw new Error('Invalid response from server.');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
