import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.startsWith('192.168.') &&
  !window.location.hostname.startsWith('10.')
    ? 'https://ccms-n753.onrender.com' 
    : ''
);

/**
 * Safely resolves relative and absolute media/upload URLs
 */
export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanBase = (API_BASE || '').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ccms_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ccms_token') || null);
  
  // Instant load: never block rendering if logged out or if cached user is present
  const [loading, setLoading] = useState(() => {
    try {
      const savedToken = localStorage.getItem('ccms_token');
      const savedUser = localStorage.getItem('ccms_user');
      return !!(savedToken && !savedUser);
    } catch {
      return false;
    }
  });

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ccms_user');
    localStorage.removeItem('ccms_token');
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try { controller.abort(); } catch {}
      if (isMounted) setLoading(false);
    }, 3500);

    async function verifySession() {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user);
            localStorage.setItem('ccms_user', JSON.stringify(data.user));
          }
        } else if (res.status === 401 || res.status === 403) {
          logout();
        }
      } catch (err) {
        console.warn('Session verify note (cold start or offline):', err.message);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('ccms_user', JSON.stringify(data.user));
    localStorage.setItem('ccms_token', data.token);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('ccms_user', JSON.stringify(data.user));
    localStorage.setItem('ccms_token', data.token);
    return data.user;
  }, []);

  // Optimized memoized helper fetch with auth headers
  const authFetch = useCallback(async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (isFormData) {
      delete headers['Content-Type'];
    } else if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(fullUrl, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    return res;
  }, [token, logout]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    authFetch,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isStudent: user?.role === 'student'
  }), [user, token, loading, login, register, logout, authFetch]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
