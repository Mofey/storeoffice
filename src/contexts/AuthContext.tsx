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

interface StoredAuth extends AuthResponse {
  savedAt?: string;
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
const REFRESH_BUFFER_MS = 60_000;
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

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setTokenExpiresAt(null);
  }, []);

  const applyAuth = useCallback((payload: AuthResponse) => {
    const serializedPayload = JSON.stringify({
      ...payload,
      savedAt: new Date().toISOString(),
    } satisfies StoredAuth);
    localStorage.setItem(STORAGE_KEY, serializedPayload);
    sessionStorage.setItem(STORAGE_KEY, serializedPayload);
    setUser(payload.user);
    setToken(payload.token);
    setRefreshToken(payload.refreshToken);
    setTokenExpiresAt(payload.tokenExpiresAt);
  }, []);

  const requestSessionRefresh = useCallback(
    async (refreshTokenValue: string) => {
      const payload = await apiRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
      applyAuth(payload);
      return payload;
    },
    [applyAuth]
  );

  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved) as StoredAuth;
        if (!parsed.refreshToken) {
          clearAuth();
          return;
        }

        const expiresAtMs = parsed.tokenExpiresAt ? new Date(parsed.tokenExpiresAt).getTime() : 0;
        const shouldRefresh = !parsed.token || !expiresAtMs || expiresAtMs - Date.now() <= REFRESH_BUFFER_MS;

        if (shouldRefresh) {
          try {
            await requestSessionRefresh(parsed.refreshToken);
          } catch {
            clearAuth();
          }
          return;
        }

        if (!isMounted) {
          return;
        }

        applyAuth(parsed);
      } catch {
        clearAuth();
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, [applyAuth, clearAuth, requestSessionRefresh]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      clearAuth();
      return;
    }

    try {
      await requestSessionRefresh(refreshToken);
    } catch {
      clearAuth();
    }
  }, [clearAuth, refreshToken, requestSessionRefresh]);

  useEffect(() => {
    if (!token || !tokenExpiresAt || !refreshToken) {
      return;
    }
    const expiresMs = new Date(tokenExpiresAt).getTime();
    const now = Date.now();
    const delay = Math.max(expiresMs - now - REFRESH_BUFFER_MS, 0);
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!payload.user.isAdmin) {
        return false;
      }
      applyAuth(payload);
      return true;
    } catch {
      return false;
    }
  }, [applyAuth]);

  const setSessionUser = (nextUser: User) => {
    if (!token || !refreshToken || !tokenExpiresAt) {
      setUser(nextUser);
      return;
    }

    applyAuth({
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
        logout: clearAuth,
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
