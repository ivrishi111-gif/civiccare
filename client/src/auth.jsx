import { createContext, useContext, useEffect, useState } from 'react';
import { me, authorityMe } from './api.js';

// Two independent sessions:
//   localStorage cc_token     → citizen (users)
//   localStorage cc_auth_token → authority (municipal staff)
// They never share a token, so a citizen can never get authority access.
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_user') || 'null');
    } catch {
      return null;
    }
  });
  const [authority, setAuthority] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_authority') || 'null');
    } catch {
      return null;
    }
  });

  const loginAs = (kind, token, record) => {
    localStorage.setItem(kind === 'authority' ? 'cc_auth_token' : 'cc_token', token);
    if (kind === 'authority') {
      localStorage.setItem('cc_authority', JSON.stringify(record));
      setAuthority(record);
    } else {
      localStorage.setItem('cc_user', JSON.stringify(record));
      setUser(record);
    }
  };

  const logout = (kind) => {
    if (kind === 'authority') {
      localStorage.removeItem('cc_auth_token');
      localStorage.removeItem('cc_authority');
      setAuthority(null);
    } else {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      setUser(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    me()
      .then((d) => {
        const record = d.user;
        localStorage.setItem('cc_user', JSON.stringify(record));
        setUser(record);
      })
      .catch(() => {
        logout();
      });
  }, []);

  useEffect(() => {
    if (!authority) return;
    authorityMe()
      .then((d) => {
        const record = d.authority;
        localStorage.setItem('cc_authority', JSON.stringify(record));
        setAuthority(record);
      })
      .catch(() => {
        logout('authority');
      });
  }, []);

  return <Ctx.Provider value={{ user, authority, loginAs, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
