import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSessionUser: (nextUser: User) => void;
  refreshSession: () => Promise<void>;
}

const STORAGE_KEY = 'ecommerce-admin-auth';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthResponse;
        setUser(parsed.user);
        setToken(parsed.token);
        setRefreshToken(parsed.refreshToken);
        setTokenExpiresAt(parsed.tokenExpiresAt);
        sessionStorage.setItem(STORAGE_KEY, saved);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistAuth = useCallback((payload: AuthResponse | null) => {
    if (!payload) {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setTokenExpiresAt(null);
      return;
    }

    const serializedPayload = JSON.stringify(payload);
    sessionStorage.setItem(STORAGE_KEY, serializedPayload);
    localStorage.removeItem(STORAGE_KEY);
    setUser(payload.user);
    setToken(payload.token);
    setRefreshToken(payload.refreshToken);
    setTokenExpiresAt(payload.tokenExpiresAt);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      persistAuth(null);
      return;
    }

    try {
      const payload = await apiRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      persistAuth(payload);
    } catch {
      persistAuth(null);
    }
  }, [persistAuth, refreshToken]);

  useEffect(() => {
    if (!token || !tokenExpiresAt || !refreshToken) {
      return;
    }
    const expiresMs = new Date(tokenExpiresAt).getTime();
    const now = Date.now();
    const delay = Math.max(expiresMs - now - 60_000, 0);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    if (delay <= 0) {
      void refreshSession();
      return;
    }
    refreshTimerRef.current = window.setTimeout(() => {
      void refreshSession();
    }, delay);
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, tokenExpiresAt, refreshToken, refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      const payload = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!payload.user.isAdmin) {
        return false;
      }
      persistAuth(payload);
      return true;
    } catch {
      return false;
    }
  };

  const setSessionUser = (nextUser: User) => {
    if (!token || !refreshToken || !tokenExpiresAt) {
      setUser(nextUser);
      return;
    }

    persistAuth({
      token,
      refreshToken,
      tokenExpiresAt,
      user: nextUser,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout: () => persistAuth(null),
        isAuthenticated: Boolean(user && token),
        isHydrated,
        setSessionUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
