import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthAPI } from '../api/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('feasy_token'));
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const savedToken = localStorage.getItem('feasy_token');
    if (!savedToken) {
      setUser(null);
      setTenant(null);
      setLoading(false);
      return;
    }
    try {
      const data = await AuthAPI.me();
      setUser(data.user);
      setTenant(data.tenant);
    } catch {
      localStorage.removeItem('feasy_token');
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const res = await AuthAPI.login({ email, password });
    localStorage.setItem('feasy_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setTenant(res.tenant);
    return res;
  };

  const register = async (payload) => {
    const res = await AuthAPI.register(payload);
    localStorage.setItem('feasy_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setTenant(res.tenant);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('feasy_token');
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        token,
        loading,
        login,
        register,
        logout,
        refresh: loadMe,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
