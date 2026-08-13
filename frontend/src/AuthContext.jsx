import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.fetchMe()
      .then(({ user }) => { if (!cancelled) setUser(user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  const doSignup = useCallback(async (email, password, name) => {
    const { user } = await api.signup(email, password, name);
    setUser(user);
  }, []);

  const doLogin = useCallback(async (email, password) => {
    const { user } = await api.login(email, password);
    setUser(user);
  }, []);

  const doLogout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, checking, signup: doSignup, login: doLogin, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
