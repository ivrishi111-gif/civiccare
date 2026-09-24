import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api('/api/me')
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem('cc_token');
      })
      .finally(() => setLoading(false));
  }, []);

  function save(d) {
    localStorage.setItem('cc_token', d.token);
    setUser(d.user);
  }

  const login = async (email, password) => {
    const d = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    save(d);
    return d.user;
  };

  const signup = async (name, email, password) => {
    const d = await api('/api/auth/signup', { method: 'POST', body: { name, email, password } });
    save(d);
    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
